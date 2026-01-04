"""
File handling utilities.
"""

import os
from pathlib import Path
from typing import Optional


def ensure_directory_exists(directory: str) -> None:
    """
    Ensure a directory exists, create if it doesn't.

    Args:
        directory: Directory path
    """
    Path(directory).mkdir(parents=True, exist_ok=True)


def get_output_file_path(storage_path: str, extraction_id: int, output_format: str) -> str:
    """
    Generate output file path for an extraction.

    Args:
        storage_path: Base storage directory
        extraction_id: Extraction ID
        output_format: Output format (json, csv, excel)

    Returns:
        Full file path
    """
    ensure_directory_exists(storage_path)

    extension_map = {"json": "json", "csv": "csv", "excel": "xlsx"}

    extension = extension_map.get(output_format, "json")
    filename = f"extraction_{extraction_id}.{extension}"

    return os.path.join(storage_path, filename)


def save_file(file_path: str, content: bytes) -> None:
    """
    Save file content to disk.

    Args:
        file_path: File path
        content: File content bytes
    """
    ensure_directory_exists(os.path.dirname(file_path))

    with open(file_path, "wb") as f:
        f.write(content)


def read_file(file_path: str) -> bytes:
    """
    Read file content from disk.

    Args:
        file_path: File path

    Returns:
        File content bytes

    Raises:
        FileNotFoundError: If file doesn't exist
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "rb") as f:
        return f.read()
