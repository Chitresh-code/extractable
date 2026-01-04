"""
Application configuration management.
Loads settings from environment variables with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    # DATABASE_URL can be set directly, or constructed from individual components
    database_url: str = ""
    postgres_host: str = "localhost"
    postgres_user: str = "extractable_user"
    postgres_password: str = "extractable_password"
    postgres_db: str = "extractable_db"
    
    def get_database_url(self) -> str:
        """
        Get DATABASE_URL, constructing from components if not explicitly set.
        If DATABASE_URL contains 'localhost' but POSTGRES_HOST is set differently (e.g., 'postgres' for Docker),
        reconstruct the URL using the correct host and password from environment variables.
        
        Returns:
            Database connection URL string
        """
        from urllib.parse import quote_plus
        
        # URL-encode password and username to handle special characters
        encoded_user = quote_plus(self.postgres_user)
        encoded_password = quote_plus(self.postgres_password)
        encoded_db = quote_plus(self.postgres_db)
        
        # If POSTGRES_HOST is set to something other than 'localhost' (Docker environment),
        # always construct from components to ensure we use the correct host and password
        if self.postgres_host != 'localhost':
            return f"postgresql://{encoded_user}:{encoded_password}@{self.postgres_host}:5432/{encoded_db}"
        
        # Otherwise, use DATABASE_URL if set, or construct from components
        if self.database_url:
            return self.database_url
        
        # Construct from individual components
        return f"postgresql://{encoded_user}:{encoded_password}@{self.postgres_host}:5432/{encoded_db}"
    
    # JWT Configuration
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OpenAI API Configuration
    openai_api_key: str = ""
    openai_simple_model: str = "gpt-5-nano"  # Simple model
    openai_regular_model: str = "gpt-5-mini"  # Regular model
    openai_complex_model: str = "gpt-5"  # Complex model
    
    # Rate Limiting
    max_retries: int = 3
    rate_limit_rpm: int = 60
    rate_limit_tpm: int = 32000
    rate_limit_rpd: int = 1500
    
    # CORS - Parse from comma-separated string or use default list
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:80"
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins if isinstance(self.cors_origins, list) else []
    
    # File Upload
    max_upload_size: int = 10485760  # 10MB
    # Note: No file storage - all data is stored as JSON in PostgreSQL
    
    # API Version
    api_version: str = "v1"
    
    model_config = SettingsConfigDict(
        env_file=".env",  # Try to read from .env file if it exists
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Also read from environment variables (which docker-compose env_file sets)
        env_ignore_empty=True
    )


# Global settings instance
settings = Settings()

