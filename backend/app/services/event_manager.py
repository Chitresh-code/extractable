"""
Event manager for broadcasting extraction status updates via Server-Sent Events.
Manages active SSE connections and broadcasts events to connected clients.
"""

from typing import Dict, Set
from fastapi import Request
from fastapi.responses import StreamingResponse
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


class EventManager:
    """Manages SSE connections and broadcasts events."""

    def __init__(self):
        # Map of extraction_id -> set of async queues (one per connected client)
        self._connections: Dict[int, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, extraction_id: int) -> asyncio.Queue:
        """
        Subscribe to events for a specific extraction.

        Args:
            extraction_id: Extraction ID to subscribe to

        Returns:
            Async queue that will receive events
        """
        async with self._lock:
            if extraction_id not in self._connections:
                self._connections[extraction_id] = set()

            queue = asyncio.Queue()
            self._connections[extraction_id].add(queue)
            logger.info(f"Client subscribed to extraction {extraction_id} (total: {len(self._connections[extraction_id])})")
            return queue

    async def unsubscribe(self, extraction_id: int, queue: asyncio.Queue):
        """
        Unsubscribe from events for a specific extraction.

        Args:
            extraction_id: Extraction ID to unsubscribe from
            queue: Queue to remove
        """
        async with self._lock:
            if extraction_id in self._connections:
                self._connections[extraction_id].discard(queue)
                if not self._connections[extraction_id]:
                    del self._connections[extraction_id]
                logger.info(f"Client unsubscribed from extraction {extraction_id}")

    async def broadcast(self, extraction_id: int, event_data: dict):
        """
        Broadcast an event to all subscribers of an extraction.

        Args:
            extraction_id: Extraction ID
            event_data: Event data to broadcast
        """
        async with self._lock:
            if extraction_id not in self._connections:
                return

            # Create a copy of the set to avoid modification during iteration
            queues = list(self._connections[extraction_id])

        # Broadcast to all subscribers
        for queue in queues:
            try:
                await queue.put(event_data)
            except Exception as e:
                logger.error(f"Error broadcasting to queue: {e}")

    async def create_sse_stream(self, extraction_id: int, request: Request):
        """
        Create an SSE stream for an extraction.

        Args:
            extraction_id: Extraction ID to stream
            request: FastAPI request object

        Yields:
            SSE formatted messages
        """
        queue = await self.subscribe(extraction_id)

        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'extraction_id': extraction_id})}\n\n"

            # Keep connection alive and stream events
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for event with timeout to send keepalive
                    event_data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield ": keepalive\n\n"
                except Exception as e:
                    logger.error(f"Error in SSE stream: {e}")
                    break
        finally:
            await self.unsubscribe(extraction_id, queue)
            logger.info(f"SSE stream closed for extraction {extraction_id}")


# Global event manager instance
event_manager = EventManager()
