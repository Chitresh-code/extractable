"""
API version management utilities.
Handles version tracking, validation, and deprecation.
"""

from typing import List
from app.core.config import settings

# Supported API versions
SUPPORTED_VERSIONS = ["v1"]
CURRENT_VERSION = settings.api_version


def get_current_version() -> str:
    """Get the current API version."""
    return CURRENT_VERSION


def get_supported_versions() -> List[str]:
    """Get list of supported API versions."""
    return SUPPORTED_VERSIONS


def is_version_supported(version: str) -> bool:
    """Check if an API version is supported."""
    return version in SUPPORTED_VERSIONS


def get_latest_version() -> str:
    """Get the latest API version."""
    return SUPPORTED_VERSIONS[-1] if SUPPORTED_VERSIONS else CURRENT_VERSION
