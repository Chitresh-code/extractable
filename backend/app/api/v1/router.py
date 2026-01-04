"""
API v1 router.
Combines all v1 route modules and sets version metadata.
"""

from fastapi import APIRouter
from app.api.v1.routes import auth, extraction, users

# Create v1 API router
router = APIRouter(prefix="/api/v1", tags=["v1"])

# Include route modules
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(extraction.router, prefix="/extractions", tags=["extractions"])
router.include_router(users.router, prefix="/users", tags=["users"])
