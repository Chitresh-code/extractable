"""
Authentication endpoints for API v1.
Handles user registration, login, and token refresh.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    generate_password_reset_token,
)
from app.core.config import settings
from app.dependencies import security, get_current_user
from app.models.user import User
from app.models.schemas import (
    UserCreate,
    UserResponse,
    Token,
    ForgotPassword,
    ResetPassword,
)
from app.services.email_service import send_welcome_email, send_password_reset_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user_data: User registration data (email and password)
        db: Database session

    Returns:
        Created user object

    Raises:
        HTTPException: If email already exists
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send welcome email asynchronously (don't block registration)
    try:
        await send_welcome_email(new_user.email, new_user.first_name)
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}", exc_info=True)
        # Don't fail registration if email fails

    return new_user


@router.post("/login", response_model=Token)
async def login(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Login user and return JWT token.

    Args:
        user_data: User login data (email and password)
        db: Database session

    Returns:
        JWT access token

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    # Create access token
    # Store user.id as string to ensure consistent encoding/decoding
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires  # Convert to string for consistent JWT handling
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Refresh JWT token.

    Args:
        credentials: HTTP Bearer token credentials

    Returns:
        New JWT access token

    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    # Ensure user_id is converted to string for consistent JWT handling
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user_id)}, expires_delta=access_token_expires  # Convert to string for consistent JWT handling
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user (from dependency)

    Returns:
        Current user object
    """
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_password_data: ForgotPassword, db: Session = Depends(get_db)):
    """
    Request password reset. Sends password reset email to user.

    Args:
        forgot_password_data: Email address for password reset
        db: Database session

    Returns:
        Success message (always returns success to prevent email enumeration)
    """
    # Find user by email
    user = db.query(User).filter(User.email == forgot_password_data.email).first()

    # Always return success to prevent email enumeration
    # Only send email if user exists
    if user:
        # Generate reset token
        reset_token = generate_password_reset_token()
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
        db.commit()

        # Send password reset email
        try:
            await send_password_reset_email(user.email, reset_token, user.first_name)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}", exc_info=True)

    # Always return success message to prevent email enumeration
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(reset_password_data: ResetPassword, db: Session = Depends(get_db)):
    """
    Reset password using reset token.

    Args:
        reset_password_data: Reset token and new password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If token is invalid or expired
    """
    # Find user by reset token
    user = db.query(User).filter(User.password_reset_token == reset_password_data.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Check if token has expired
    if user.password_reset_expires is None or user.password_reset_expires < datetime.utcnow():
        # Clear expired token
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one.",
        )

    # Validate new password
    if len(reset_password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    # Update password and clear reset token
    user.hashed_password = get_password_hash(reset_password_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    logger.info(f"Password reset successful for user {user.id}")

    return {"message": "Password has been reset successfully"}
