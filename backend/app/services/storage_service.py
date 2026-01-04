"""
Storage service for outputs and LLM responses.
Stores final table data and LLM outputs as JSON in PostgreSQL only.
Does NOT store files on disk - all data is stored in the database.
"""

from typing import Dict, Any, List
from app.models.extraction import Extraction
from app.models.enums import ExtractionStatus
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def store_extraction_outputs(
    db: Session,
    extraction: Extraction,
    final_table_data: Dict[str, Any],
    extraction_results: List[Dict[str, Any]],
    validation_results: List[Dict[str, Any]],
    final_llm_output: Dict[str, Any],
) -> None:
    """
    Store extraction outputs and LLM responses in PostgreSQL as JSON.
    No files are stored on disk - all data is in the database.

    Args:
        db: Database session
        extraction: Extraction record
        final_table_data: Final consolidated table data
        extraction_results: List of extraction results
        validation_results: List of validation comments
        final_llm_output: Final LLM generation output
    """
    # Update extraction record with all data stored as JSON
    # Re-query to ensure the object is attached to the session
    extraction_id = extraction.id
    extraction = db.query(Extraction).filter(Extraction.id == extraction_id).first()

    if not extraction:
        logger.error(f"Extraction {extraction_id} not found when storing outputs")
        return

    extraction.status = ExtractionStatus.COMPLETED.value
    extraction.table_data = final_table_data
    extraction.llm_extraction_output = extraction_results
    extraction.llm_validation_output = validation_results
    extraction.llm_final_output = final_llm_output
    extraction.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(extraction)  # Refresh to ensure JSON fields are properly loaded

    logger.info(f"Stored extraction {extraction.id} outputs in database (JSON only, no files)")
    if final_llm_output.get("timing_metrics"):
        logger.info(f"Timing metrics stored: {final_llm_output['timing_metrics']}")
