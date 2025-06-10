"""
Main API router for HotelRateIntel AI Service v1.

This module includes all API endpoint routers and provides the main
API router for the application.

Author: HotelRateIntel Development Team
Created: 2024
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import ai_insights, health

# Create the main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(ai_insights.router, prefix="/ai", tags=["AI Insights"])
api_router.include_router(health.router, prefix="/health", tags=["Health"]) 