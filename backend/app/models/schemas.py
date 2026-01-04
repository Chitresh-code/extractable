"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.enums import ExtractionStatus, InputType, OutputFormat


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    """JWT token response schema."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""

    user_id: Optional[int] = None


# Extraction Schemas
class ExtractionCreate(BaseModel):
    """Schema for creating extraction job."""

    columns: Optional[List[str]] = None
    multiple_tables: bool = False
    output_format: str = OutputFormat.JSON.value
    complexity: str = "regular"  # simple, regular, or complex
    priority: str = "medium"  # high, medium, low


class ExtractionResponse(BaseModel):
    """Schema for extraction response."""

    id: int
    user_id: int
    status: str
    input_type: Optional[str]
    input_filename: Optional[str]
    columns_requested: Optional[List[str]]
    multiple_tables: bool
    output_format: str
    complexity: str
    priority: str
    table_data: Optional[Dict[str, Any]] = None
    llm_extraction_output: Optional[List[Dict[str, Any]]] = None
    llm_validation_output: Optional[List[Dict[str, Any]]] = None
    llm_final_output: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExtractionUpdate(BaseModel):
    """Schema for updating extraction job."""

    input_filename: Optional[str] = None
    columns_requested: Optional[List[str]] = None
    multiple_tables: Optional[bool] = None
    output_format: Optional[str] = None


class ExtractionListResponse(BaseModel):
    """Schema for paginated extraction list."""

    items: List[ExtractionResponse]
    total: int
    page: int
    page_size: int
