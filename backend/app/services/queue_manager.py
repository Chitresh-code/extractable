"""
Queue manager for extraction jobs.
Manages per-user queues with priority support.
Only one extraction runs per user at a time.
"""
import asyncio
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.extraction import Extraction
from app.models.enums import ExtractionStatus
from app.pipeline.extraction_pipeline import run_extraction_pipeline
from app.services.event_manager import event_manager
from app.core.database import SessionLocal
from io import BytesIO
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)


class ExtractionQueueManager:
    """Manages extraction queues per user with priority support."""

    def __init__(self):
        # Map of user_id -> asyncio.Queue of (priority, extraction_id, file_content, filename)
        self._user_queues: Dict[int, asyncio.Queue] = {}
        # Map of user_id -> currently processing extraction ID
        self._processing: Dict[int, Optional[int]] = {}
        # Map of extraction_id -> (file_content, filename) for temporary storage
        self._file_storage: Dict[int, Tuple[bytes, str]] = {}
        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def enqueue_extraction(
        self, extraction_id: int, user_id: int, file_content: bytes, filename: str, priority: str = "medium"
    ):
        """
        Add extraction to user's queue based on priority.

        Args:
            extraction_id: Extraction ID
            user_id: User ID
            file_content: File content as bytes
            filename: Original filename
            priority: Priority level (high, medium, low)
        """
        # Store file content temporarily
        self._file_storage[extraction_id] = (file_content, filename)

        async with self._lock:
            if user_id not in self._user_queues:
                self._user_queues[user_id] = asyncio.Queue()
                self._processing[user_id] = None

            queue = self._user_queues[user_id]
            queue_item = (priority, extraction_id)

            # Priority handling
            if priority == "high":
                # High priority: insert at front (after current if processing)
                temp_items = []
                while not queue.empty():
                    try:
                        item = queue.get_nowait()
                        temp_items.append(item)
                    except asyncio.QueueEmpty:
                        break

                # Put high priority first, then others
                await queue.put(queue_item)
                for item in temp_items:
                    await queue.put(item)
            elif priority == "low":
                # Low priority: add to end
                await queue.put(queue_item)
            else:
                # Medium priority: add after high priority items
                temp_items = []
                found_insert = False
                while not queue.empty():
                    try:
                        item = queue.get_nowait()
                        if item[0] == "high":
                            temp_items.append(item)
                        elif not found_insert:
                            # Insert medium after high priority items
                            for temp_item in temp_items:
                                await queue.put(temp_item)
                            await queue.put(queue_item)
                            await queue.put(item)
                            found_insert = True
                        else:
                            await queue.put(item)
                    except asyncio.QueueEmpty:
                        break

                if not found_insert:
                    # No high priority items, add medium at front
                    for temp_item in temp_items:
                        await queue.put(temp_item)
                    await queue.put(queue_item)

            logger.info(
                f"Enqueued extraction {extraction_id} for user {user_id} with priority {priority}"
            )

            # Start processing if not already processing
            if self._processing.get(user_id) is None:
                asyncio.create_task(self.process_queue(user_id))

    async def process_queue(self, user_id: int):
        """
        Process extraction queue for a user.
        Only one extraction runs at a time per user.

        Args:
            user_id: User ID
        """
        db = SessionLocal()
        try:
            async with self._lock:
                if user_id not in self._user_queues:
                    return

                # If already processing, don't start another
                if self._processing.get(user_id) is not None:
                    return

                queue = self._user_queues[user_id]

                if queue.empty():
                    return

                # Get next extraction from queue
                try:
                    priority, extraction_id = queue.get_nowait()
                except asyncio.QueueEmpty:
                    return

                self._processing[user_id] = extraction_id

            # Process extraction outside the lock
            try:
                extraction = db.query(Extraction).filter(Extraction.id == extraction_id).first()
                if not extraction:
                    logger.error(f"Extraction {extraction_id} not found")
                    return

                # Get file content from storage
                if extraction_id not in self._file_storage:
                    logger.error(f"File content not found for extraction {extraction_id}")
                    extraction.status = ExtractionStatus.FAILED.value
                    db.commit()
                    return

                file_content, filename = self._file_storage[extraction_id]

                # Broadcast job started notification
                await event_manager.broadcast(
                    extraction_id,
                    {
                        "type": "notification",
                        "extraction_id": extraction_id,
                        "title": "Extraction Started",
                        "message": f"Extraction #{extraction_id} has started processing",
                        "notification_type": "info",
                    },
                )

                # Update status to processing
                extraction.status = ExtractionStatus.PROCESSING.value
                db.commit()
                db.refresh(extraction)

                # Broadcast status update
                await event_manager.broadcast(
                    extraction_id,
                    {
                        "type": "status_update",
                        "extraction_id": extraction_id,
                        "status": extraction.status,
                        "message": "Processing started",
                    },
                )

                # Create file object
                file_buffer = BytesIO(file_content)
                file_obj = UploadFile(file=file_buffer, filename=filename)
                file_buffer.seek(0)

                # Run the pipeline
                await run_extraction_pipeline(db, extraction, file=file_obj)

                logger.info(f"Completed processing extraction {extraction_id} for user {user_id}")

            except Exception as e:
                logger.error(f"Error processing extraction {extraction_id}: {str(e)}", exc_info=True)
                # Update extraction status to failed
                try:
                    extraction = db.query(Extraction).filter(Extraction.id == extraction_id).first()
                    if extraction:
                        extraction.status = ExtractionStatus.FAILED.value
                        db.commit()

                        # Broadcast failure notification
                        await event_manager.broadcast(
                            extraction_id,
                            {
                                "type": "notification",
                                "extraction_id": extraction_id,
                                "title": "Extraction Failed",
                                "message": f"Extraction #{extraction_id} has failed",
                                "notification_type": "error",
                            },
                        )
                except Exception as db_error:
                    logger.error(f"Error updating extraction status: {str(db_error)}")
            finally:
                # Clean up file storage
                if extraction_id in self._file_storage:
                    del self._file_storage[extraction_id]

                async with self._lock:
                    self._processing[user_id] = None
                    # Process next item in queue
                    if user_id in self._user_queues:
                        asyncio.create_task(self.process_queue(user_id))
        finally:
            db.close()


# Global queue manager instance
queue_manager = ExtractionQueueManager()

