"""
User management endpoints for API v1.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.schemas import UserResponse, UserUpdate, PasswordChange
from app.core.security import verify_password, get_password_hash
import logging

logger = logging.getLogger(__name__)

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
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user profile.

    Args:
        user_update: Fields to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile

    Raises:
        HTTPException: If email is already taken
    """
    # Update email if provided
    if user_update.email is not None and user_update.email != current_user.email:
        # Check if email is already taken
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_update.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password", response_model=UserResponse)
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user password.

    Args:
        password_change: Current and new password
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile

    Raises:
        HTTPException: If current password is incorrect
    """
    # Verify current password
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_change.new_password)
    db.commit()
    db.refresh(current_user)

    logger.info(f"Password changed for user {current_user.id}")
    return current_user
