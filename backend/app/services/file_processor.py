"""
File processing service (Step 1).
Handles PDF to image conversion and image file processing.
Does NOT store input files - processes in memory or temp files, cleans up immediately.
"""

import io
from typing import List, Tuple
from PIL import Image
from pdf2image import convert_from_bytes
from fastapi import UploadFile, HTTPException, status


async def process_pdf(file: UploadFile) -> List[bytes]:
    """
    Convert PDF file to list of image bytes.

    Args:
        file: PDF file upload

    Returns:
        List of image bytes (one per page)

    Raises:
        HTTPException: If file processing fails
    """
    try:
        # Read PDF file into memory
        pdf_bytes = await file.read()

        # Convert PDF pages to images
        images = convert_from_bytes(pdf_bytes)

        # Convert PIL Images to bytes
        image_bytes_list = []
        for img in images:
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)
            image_bytes_list.append(img_byte_arr.read())

        return image_bytes_list

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to process PDF: {str(e)}")


async def process_images(files: List[UploadFile]) -> List[bytes]:
    """
    Process multiple image files.

    Args:
        files: List of image file uploads

    Returns:
        List of image bytes

    Raises:
        HTTPException: If file processing fails
    """
    image_bytes_list = []

    for file in files:
        try:
            # Read image file
            image_bytes = await file.read()

            # Validate it's a valid image
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()  # Verify it's a valid image

            # Reset to beginning for reading
            img = Image.open(io.BytesIO(image_bytes))

            # Convert to PNG bytes for consistency
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)
            image_bytes_list.append(img_byte_arr.read())

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to process image {file.filename}: {str(e)}"
            )

    return image_bytes_list


async def process_input_files(file: UploadFile = None, files: List[UploadFile] = None) -> Tuple[str, List[bytes]]:
    """
    Process input files (PDF or images).
    Returns input type and list of image bytes.

    Args:
        file: Single file (PDF or image)
        files: Multiple image files

    Returns:
        Tuple of (input_type, list of image bytes)

    Raises:
        HTTPException: If processing fails or invalid input
    """
    if file and files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot process both single file and multiple files"
        )

    if not file and not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    if file:
        # Check if it's a PDF
        if file.filename and file.filename.lower().endswith(".pdf"):
            images = await process_pdf(file)
            return ("pdf", images)
        else:
            # Single image
            images = await process_images([file])
            return ("images", images)

    if files:
        # Multiple images
        images = await process_images(files)
        return ("images", images)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file input")
