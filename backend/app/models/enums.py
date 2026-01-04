"""
Enums for status, formats, and other constants.
"""

from enum import Enum


class ExtractionStatus(str, Enum):
    """Extraction job status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class InputType(str, Enum):
    """Input file type."""

    PDF = "pdf"
    IMAGES = "images"


class OutputFormat(str, Enum):
    """Output file format."""

    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
