"""
FastAPI application entry point.
Sets up the application, includes routers, and configures middleware.
"""

import logging
import sys

# Configure logging FIRST, before any other imports that might log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
    force=True,  # Force reconfiguration if already configured
)

from fastapi import FastAPI
from app.api.middleware import setup_cors
from app.api.v1.router import router as v1_router
from app.api.versioning import get_current_version, get_supported_versions

# Create FastAPI app
app = FastAPI(
    title="Extractable API", description="SaaS platform for extracting structured tables from PDFs and images", version="1.0.0"
)

# Setup CORS
setup_cors(app)

# Include versioned routers
app.include_router(v1_router)


@app.get("/health")
async def health_check():
    """Health check endpoint (non-versioned)."""
    return {"status": "healthy"}


@app.get("/api/versions")
async def get_api_versions():
    """Get available API versions."""
    return {"current_version": get_current_version(), "supported_versions": get_supported_versions()}
