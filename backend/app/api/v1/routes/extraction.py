"""
Extraction endpoints for API v1.
Handles file upload, extraction job creation, and result retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import String, cast
from typing import Optional, List
from app.core.database import get_db, SessionLocal
from app.dependencies import get_current_user, get_current_user_optional_token
from app.models.user import User
from app.models.extraction import Extraction
from app.models.schemas import ExtractionCreate, ExtractionResponse, ExtractionListResponse, ExtractionUpdate
from app.models.enums import ExtractionStatus, InputType, OutputFormat
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=ExtractionResponse, status_code=status.HTTP_201_CREATED)
async def create_extraction(
    file: UploadFile = File(...),
    columns: Optional[str] = Form(None),
    multiple_tables: bool = Form(False),
    complexity: str = Form("regular"),
    priority: str = Form("medium"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new extraction job.

    Args:
        file: PDF or image file(s) to extract tables from
        columns: Comma-separated list of column names (optional)
        multiple_tables: Flag indicating multiple tables in input
        complexity: Pipeline complexity (simple, regular, complex)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created extraction job object
    """
    # Parse columns if provided
    columns_list = None
    if columns:
        columns_list = [col.strip() for col in columns.split(",") if col.strip()]

    # Determine input type
    input_type = None
    if file.filename:
        if file.filename.lower().endswith(".pdf"):
            input_type = InputType.PDF.value
        else:
            input_type = InputType.IMAGES.value

    # Validate complexity
    if complexity not in ["simple", "regular", "complex"]:
        complexity = "regular"

    # Validate priority
    if priority not in ["high", "medium", "low"]:
        priority = "medium"

    # Create extraction record (always save as JSON, format selection happens on download)
    extraction = Extraction(
        user_id=current_user.id,
        status=ExtractionStatus.PENDING.value,
        input_type=input_type,
        input_filename=file.filename,
        columns_requested=columns_list,
        multiple_tables=multiple_tables,
        output_format=OutputFormat.JSON.value,  # Always JSON in database
        complexity=complexity,
        priority=priority,
    )

    db.add(extraction)
    db.commit()
    db.refresh(extraction)

    # Read file content for queue
    file_content = await file.read()
    filename = file.filename

    # Import queue manager
    from app.services.queue_manager import queue_manager
    from app.services.event_manager import event_manager

    # Broadcast job created notification
    await event_manager.broadcast(
        extraction.id,
        {
            "type": "notification",
            "extraction_id": extraction.id,
            "title": "Extraction Created",
            "message": f"Extraction #{extraction.id} has been created and queued",
            "notification_type": "info",
        },
    )

    # Enqueue extraction with priority
    await queue_manager.enqueue_extraction(
        extraction_id=extraction.id,
        user_id=current_user.id,
        file_content=file_content,
        filename=filename,
        priority=priority,
    )

    logger.info(f"Enqueued extraction {extraction.id} for user {current_user.id} with priority {priority}")

    return extraction


@router.get("/{extraction_id}", response_model=ExtractionResponse)
async def get_extraction(extraction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get extraction job by ID.

    Args:
        extraction_id: Extraction job ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Extraction job object

    Raises:
        HTTPException: If extraction not found or not owned by user
    """
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id, Extraction.user_id == current_user.id).first()

    if not extraction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found")

    return extraction


@router.get("/{extraction_id}/stream")
async def stream_extraction_updates(
    extraction_id: int,
    request: Request,
    current_user: User = Depends(get_current_user_optional_token),
    db: Session = Depends(get_db),
):
    """
    Stream extraction status updates via Server-Sent Events (SSE).
    Replaces polling with real-time updates.

    Note: EventSource doesn't support custom headers, so authentication
    is handled via Bearer token in query parameter or Authorization header.

    Args:
        extraction_id: Extraction job ID
        request: FastAPI request object
        current_user: Current authenticated user
        db: Database session

    Returns:
        SSE stream of extraction updates

    Raises:
        HTTPException: If extraction not found or not owned by user
    """
    # Verify extraction exists and belongs to user
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id, Extraction.user_id == current_user.id).first()

    if not extraction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found")

    from app.services.event_manager import event_manager

    return StreamingResponse(
        event_manager.create_sse_stream(extraction_id, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("", response_model=ExtractionListResponse)
async def list_extractions(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's extraction jobs with pagination, filtering, and search.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        status: Filter by status (pending, processing, completed, failed)
        search: Search by filename or ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Paginated list of extraction jobs
    """
    skip = (page - 1) * page_size

    # Base query
    query = db.query(Extraction).filter(Extraction.user_id == current_user.id)

    # Apply status filter
    if status and status != "all":
        query = query.filter(Extraction.status == status)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Extraction.input_filename.ilike(search_term))
            | (Extraction.id.cast(String).ilike(search_term))
        )

    # Get total count before pagination
    total = query.count()

    # Apply pagination and ordering
    extractions = query.order_by(Extraction.created_at.desc()).offset(skip).limit(page_size).all()

    return {"items": extractions, "total": total, "page": page, "page_size": page_size}


@router.get("/{extraction_id}/download")
async def download_extraction(
    extraction_id: int,
    output_format: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download extraction output in requested format.
    Data is converted on-the-fly from JSON stored in database.

    Args:
        extraction_id: Extraction job ID
        output_format: Output format (json, csv, excel). Defaults to extraction's format.
        current_user: Current authenticated user
        db: Database session

    Returns:
        File download response with converted data

    Raises:
        HTTPException: If extraction not found or data not available
    """
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id, Extraction.user_id == current_user.id).first()

    if not extraction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found")

    if extraction.status != ExtractionStatus.COMPLETED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Extraction not completed")

    if not extraction.table_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table data not found")

    # Use requested format or extraction's default format
    format_to_use = output_format or extraction.output_format

    # Convert table data to requested format on-the-fly
    from app.utils.polars_converter import convert_table_data
    from fastapi.responses import Response

    output_bytes = convert_table_data(extraction.table_data, format_to_use)

    # Determine content type and filename
    content_types = {
        "json": "application/json",
        "csv": "text/csv",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }

    extensions = {"json": "json", "csv": "csv", "excel": "xlsx"}

    content_type = content_types.get(format_to_use, "application/octet-stream")
    extension = extensions.get(format_to_use, "json")
    filename = f"extraction_{extraction_id}.{extension}"

    return Response(
        content=output_bytes, media_type=content_type, headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.patch("/{extraction_id}", response_model=ExtractionResponse)
async def update_extraction(
    extraction_id: int,
    extraction_update: ExtractionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update extraction job metadata.

    Args:
        extraction_id: Extraction job ID
        extraction_update: Fields to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated extraction job object

    Raises:
        HTTPException: If extraction not found or not owned by user
    """
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id, Extraction.user_id == current_user.id).first()

    if not extraction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found")

    # Allow updating name even when processing (for user convenience)
    # Only block other updates if processing
    if extraction.status == ExtractionStatus.PROCESSING.value:
        # Allow updating input_filename even when processing
        allowed_fields_when_processing = {"input_filename"}
        update_fields = set(update_data.keys())
        if not update_fields.issubset(allowed_fields_when_processing):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update extraction metadata while it is processing. Only name can be updated."
            )

    # Update fields if provided
    update_data = extraction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(extraction, field):
            setattr(extraction, field, value)

    # Validate output_format if provided
    if "output_format" in update_data:
        if update_data["output_format"] not in [fmt.value for fmt in OutputFormat]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid output_format. Must be one of: {[fmt.value for fmt in OutputFormat]}",
            )

    db.commit()
    db.refresh(extraction)

    return extraction


@router.delete("/{extraction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_extraction(extraction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete extraction job and associated files.

    Args:
        extraction_id: Extraction job ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If extraction not found or not owned by user
    """
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id, Extraction.user_id == current_user.id).first()

    if not extraction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found")

    # Delete associated output file if it exists
    # No files to delete - all data is stored in database as JSON

    db.delete(extraction)
    db.commit()

    return None
