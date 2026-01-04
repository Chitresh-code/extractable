"""
Table extraction service (Step 2).
Extracts tables from images using OpenAI API.
"""

from typing import List, Dict, Any, Optional
from app.services.openai_client import openai_client
from app.models.enums import OutputFormat


def build_extraction_prompt(
    columns: Optional[List[str]] = None,
    multiple_tables: bool = False
) -> str:
    """
    Build prompt for table extraction.
    
    Args:
        columns: Optional list of column names to extract
        multiple_tables: Flag indicating multiple tables in input
        
    Returns:
        Formatted prompt string
    """
    prompt = """Extract the table(s) from this image and return the data as a JSON object.

"""
    
    if columns:
        prompt += f"""Extract only these columns: {', '.join(columns)}.
If a column is not found in the table, include it with null values.

"""
    else:
        prompt += """Auto-detect all columns in the table(s).

"""
    
    if multiple_tables:
        prompt += """There may be multiple tables in the image. Extract all of them.

"""
    
    prompt += """Return the data in the following JSON format:
{
  "tables": [
    {
      "table_index": 1,
      "columns": ["column1", "column2", ...],
      "rows": [
        {"column1": "value1", "column2": "value2", ...},
        ...
      ]
    }
  ]
}

If there is only one table, still wrap it in the "tables" array.
Ensure all values are properly extracted and formatted.
Return ONLY valid JSON, no additional text or markdown formatting."""

    return prompt


async def extract_tables_from_image(
    user_id: int,
    image_bytes: bytes,
    columns: Optional[List[str]] = None,
    multiple_tables: bool = False,
    complexity: str = "simple"
) -> Dict[str, Any]:
    """
    Extract tables from a single image.
    
    Args:
        user_id: User ID for rate limiting
        image_bytes: Image bytes
        columns: Optional list of column names
        multiple_tables: Flag for multiple tables
        
    Returns:
        Extracted table data as dictionary
    """
    # Build prompt
    prompt = build_extraction_prompt(columns, multiple_tables)
    
    # Call OpenAI API with specified complexity for extraction
    response = await openai_client.generate_content(
        user_id=user_id,
        prompt=prompt,
        images=[image_bytes],
        complexity=complexity
    )
    
    # Parse JSON response
    try:
        table_data = openai_client.parse_json_response(response["text"])
        return table_data
    except ValueError as e:
        # If JSON parsing fails, return error structure
        return {
            "error": str(e),
            "raw_response": response["text"]
        }


async def extract_tables_from_images(
    user_id: int,
    image_bytes_list: List[bytes],
    columns: Optional[List[str]] = None,
    multiple_tables: bool = False,
    complexity: str = "simple"
) -> List[Dict[str, Any]]:
    """
    Extract tables from multiple images in parallel for faster processing.
    
    Args:
        user_id: User ID for rate limiting
        image_bytes_list: List of image bytes
        columns: Optional list of column names
        multiple_tables: Flag for multiple tables
        
    Returns:
        List of extraction results (one per image)
    """
    import asyncio
    
    # Create tasks for parallel processing
    tasks = []
    for idx, image_bytes in enumerate(image_bytes_list):
        task = extract_tables_from_image(
            user_id=user_id,
            image_bytes=image_bytes,
            columns=columns,
            multiple_tables=multiple_tables,
            complexity=complexity
        )
        tasks.append((idx, task))
    
    # Execute all extractions in parallel
    results = []
    extraction_results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
    
    # Process results and add image_index
    for (idx, _), result in zip(tasks, extraction_results):
        if isinstance(result, Exception):
            # Handle exceptions
            results.append({
                "image_index": idx,
                "error": str(result)
            })
        else:
            result["image_index"] = idx
            results.append(result)
    
    # Sort by image_index to maintain order
    results.sort(key=lambda x: x.get("image_index", 0))
    
    return results

