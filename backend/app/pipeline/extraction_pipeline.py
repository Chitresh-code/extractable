"""
Main extraction pipeline orchestrator.
Orchestrates all 5 steps of the extraction process.
"""

from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.extraction import Extraction
from app.models.enums import ExtractionStatus
from app.services.file_processor import process_input_files
from app.services.extractor import extract_tables_from_images
from app.services.validator import validate_extractions
from app.services.finalizer import generate_final_output
from app.services.storage_service import store_extraction_outputs
from app.services.event_manager import event_manager
from datetime import datetime
import logging
import time

logger = logging.getLogger(__name__)


async def run_extraction_pipeline(
    db: Session,
    extraction: Extraction,
    file=None,
    files: List = None
) -> Extraction:
    """
    Run the complete extraction pipeline.
    
    Steps:
    1. Process input files (PDF to images or process images)
    2. Extract tables from images using OpenAI
    3. Validate extractions with context
    4. Generate final structured output
    5. Store results and update database
    
    Args:
        db: Database session
        extraction: Extraction record
        file: Single file upload (PDF or image)
        files: Multiple image file uploads
        
    Returns:
        Updated extraction record
        
    Raises:
        Exception: If pipeline fails at any step
    """
    try:
        # Start timing
        pipeline_start_time = time.time()
        timing_metrics = {
            "step_1_file_processing": 0.0,
            "step_2_extraction": 0.0,
            "step_3_validation": 0.0,
            "step_4_finalization": 0.0,
            "step_5_storage": 0.0,
            "total_time": 0.0
        }
        
        # Update status to processing
        extraction.status = ExtractionStatus.PROCESSING.value
        db.commit()
        db.refresh(extraction)
        
        # Broadcast status update via SSE
        await event_manager.broadcast(extraction.id, {
            "type": "status_update",
            "extraction_id": extraction.id,
            "status": extraction.status,
            "message": "Processing started"
        })
        
        # Broadcast initial step
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 0,
            "message": "Starting pipeline..."
        })
        
        # Step 1: Process input files
        step_start = time.time()
        logger.info(f"Step 1: Processing input files for extraction {extraction.id}")
        input_type, image_bytes_list = await process_input_files(file=file, files=files)
        extraction.input_type = input_type
        # Optimize: batch commit with status update
        db.commit()
        timing_metrics["step_1_file_processing"] = time.time() - step_start
        
        # Broadcast step 1 completion
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 1,
            "message": f"Processed {len(image_bytes_list)} images",
            "time_elapsed": round(timing_metrics["step_1_file_processing"], 2)
        })
        
        if not image_bytes_list:
            raise ValueError("No images generated from input files")
        
        # Step 2: Extract tables from images
        step_start = time.time()
        logger.info(f"Step 2: Extracting tables from {len(image_bytes_list)} images")
        extraction_results = await extract_tables_from_images(
            user_id=extraction.user_id,
            image_bytes_list=image_bytes_list,
            columns=extraction.columns_requested,
            multiple_tables=extraction.multiple_tables,
            complexity=extraction.complexity or "simple"
        )
        timing_metrics["step_2_extraction"] = time.time() - step_start
        
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 2,
            "message": f"Extracted tables from {len(image_bytes_list)} images",
            "time_elapsed": round(timing_metrics["step_2_extraction"], 2)
        })
        
        # Step 3: Validate extractions (optimized: parallel processing already implemented)
        step_start = time.time()
        logger.info(f"Step 3: Validating {len(extraction_results)} extractions")
        extraction_complexity = extraction.complexity or "regular"
        validation_results = await validate_extractions(
            user_id=extraction.user_id,
            extraction_results=extraction_results,
            image_bytes_list=image_bytes_list,
            complexity=extraction_complexity
        )
        timing_metrics["step_3_validation"] = time.time() - step_start
        
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 3,
            "message": "Validation completed",
            "time_elapsed": round(timing_metrics["step_3_validation"], 2)
        })
        
        # Step 4: Generate final output (optimized: shorter prompts, efficient processing)
        step_start = time.time()
        logger.info("Step 4: Generating final structured output")
        final_table_data = await generate_final_output(
            user_id=extraction.user_id,
            extraction_results=extraction_results,
            validation_results=validation_results,
            multiple_tables=extraction.multiple_tables,
            complexity=extraction_complexity
        )
        timing_metrics["step_4_finalization"] = time.time() - step_start
        
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 4,
            "message": "Final output generated",
            "time_elapsed": round(timing_metrics["step_4_finalization"], 2)
        })
        timing_metrics["step_4_finalization"] = time.time() - step_start
        
        await event_manager.broadcast(extraction.id, {
            "type": "step_update",
            "extraction_id": extraction.id,
            "step": 4,
            "message": "Final output generated",
            "time_elapsed": round(timing_metrics["step_4_finalization"], 2)
        })
        
        # Step 5: Store results (JSON only in database, no files)
        step_start = time.time()
        logger.info("Step 5: Storing results in database")
        
        # Store with current timing metrics (step 5 will be 0 initially)
        store_extraction_outputs(
            db=db,
            extraction=extraction,
            final_table_data=final_table_data,
            extraction_results=extraction_results,
            validation_results=validation_results,
            final_llm_output={
                "text": "Final output generated",
                "timing_metrics": dict(timing_metrics)  # Copy current metrics
            }
        )
        
        # Calculate final timing metrics
        timing_metrics["step_5_storage"] = time.time() - step_start
        timing_metrics["total_time"] = time.time() - pipeline_start_time
        
        # Update timing metrics in the stored output with final values
        extraction = db.query(Extraction).filter(Extraction.id == extraction.id).first()
        if extraction:
            # Ensure llm_final_output exists and is a dict
            if not extraction.llm_final_output:
                extraction.llm_final_output = {}
            elif not isinstance(extraction.llm_final_output, dict):
                # If it's stored as a string, parse it
                import json
                try:
                    extraction.llm_final_output = json.loads(extraction.llm_final_output) if isinstance(extraction.llm_final_output, str) else {}
                except:
                    extraction.llm_final_output = {}
            
            # Update timing metrics
            extraction.llm_final_output["timing_metrics"] = timing_metrics
            db.commit()
            logger.info(f"Updated timing metrics for extraction {extraction.id}: {timing_metrics}")
        
        # Broadcast completion with timing
        await event_manager.broadcast(extraction.id, {
            "type": "status_update",
            "extraction_id": extraction.id,
            "status": extraction.status,
            "message": "Extraction completed successfully",
            "timing_metrics": timing_metrics
        })
        
        logger.info(
            f"Extraction {extraction.id} completed successfully in {timing_metrics['total_time']:.2f}s. "
            f"Timing: Step1={timing_metrics['step_1_file_processing']:.2f}s, "
            f"Step2={timing_metrics['step_2_extraction']:.2f}s, "
            f"Step3={timing_metrics['step_3_validation']:.2f}s, "
            f"Step4={timing_metrics['step_4_finalization']:.2f}s, "
            f"Step5={timing_metrics['step_5_storage']:.2f}s"
        )
        return extraction
        
    except Exception as e:
        # Update status to failed
        logger.error(f"Extraction {extraction.id} failed: {str(e)}")
        try:
            # Rollback any pending transaction
            db.rollback()
            
            # Query the extraction again to ensure it's attached to the session
            # This handles cases where the session was rolled back or object was detached
            failed_extraction = db.query(Extraction).filter(Extraction.id == extraction.id).first()
            if failed_extraction:
                failed_extraction.status = ExtractionStatus.FAILED.value
                db.commit()
                logger.info(f"Updated extraction {extraction.id} status to FAILED in database")
                
                # Broadcast failure
                await event_manager.broadcast(extraction.id, {
                    "type": "status_update",
                    "extraction_id": extraction.id,
                    "status": ExtractionStatus.FAILED.value,
                    "message": f"Extraction failed: {str(e)}",
                    "error": str(e)
                })
                logger.info(f"Broadcasted failure event for extraction {extraction.id}")
            else:
                logger.warning(f"Could not find extraction {extraction.id} to update status")
        except Exception as db_error:
            # If we can't update the DB, log it but don't fail
            logger.error(f"Failed to update extraction {extraction.id} status in database: {str(db_error)}", exc_info=True)
        
        raise

