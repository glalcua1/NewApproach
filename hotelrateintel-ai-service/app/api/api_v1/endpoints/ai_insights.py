"""
AI Insights API endpoints for HotelRateIntel.

This module provides AI-powered endpoints for:
- Rate analysis and competitive intelligence
- Demand trend predictions
- Pricing optimization recommendations

Author: HotelRateIntel Development Team
Created: 2024
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.services.ai_service import AIService, AIServiceError

# Create router for AI insights endpoints
router = APIRouter()

# Pydantic models for request/response validation

class HotelData(BaseModel):
    """Hotel rate data model."""
    name: str = Field(..., description="Hotel name")
    rate: float = Field(..., ge=0, description="Current rate")
    room_type: str = Field(..., description="Room type (e.g., Standard, Deluxe)")
    date: str = Field(..., description="Rate date (YYYY-MM-DD)")
    occupancy: Optional[float] = Field(None, ge=0, le=100, description="Current occupancy percentage")
    location: Optional[str] = Field(None, description="Hotel location")


class CompetitorData(BaseModel):
    """Competitor rate data model."""
    name: str = Field(..., description="Competitor hotel name")
    rate: float = Field(..., ge=0, description="Competitor rate")
    room_type: str = Field(..., description="Room type")
    distance: Optional[float] = Field(None, ge=0, description="Distance from your hotel (km)")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Hotel rating (1-5 stars)")


class RateAnalysisRequest(BaseModel):
    """Request model for rate analysis."""
    hotel: HotelData
    competitors: List[CompetitorData] = Field(..., min_items=1, max_items=20)
    context: Optional[str] = Field(None, description="Additional context (events, seasonality, etc.)")
    
    class Config:
        schema_extra = {
            "example": {
                "hotel": {
                    "name": "Grand Hotel Downtown",
                    "rate": 150.0,
                    "room_type": "Standard",
                    "date": "2024-01-15",
                    "occupancy": 75.5,
                    "location": "Downtown Business District"
                },
                "competitors": [
                    {
                        "name": "Business Inn Central",
                        "rate": 140.0,
                        "room_type": "Standard",
                        "distance": 0.5,
                        "rating": 4.2
                    },
                    {
                        "name": "Executive Suites",
                        "rate": 165.0,
                        "room_type": "Standard",
                        "distance": 0.8,
                        "rating": 4.5
                    }
                ],
                "context": "Major conference in town next week, high corporate demand expected"
            }
        }


class HistoricalDataPoint(BaseModel):
    """Historical data point model."""
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    rate: float = Field(..., ge=0, description="Rate for the date")
    occupancy: Optional[float] = Field(None, ge=0, le=100, description="Occupancy percentage")
    revenue: Optional[float] = Field(None, ge=0, description="Revenue for the date")


class EventData(BaseModel):
    """Event data model for demand prediction."""
    name: str = Field(..., description="Event name")
    start_date: str = Field(..., description="Event start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="Event end date (YYYY-MM-DD)")
    impact_level: str = Field(..., regex="^(low|medium|high)$", description="Expected impact on demand")
    event_type: Optional[str] = Field(None, description="Type of event (conference, concert, etc.)")


class DemandPredictionRequest(BaseModel):
    """Request model for demand prediction."""
    historical_data: List[HistoricalDataPoint] = Field(..., min_items=7, max_items=365)
    events: Optional[List[EventData]] = Field(None, max_items=10)
    
    class Config:
        schema_extra = {
            "example": {
                "historical_data": [
                    {"date": "2024-01-01", "rate": 120.0, "occupancy": 65.0, "revenue": 7800.0},
                    {"date": "2024-01-02", "rate": 125.0, "occupancy": 70.0, "revenue": 8750.0}
                ],
                "events": [
                    {
                        "name": "Tech Conference 2024",
                        "start_date": "2024-02-15",
                        "end_date": "2024-02-17",
                        "impact_level": "high",
                        "event_type": "conference"
                    }
                ]
            }
        }


class PricingRecommendationRequest(BaseModel):
    """Request model for pricing recommendations."""
    current_rates: Dict[str, float] = Field(..., description="Current rates by room type")
    market_data: Dict[str, Any] = Field(..., description="Market trends and competitor information")
    business_goals: Optional[Dict[str, Any]] = Field(None, description="Business objectives")
    
    class Config:
        schema_extra = {
            "example": {
                "current_rates": {
                    "standard": 150.0,
                    "deluxe": 200.0,
                    "suite": 300.0
                },
                "market_data": {
                    "average_competitor_rate": 145.0,
                    "market_trend": "increasing",
                    "demand_level": "high"
                },
                "business_goals": {
                    "primary_objective": "revenue_maximization",
                    "target_occupancy": 80.0,
                    "budget_constraints": None
                }
            }
        }


class AIInsightResponse(BaseModel):
    """Generic AI insight response model."""
    status: str = Field(..., description="Response status")
    insights: Dict[str, Any] = Field(..., description="AI-generated insights")
    timestamp: str = Field(..., description="Response timestamp")
    processing_time_ms: Optional[float] = Field(None, description="Processing time in milliseconds")


# Dependency to get AI service instance
def get_ai_service() -> AIService:
    """
    Dependency to provide AI service instance.
    
    Returns:
        AIService: Configured AI service instance
    """
    return AIService()


@router.post("/analyze-rates", response_model=AIInsightResponse)
async def analyze_rates(
    request: RateAnalysisRequest,
    ai_service: AIService = Depends(get_ai_service)
) -> AIInsightResponse:
    """
    Analyze hotel rates against competitors using AI.
    
    This endpoint provides comprehensive rate analysis including:
    - Competitive positioning assessment
    - Market trend insights
    - Pricing optimization recommendations
    - Risk assessment and action items
    
    Args:
        request: Rate analysis request with hotel and competitor data
        ai_service: AI service dependency
        
    Returns:
        AIInsightResponse: AI-powered rate analysis and recommendations
        
    Raises:
        HTTPException: If analysis fails or invalid data provided
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"🔍 Starting rate analysis for {request.hotel.name}")
        
        # Convert Pydantic models to dictionaries for AI service
        hotel_data = request.hotel.dict()
        competitor_data = [comp.dict() for comp in request.competitors]
        
        # Perform AI analysis
        insights = await ai_service.analyze_rate_data(
            hotel_data=hotel_data,
            competitor_data=competitor_data,
            context=request.context
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.success(f"✅ Rate analysis completed in {processing_time:.2f}ms")
        
        return AIInsightResponse(
            status="success",
            insights=insights,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time
        )
        
    except AIServiceError as e:
        logger.error(f"❌ AI service error during rate analysis: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"💥 Unexpected error during rate analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/predict-demand", response_model=AIInsightResponse)
async def predict_demand(
    request: DemandPredictionRequest,
    ai_service: AIService = Depends(get_ai_service)
) -> AIInsightResponse:
    """
    Predict demand trends using historical data and AI.
    
    This endpoint analyzes historical patterns and upcoming events to provide:
    - Demand trend forecasts
    - Peak and low demand period identification
    - Event impact assessments
    - Revenue optimization opportunities
    
    Args:
        request: Demand prediction request with historical data and events
        ai_service: AI service dependency
        
    Returns:
        AIInsightResponse: AI-powered demand predictions
        
    Raises:
        HTTPException: If prediction fails or insufficient data provided
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"📈 Starting demand prediction with {len(request.historical_data)} data points")
        
        # Convert Pydantic models to dictionaries
        historical_data = [point.dict() for point in request.historical_data]
        events = [event.dict() for event in request.events] if request.events else None
        
        # Perform AI prediction
        insights = await ai_service.predict_demand_trends(
            historical_data=historical_data,
            events=events
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.success(f"✅ Demand prediction completed in {processing_time:.2f}ms")
        
        return AIInsightResponse(
            status="success",
            insights=insights,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time
        )
        
    except AIServiceError as e:
        logger.error(f"❌ AI service error during demand prediction: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"💥 Unexpected error during demand prediction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/pricing-recommendations", response_model=AIInsightResponse)
async def pricing_recommendations(
    request: PricingRecommendationRequest,
    ai_service: AIService = Depends(get_ai_service)
) -> AIInsightResponse:
    """
    Generate AI-powered pricing recommendations.
    
    This endpoint provides intelligent pricing strategies based on:
    - Current market conditions
    - Competitive positioning
    - Business objectives
    - Revenue optimization goals
    
    Args:
        request: Pricing recommendation request with rates and market data
        ai_service: AI service dependency
        
    Returns:
        AIInsightResponse: AI-generated pricing recommendations
        
    Raises:
        HTTPException: If recommendation generation fails
    """
    start_time = datetime.now()
    
    try:
        logger.info("💰 Generating AI-powered pricing recommendations")
        
        # Perform AI recommendation generation
        insights = await ai_service.generate_pricing_recommendations(
            current_rates=request.current_rates,
            market_data=request.market_data,
            business_goals=request.business_goals
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.success(f"✅ Pricing recommendations generated in {processing_time:.2f}ms")
        
        return AIInsightResponse(
            status="success",
            insights=insights,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time
        )
        
    except AIServiceError as e:
        logger.error(f"❌ AI service error during pricing recommendations: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"💥 Unexpected error during pricing recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation generation failed: {str(e)}"
        )


@router.get("/status")
async def ai_service_status(
    ai_service: AIService = Depends(get_ai_service)
) -> Dict[str, Any]:
    """
    Get AI service status and capabilities.
    
    This endpoint provides information about:
    - AI service availability
    - OpenAI connection status
    - Supported features
    - Configuration details
    
    Args:
        ai_service: AI service dependency
        
    Returns:
        Dict: AI service status information
    """
    try:
        logger.info("🔍 Checking AI service status")
        
        status = {
            "ai_available": ai_service.is_available,
            "timestamp": datetime.now().isoformat(),
            "features": {
                "rate_analysis": True,
                "demand_prediction": ai_service.is_available,
                "pricing_recommendations": ai_service.is_available,
                "competitive_intelligence": True
            }
        }
        
        # Test OpenAI connection if available
        if ai_service.is_available:
            try:
                await ai_service.test_connection()
                status["openai_status"] = "connected"
                status["openai_model"] = "gpt-3.5-turbo"
            except Exception as e:
                status["openai_status"] = "error"
                status["openai_error"] = str(e)
                logger.warning(f"⚠️  OpenAI connection test failed: {str(e)}")
        else:
            status["openai_status"] = "not_configured"
            status["message"] = "OpenAI API key not configured - limited functionality available"
        
        logger.success("✅ AI service status check completed")
        return status
        
    except Exception as e:
        logger.error(f"💥 Error checking AI service status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Status check failed: {str(e)}"
        ) 