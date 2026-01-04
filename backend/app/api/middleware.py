"""
API middleware for CORS and error handling.
"""

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    """Configure CORS middleware for the FastAPI app."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
