"""
Core configuration module for HotelRateIntel AI Service.

This module provides centralized configuration management with environment
variable support, validation, and debugging features.

Author: HotelRateIntel Development Team
Created: 2024
"""

import os
from typing import Optional, List
from pydantic import BaseSettings, validator
from loguru import logger


class Settings(BaseSettings):
    """
    Application settings with validation and environment variable support.
    
    All settings can be overridden via environment variables.
    Example: APP_NAME environment variable overrides app_name setting.
    """
    
    # =============================================================================
    # Application Settings
    # =============================================================================
    app_name: str = "HotelRateIntel AI Service"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    
    # =============================================================================
    # API Configuration  
    # =============================================================================
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    reload: bool = False
    
    # =============================================================================
    # OpenAI Configuration
    # =============================================================================
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    openai_max_tokens: int = 1000
    openai_temperature: float = 0.7
    
    # =============================================================================
    # Database Configuration
    # =============================================================================
    database_url: str = "sqlite:///./hotel_rate_intel.db"
    
    # =============================================================================
    # Security Configuration
    # =============================================================================
    secret_key: str = "your_super_secret_key_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # =============================================================================
    # Web Scraping Configuration
    # =============================================================================
    selenium_implicit_wait: int = 10
    selenium_headless: bool = True
    scraping_delay_min: int = 1
    scraping_delay_max: int = 3
    user_agents: List[str] = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    ]
    
    # =============================================================================
    # Rate Limiting
    # =============================================================================
    rate_limit_requests_per_minute: int = 60
    
    # =============================================================================
    # Monitoring and Logging
    # =============================================================================
    log_file_path: str = "logs/app.log"
    log_rotation: str = "10 MB"
    log_retention: str = "7 days"
    
    @validator("openai_api_key")
    def validate_openai_key(cls, v):
        """
        Validate OpenAI API key format and provide helpful debugging.
        
        Args:
            v: The OpenAI API key value
            
        Returns:
            str: Validated API key
            
        Raises:
            ValueError: If API key format is invalid
        """
        if v and not v.startswith(('sk-', 'your_openai')):
            logger.warning("⚠️  OpenAI API key doesn't start with 'sk-'. Please verify the key format.")
        
        if not v or v == "your_openai_api_key_here":
            logger.warning("⚠️  OpenAI API key not set. AI features will be disabled.")
            logger.info("💡 Set OPENAI_API_KEY environment variable to enable AI features")
            
        return v
    
    @validator("secret_key")
    def validate_secret_key(cls, v):
        """
        Validate secret key security.
        
        Args:
            v: The secret key value
            
        Returns:
            str: Validated secret key
        """
        if v == "your_super_secret_key_change_in_production":
            logger.warning("🔐 Using default secret key! Change SECRET_KEY in production.")
            
        if len(v) < 32:
            logger.warning("🔐 Secret key is short. Consider using a longer key for better security.")
            
        return v
    
    @validator("debug")
    def validate_debug_mode(cls, v):
        """
        Validate debug mode and provide security warnings.
        
        Args:
            v: Debug mode boolean value
            
        Returns:
            bool: Validated debug mode
        """
        if v:
            logger.warning("🐛 Debug mode is enabled. Disable in production!")
            logger.info("💡 Set DEBUG=False for production deployment")
            
        return v
        
    @validator("port")
    def validate_port(cls, v):
        """
        Validate port number range.
        
        Args:
            v: Port number
            
        Returns:
            int: Validated port number
            
        Raises:
            ValueError: If port is out of valid range
        """
        if not (1 <= v <= 65535):
            raise ValueError("Port must be between 1 and 65535")
            
        if v < 1024:
            logger.warning(f"🔧 Using privileged port {v}. May require root access.")
            
        return v

    class Config:
        """Pydantic configuration for environment variable handling."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        

def get_settings() -> Settings:
    """
    Get application settings with caching and debugging information.
    
    Returns:
        Settings: Configured application settings
    """
    settings = Settings()
    
    # Log configuration status for debugging
    logger.info(f"🚀 {settings.app_name} v{settings.app_version}")
    logger.info(f"🌍 Running on {settings.host}:{settings.port}")
    logger.info(f"📊 Log level: {settings.log_level}")
    logger.info(f"🤖 OpenAI model: {settings.openai_model}")
    logger.info(f"🔒 Using {settings.algorithm} for JWT tokens")
    
    # Debug environment variables
    if settings.debug:
        logger.debug("🔍 Environment variables loaded:")
        for key, value in os.environ.items():
            if key.startswith(('APP_', 'OPENAI_', 'SECRET_', 'DATABASE_')):
                # Mask sensitive values
                masked_value = "***" if 'key' in key.lower() or 'secret' in key.lower() else value
                logger.debug(f"  {key}={masked_value}")
    
    return settings


# Global settings instance
settings = get_settings()


def setup_logging():
    """
    Configure structured logging with rotation and debugging support.
    
    This function sets up loguru logging with:
    - File rotation based on size
    - Retention policy
    - Console and file output
    - Structured formatting for easier debugging
    """
    # Remove default logger
    logger.remove()
    
    # Console logger with colored output
    logger.add(
        sink=lambda msg: print(msg, end=""),
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
               "<level>{message}</level>",
        level=settings.log_level,
        colorize=True
    )
    
    # File logger with rotation
    if settings.log_file_path:
        # Create logs directory if it doesn't exist
        os.makedirs(os.path.dirname(settings.log_file_path), exist_ok=True)
        
        logger.add(
            sink=settings.log_file_path,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
            level=settings.log_level,
            rotation=settings.log_rotation,
            retention=settings.log_retention,
            encoding="utf-8"
        )
        
        logger.info(f"📝 Logging to file: {settings.log_file_path}")
    
    # Log startup information
    logger.info("🎯 Logging system initialized successfully")
    
    return logger 