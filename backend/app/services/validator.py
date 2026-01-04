"""
Validation service (Step 3).
Validates extractions using context from adjacent images.
"""

from typing import List, Dict, Any, Optional
from app.services.openai_client import openai_client


def build_validation_prompt(
    extraction_result: Dict[str, Any],
    image_index: int,
    total_images: int
) -> str:
    """
    Build optimized prompt for validation (shorter, more efficient).
    
    Args:
        extraction_result: Extraction result to validate
        image_index: Current image index
        total_images: Total number of images
        
    Returns:
        Formatted validation prompt
    """
    # Optimize: Use more concise prompt and JSON.stringify for compact representation
    import json
    result_str = json.dumps(extraction_result, separators=(',', ':'))[:2000]  # Limit size for efficiency
    
    prompt = f"""Validate table extraction from image {image_index + 1}/{total_images}.

Extracted data: {result_str}

Identify issues (don't fix): missing data, misaligned columns, wrong types, missing rows.

Return JSON:
{{"image_index":{image_index},"issues":[{{"type":"missing_data","description":"...","severity":"high|medium|low"}}],"overall_quality":"good|fair|poor","comments":"..."}}

Return ONLY valid JSON."""
    
    return prompt


async def validate_extraction(
    user_id: int,
    extraction_result: Dict[str, Any],
    image_index: int,
    total_images: int,
    current_image: bytes,
    previous_image: Optional[bytes] = None,
    next_image: Optional[bytes] = None,
    complexity: str = "regular"
) -> Dict[str, Any]:
    """
    Validate an extraction using context from adjacent images.
    
    Args:
        user_id: User ID for rate limiting
        extraction_result: Extraction result to validate
        image_index: Current image index
        total_images: Total number of images
        current_image: Current image bytes
        previous_image: Optional previous image bytes
        next_image: Optional next image bytes
        
    Returns:
        Validation comments dictionary
    """
    # Build prompt
    prompt = build_validation_prompt(extraction_result, image_index, total_images)
    
    # Optimize: Only send current + previous image (skip next for speed)
    # Previous image provides continuity context which is most important
    images = [current_image]
    if previous_image:
        images.insert(0, previous_image)
    # Skip next_image to reduce token usage and latency
    
    # Call OpenAI API with specified complexity for validation
    validation_complexity = complexity if complexity else "regular"
    response = await openai_client.generate_content(
        user_id=user_id,
        prompt=prompt,
        images=images,
        complexity=validation_complexity
    )
    
    # Parse JSON response
    try:
        validation = openai_client.parse_json_response(response["text"])
        return validation
    except ValueError as e:
        # If JSON parsing fails, return error structure
        return {
            "image_index": image_index,
            "error": f"Failed to parse validation response: {str(e)}",
            "raw_response": response["text"]
        }


async def validate_extractions(
    user_id: int,
    extraction_results: List[Dict[str, Any]],
    image_bytes_list: List[bytes],
    complexity: str = "regular"
) -> List[Dict[str, Any]]:
    """
    Validate all extractions with context from adjacent images in parallel.
    
    Args:
        user_id: User ID for rate limiting
        extraction_results: List of extraction results
        image_bytes_list: List of image bytes
        
    Returns:
        List of validation comments (one per extraction)
    """
    import asyncio
    
    total_images = len(image_bytes_list)
    
    # Create tasks for parallel processing
    tasks = []
    for idx, extraction_result in enumerate(extraction_results):
        # Get context images
        current_image = image_bytes_list[idx]
        previous_image = image_bytes_list[idx - 1] if idx > 0 else None
        next_image = image_bytes_list[idx + 1] if idx < total_images - 1 else None
        
        task = validate_extraction(
            user_id=user_id,
            extraction_result=extraction_result,
            image_index=idx,
            total_images=total_images,
            current_image=current_image,
            previous_image=previous_image,
            next_image=next_image,
            complexity=complexity
        )
        tasks.append((idx, task))
    
    # Execute all validations in parallel
    validations = []
    validation_results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
    
    # Process results
    for (idx, _), result in zip(tasks, validation_results):
        if isinstance(result, Exception):
            # Handle exceptions
            validations.append({
                "image_index": idx,
                "error": str(result)
            })
        else:
            validations.append(result)
    
    # Sort by image_index to maintain order
    validations.sort(key=lambda x: x.get("image_index", 0))
    
    return validations

