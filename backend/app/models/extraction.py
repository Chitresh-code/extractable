"""
Extraction SQLAlchemy model.
Represents extraction jobs and their results.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import ExtractionStatus, InputType, OutputFormat


class Extraction(Base):
    """Extraction model for storing extraction jobs and results."""

    __tablename__ = "extractions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Status and metadata
    status = Column(String, default=ExtractionStatus.PENDING.value, index=True)
    input_type = Column(String)  # pdf or images
    input_filename = Column(String)  # For reference only, file not stored

    # User preferences
    columns_requested = Column(JSON)  # Array of column names
    multiple_tables = Column(Boolean, default=False)
    output_format = Column(String, default=OutputFormat.JSON.value)
    complexity = Column(String, default="regular")  # simple, regular, or complex

    # Output storage
    output_file_path = Column(String)  # Path to stored output file

    # LLM outputs (stored for reference)
    llm_extraction_output = Column(JSON)  # Full extraction responses
    llm_validation_output = Column(JSON)  # Validation comments
    llm_final_output = Column(JSON)  # Final generation response

    # Final table data
    table_data = Column(JSON)  # Final structured table

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    # Relationship to user
    user = relationship("User", back_populates="extractions")
