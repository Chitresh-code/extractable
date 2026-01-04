"""
Finalization service (Step 4).
Generates final structured output from all extractions and validations.
"""

from typing import List, Dict, Any
import logging
from app.services.openai_client import openai_client

logger = logging.getLogger(__name__)


def build_finalization_prompt(
    extraction_results: List[Dict[str, Any]], validation_results: List[Dict[str, Any]], multiple_tables: bool = False
) -> str:
    """
    Build optimized prompt for final output generation (more concise).

    Args:
        extraction_results: List of all extraction results
        validation_results: List of all validation comments
        multiple_tables: Flag indicating multiple tables

    Returns:
        Formatted finalization prompt
    """
    import json

    # Optimize: Use compact JSON representation and limit size
    results_str = json.dumps(extraction_results, separators=(",", ":"))[:3000]  # Limit for efficiency
    validations_str = json.dumps(validation_results, separators=(",", ":"))[:1500]  # Limit validation size

    prompt = f"""Generate final consolidated table from extractions.

Extractions: {results_str}
Validations: {validations_str}

{"Multiple tables: keep separate." if multiple_tables else "Single table."}

Address validation issues. Return JSON:
{{"tables":[{{"table_index":1,"columns":["col1","col2"],"rows":[{{"col1":"val1","col2":"val2"}}]}}]}}

Return ONLY valid JSON, no markdown."""

    return prompt


async def generate_final_output(
    user_id: int,
    extraction_results: List[Dict[str, Any]],
    validation_results: List[Dict[str, Any]],
    multiple_tables: bool = False,
    complexity: str = "complex",
) -> Dict[str, Any]:
    """
    Generate final structured output from all extractions and validations.

    Args:
        user_id: User ID for rate limiting
        extraction_results: List of all extraction results
        validation_results: List of all validation comments
        multiple_tables: Flag for multiple tables

    Returns:
        Final consolidated table data
    """
    # Build prompt
    prompt = build_finalization_prompt(extraction_results, validation_results, multiple_tables)

    # Call OpenAI API with specified complexity for finalization
    response = await openai_client.generate_content(user_id=user_id, prompt=prompt, images=None, complexity=complexity)

    # Parse JSON response
    try:
        final_data = openai_client.parse_json_response(response["text"])
        return final_data
    except ValueError as e:
        # If JSON parsing fails, try to extract and return what we can
        import json
        import re

        raw_text = response["text"]
        logger.warning(f"Failed to parse final output JSON: {str(e)}")
        logger.debug(f"Raw response (first 1000 chars): {raw_text[:1000]}")

        # Try multiple strategies to extract valid JSON
        strategies = [
            # Strategy 1: Find complete JSON object by matching braces
            lambda t: _extract_complete_json_object(t),
            # Strategy 2: Extract tables array and wrap it
            lambda t: _extract_tables_array(t),
            # Strategy 3: Remove extra closing braces/brackets
            lambda t: _fix_extra_closing_chars(t),
        ]

        for strategy in strategies:
            try:
                result = strategy(raw_text)
                if result:
                    return result
            except Exception as strategy_error:
                logger.debug(f"Strategy failed: {strategy_error}")
                continue

        # If all else fails, return error structure
        return {
            "error": f"Failed to parse final output: {str(e)}",
            "raw_response": raw_text[:1000] if len(raw_text) > 1000 else raw_text,  # Limit size
        }


def _extract_complete_json_object(text: str) -> Dict[str, Any]:
    """Extract the first complete JSON object by matching braces."""
    import json
    import re

    brace_count = 0
    bracket_count = 0
    start_idx = text.find("{")

    if start_idx == -1:
        return None

    for i in range(start_idx, len(text)):
        char = text[i]
        if char == "{":
            brace_count += 1
        elif char == "}":
            brace_count -= 1
        elif char == "[":
            bracket_count += 1
        elif char == "]":
            bracket_count -= 1

        if brace_count == 0 and bracket_count == 0 and i > start_idx:
            json_str = text[start_idx : i + 1]
            # Clean up trailing commas
            json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)
            return json.loads(json_str)

    return None


def _extract_tables_array(text: str) -> Dict[str, Any]:
    """Extract tables array and construct minimal valid JSON."""
    import json
    import re

    # Find the tables array with its content
    # Match: "tables": [ ... ]
    pattern = r'"tables"\s*:\s*\[.*?\]'
    match = re.search(pattern, text, re.DOTALL)

    if match:
        tables_part = match.group(0)
        # Construct valid JSON
        json_str = "{" + tables_part + "}"
        # Clean up trailing commas
        json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)
        return json.loads(json_str)

    return None


def _fix_extra_closing_chars(text: str) -> Dict[str, Any]:
    """Try to fix JSON by removing extra closing characters."""
    import json
    import re

    # Remove extra closing braces/brackets at the end
    # Pattern: }]} or ]}} or similar combinations
    cleaned = re.sub(r"([}\]]){2,}$", r"\1", text.strip())

    # Also remove trailing commas
    cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)

    try:
        return json.loads(cleaned)
    except:
        return None
