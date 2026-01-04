"""
User management endpoints for API v1.
"""

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.models.schemas import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile.

    Args:
        current_user: Current authenticated user

    Returns:
        User profile information
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_user_profile(current_user: User = Depends(get_current_user)):
    """
    Update current user profile.
    Currently returns user as-is. Can be extended for profile updates.

    Args:
        current_user: Current authenticated user

    Returns:
        Updated user profile
    """
    # Placeholder for future profile update logic
    return current_user
