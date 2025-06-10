"""
Health check endpoints for HotelRateIntel AI Service.

This module provides health monitoring and status endpoints for:
- Basic service health
- Dependency status checks
- System information

Author: HotelRateIntel Development Team
Created: 2024
"""

from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime
import psutil
import os
from loguru import logger

from app.core.config import settings

# Create router for health endpoints
router = APIRouter()


@router.get("/status")
async def health_status() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns:
        Dict: Basic health status information
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now().isoformat(),
        "uptime": "running"
    }


@router.get("/detailed")
async def detailed_health() -> Dict[str, Any]:
    """
    Detailed health check with system information.
    
    Returns:
        Dict: Detailed health and system information
    """
    try:
        # Get system information
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_info = {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "timestamp": datetime.now().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100
                }
            },
            "configuration": {
                "debug_mode": settings.debug,
                "log_level": settings.log_level,
                "host": settings.host,
                "port": settings.port
            },
            "features": {
                "ai_enabled": bool(settings.openai_api_key and settings.openai_api_key != "your_openai_api_key_here"),
                "openai_model": settings.openai_model
            }
        }
        
        logger.info("✅ Detailed health check completed")
        return health_info
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return {
            "status": "error",
            "service": settings.app_name,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        } 