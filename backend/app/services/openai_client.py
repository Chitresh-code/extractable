"""
OpenAI API client wrapper with rate limiting integration.
Handles API calls to OpenAI with proper error handling and exponential backoff.
"""

from openai import OpenAI
from openai import RateLimitError as OpenAIRateLimitError
from typing import Optional, Dict, Any, Literal
from app.core.config import settings
from app.services.rate_limiter import rate_limiter, RateLimitError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
import json
import base64
import logging
import time

logger = logging.getLogger(__name__)

# Complexity levels
ComplexityLevel = Literal["simple", "regular", "complex"]


class OpenAIClient:
    """Client for interacting with OpenAI API."""

    def __init__(self):
        """Initialize OpenAI client with API key."""
        api_key = settings.openai_api_key

        if not api_key:
            error_msg = "OPENAI_API_KEY is not set in environment variables"
            logger.error(error_msg)
            raise ValueError(error_msg)

        self.client = OpenAI(api_key=api_key)

        # Store model names for each complexity level
        self.model_names = {
            "simple": settings.openai_simple_model or "gpt-5-nano",
            "regular": settings.openai_regular_model or "gpt-5-mini",
            "complex": settings.openai_complex_model or "gpt-5",
        }

        # Log warning if using defaults (env vars not set)
        if not settings.openai_simple_model or not settings.openai_regular_model or not settings.openai_complex_model:
            logger.warning(
                "OpenAI model names not fully configured in .env. "
                "Please set OPENAI_SIMPLE_MODEL, OPENAI_REGULAR_MODEL, and OPENAI_COMPLEX_MODEL. "
                "Using fallback models."
            )

        logger.info(
            f"OpenAI client initialized with models: simple={self.model_names['simple']}, regular={self.model_names['regular']}, complex={self.model_names['complex']}"
        )

    def _count_tokens(self, text: str) -> int:
        """
        Estimate token count for a text string.
        Rough estimation: 1 token ≈ 4 characters.

        Args:
            text: Text to count tokens for

        Returns:
            Estimated token count
        """
        return len(text) // 4

    def _detect_image_mime_type(self, image_bytes: bytes) -> str:
        """
        Detect MIME type from image bytes using magic bytes.
        Supports PNG, JPEG, WEBP, GIF as per OpenAI documentation.

        Args:
            image_bytes: Image bytes

        Returns:
            MIME type string (defaults to image/png)
        """
        # Check for JPEG by magic bytes (starts with FF D8)
        if len(image_bytes) >= 2 and image_bytes[:2] == b"\xff\xd8":
            return "image/jpeg"

        # Check for PNG by magic bytes
        if len(image_bytes) >= 8 and image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"

        # Check for WEBP (RIFF header with WEBP at offset 8)
        if len(image_bytes) >= 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
            return "image/webp"

        # Check for GIF
        if len(image_bytes) >= 6 and image_bytes[:6] in [b"GIF87a", b"GIF89a"]:
            return "image/gif"

        # Default to PNG if detection fails
        logger.warning(f"Could not detect image format from {len(image_bytes)} bytes, defaulting to image/png")
        return "image/png"

    async def generate_content(
        self, user_id: int, prompt: str, images: Optional[list] = None, complexity: ComplexityLevel = "regular"
    ) -> Dict[str, Any]:
        """
        Generate content using OpenAI API with rate limiting.

        Args:
            user_id: User ID for rate limiting
            prompt: Text prompt
            images: Optional list of image bytes
            complexity: Complexity level - "simple", "regular", or "complex"

        Returns:
            API response dictionary

        Raises:
            RateLimitError: If rate limit is exceeded
            Exception: If API call fails
        """
        # Estimate tokens
        tokens = self._count_tokens(prompt)
        if images:
            # OpenAI images cost more tokens - rough estimate
            tokens += len(images) * 1000

        # Check rate limit before making request
        wait_time = await rate_limiter.wait_for_rate_limit(user_id, tokens)
        if wait_time > 0:
            import asyncio

            await asyncio.sleep(wait_time)

        if not rate_limiter.check_rate_limit(user_id, tokens):
            raise RateLimitError(f"Rate limit exceeded for user {user_id}")

        # Make request with exponential backoff for OpenAI rate limits
        try:
            import asyncio

            response = await asyncio.to_thread(self._call_openai_with_retry, prompt, images, complexity)

            # Parse rate limit headers if available (for future use)
            # Note: OpenAI SDK doesn't expose headers directly, but we can track our own limits

            # Record the request after successful call
            rate_limiter.record_request(user_id, tokens)
            return response
        except OpenAIRateLimitError as e:
            # OpenAI rate limit error - extract retry info if available
            error_msg = str(e)
            logger.warning(f"OpenAI rate limit exceeded for user {user_id}: {error_msg}")
            # The tenacity decorator will handle retry with exponential backoff
            raise RateLimitError(f"OpenAI API rate limit exceeded: {error_msg}")
        except RateLimitError:
            raise
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    @retry(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_random_exponential(min=1, max=60),
        retry=retry_if_exception_type(OpenAIRateLimitError),
    )
    def _call_openai_with_retry(self, prompt: str, images: Optional[list], complexity: ComplexityLevel) -> Dict[str, Any]:
        """
        Call OpenAI API with automatic retry on rate limit errors.
        Uses exponential backoff as recommended by OpenAI.

        Args:
            prompt: Text prompt
            images: Optional list of image bytes
            complexity: Complexity level

        Returns:
            API response dictionary
        """
        return self._call_openai(prompt, images, complexity)

    def _call_openai(self, prompt: str, images: Optional[list], complexity: ComplexityLevel) -> Dict[str, Any]:
        """
        Internal method to call OpenAI API.

        Args:
            prompt: Text prompt
            images: Optional list of image bytes
            complexity: Complexity level - "simple", "regular", or "complex"

        Returns:
            API response dictionary
        """
        # Get model name based on complexity
        model_name = self.model_names.get(complexity, self.model_names["regular"])

        # Try Responses API first (newer API from user's documentation)
        try:
            # Build content array for Responses API format
            content = [{"type": "input_text", "text": prompt}]

            # Add images if provided
            if images:
                for img_bytes in images:
                    mime_type = self._detect_image_mime_type(img_bytes)
                    base64_image = base64.b64encode(img_bytes).decode("utf-8")
                    content.append({"type": "input_image", "image_url": f"data:{mime_type};base64,{base64_image}"})

            response = self.client.responses.create(model=model_name, input=[{"role": "user", "content": content}])

            # Extract text output from Responses API
            output_text = response.output_text if hasattr(response, "output_text") else ""
        except (AttributeError, Exception) as e:
            # Fallback to Chat Completions API (standard vision API)
            logger.warning(f"Responses API not available, falling back to Chat Completions: {e}")

            # Build content array for Chat Completions API
            content = [{"type": "text", "text": prompt}]

            # Add images if provided
            if images:
                for img_bytes in images:
                    mime_type = self._detect_image_mime_type(img_bytes)
                    base64_image = base64.b64encode(img_bytes).decode("utf-8")
                    content.append({"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}})

            response = self.client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": content}])

            # Extract text output from Chat Completions API
            output_text = response.choices[0].message.content if response.choices else ""

        return {"text": output_text, "raw": str(response)}

    def parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse JSON response from OpenAI.
        Handles cases where response might be wrapped in markdown code blocks.
        More robust parsing with better error handling.

        Args:
            response_text: Raw response text from OpenAI

        Returns:
            Parsed JSON dictionary

        Raises:
            ValueError: If JSON parsing fails
        """
        import re

        # Remove markdown code blocks if present
        text = response_text.strip()

        # Remove ```json or ``` markers
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()

        # Try to extract JSON from text if it's embedded
        # Look for JSON object pattern
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            text = json_match.group(0)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Try to fix common JSON issues
            # Remove trailing commas before closing braces/brackets
            text = re.sub(r",(\s*[}\]])", r"\1", text)

            try:
                return json.loads(text)
            except json.JSONDecodeError:
                # Try to fix extra closing braces/brackets at the end
                # Count braces and brackets to find the correct end
                brace_count = 0
                bracket_count = 0
                start_idx = text.find("{")

                if start_idx != -1:
                    # Find the correct end by matching braces/brackets
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

                        # When we've closed all braces and brackets, that's the end
                        if brace_count == 0 and bracket_count == 0 and i > start_idx:
                            try:
                                return json.loads(text[start_idx : i + 1])
                            except json.JSONDecodeError:
                                # If that doesn't work, try removing extra closing chars
                                cleaned = text[start_idx : i + 1]
                                # Remove any trailing }] or ]} patterns
                                cleaned = re.sub(r"([}\]])+$", r"\1", cleaned)
                                try:
                                    return json.loads(cleaned)
                                except:
                                    pass

                # Last resort: try to extract just the tables array if it exists
                try:
                    tables_match = re.search(r'"tables"\s*:\s*\[.*?\]', text, re.DOTALL)
                    if tables_match:
                        # Construct minimal valid JSON
                        tables_json = '{"tables":' + tables_match.group(0).split(":", 1)[1] + "}"
                        return json.loads(tables_json)
                except:
                    pass

                raise ValueError(
                    f"Failed to parse JSON response: {str(e)}. Text length: {len(text)}, First 500 chars: {text[:500]}"
                )


# Global OpenAI client instance (lazy initialization)
_openai_client_instance: Optional[OpenAIClient] = None


def get_openai_client() -> OpenAIClient:
    """
    Get or create the global OpenAI client instance.
    Uses lazy initialization to ensure settings are loaded.

    Returns:
        OpenAIClient instance
    """
    global _openai_client_instance
    if _openai_client_instance is None:
        _openai_client_instance = OpenAIClient()
    return _openai_client_instance


# For backward compatibility, create a proxy object
class OpenAIClientProxy:
    """Proxy for OpenAIClient that handles lazy initialization."""

    def __getattr__(self, name):
        return getattr(get_openai_client(), name)


openai_client = OpenAIClientProxy()
