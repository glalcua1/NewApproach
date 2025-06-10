"""
AI Service module for HotelRateIntel.

This module provides AI-powered insights for hotel rate analysis using OpenAI.
It includes intelligent rate analysis, trend predictions, and actionable recommendations.

Author: HotelRateIntel Development Team
Created: 2024
"""

import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import json
import openai
from openai import OpenAI
from loguru import logger

from app.core.config import settings


class AIServiceError(Exception):
    """Custom exception for AI service errors."""
    pass


class AIService:
    """
    AI-powered service for hotel rate analysis and insights.
    
    This service provides:
    - Rate analysis and recommendations
    - Trend predictions
    - Competitive intelligence
    - Market insights
    - Pricing optimization suggestions
    """
    
    def __init__(self):
        """
        Initialize the AI service with OpenAI configuration.
        
        Raises:
            AIServiceError: If OpenAI configuration is invalid
        """
        self.client = None
        self.is_available = False
        
        # Initialize OpenAI client if API key is available
        if settings.openai_api_key and settings.openai_api_key != "your_openai_api_key_here":
            try:
                self.client = OpenAI(api_key=settings.openai_api_key)
                self.is_available = True
                logger.info("🤖 AI Service initialized with OpenAI")
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI client: {str(e)}")
                raise AIServiceError(f"OpenAI initialization failed: {str(e)}")
        else:
            logger.warning("⚠️  AI Service initialized without OpenAI (limited functionality)")
    
    async def test_connection(self) -> bool:
        """
        Test the connection to OpenAI API.
        
        Returns:
            bool: True if connection is successful
            
        Raises:
            AIServiceError: If connection test fails
        """
        if not self.is_available:
            raise AIServiceError("OpenAI client not available")
        
        try:
            logger.info("🧪 Testing OpenAI connection...")
            
            # Simple test request
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello, this is a connection test."}],
                max_tokens=10
            )
            
            if response and response.choices:
                logger.success("✅ OpenAI connection test successful")
                return True
            else:
                raise AIServiceError("Invalid response from OpenAI")
                
        except Exception as e:
            logger.error(f"❌ OpenAI connection test failed: {str(e)}")
            raise AIServiceError(f"Connection test failed: {str(e)}")
    
    async def analyze_rate_data(
        self, 
        hotel_data: Dict[str, Any], 
        competitor_data: List[Dict[str, Any]],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze hotel rate data against competitors and provide AI insights.
        
        Args:
            hotel_data: Current hotel's rate information
            competitor_data: List of competitor rate data
            context: Additional context for analysis (events, season, etc.)
            
        Returns:
            Dict: AI-generated analysis and recommendations
            
        Example:
            >>> hotel_data = {
            ...     "name": "Hotel ABC",
            ...     "rate": 150,
            ...     "room_type": "Standard",
            ...     "date": "2024-01-15"
            ... }
            >>> competitor_data = [
            ...     {"name": "Hotel XYZ", "rate": 140, "room_type": "Standard"},
            ...     {"name": "Hotel DEF", "rate": 160, "room_type": "Standard"}
            ... ]
            >>> result = await ai_service.analyze_rate_data(hotel_data, competitor_data)
        """
        if not self.is_available:
            logger.warning("🤖 AI analysis not available - providing basic analysis")
            return self._basic_rate_analysis(hotel_data, competitor_data)
        
        try:
            logger.info(f"🔍 Analyzing rates for {hotel_data.get('name', 'Unknown Hotel')}")
            
            # Prepare analysis prompt
            prompt = self._create_rate_analysis_prompt(hotel_data, competitor_data, context)
            
            # Get AI analysis
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert hotel revenue manager and pricing strategist. Provide data-driven insights and actionable recommendations for hotel pricing optimization."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.openai_max_tokens,
                temperature=settings.openai_temperature
            )
            
            if not response.choices:
                raise AIServiceError("No response from OpenAI")
            
            ai_content = response.choices[0].message.content
            logger.debug(f"🤖 Raw AI response: {ai_content}")
            
            # Parse and structure the response
            analysis = self._parse_ai_analysis(ai_content, hotel_data, competitor_data)
            
            logger.success(f"✅ Rate analysis completed for {hotel_data.get('name')}")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ AI rate analysis failed: {str(e)}")
            logger.info("🔄 Falling back to basic analysis")
            return self._basic_rate_analysis(hotel_data, competitor_data)
    
    async def predict_demand_trends(
        self, 
        historical_data: List[Dict[str, Any]], 
        events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Predict demand trends based on historical data and upcoming events.
        
        Args:
            historical_data: Historical rate and occupancy data
            events: Upcoming events that might affect demand
            
        Returns:
            Dict: Demand trend predictions and recommendations
        """
        if not self.is_available:
            logger.warning("🤖 AI demand prediction not available - providing basic trends")
            return self._basic_demand_analysis(historical_data, events)
        
        try:
            logger.info("📈 Analyzing demand trends with AI")
            
            # Prepare trend analysis prompt
            prompt = self._create_demand_prediction_prompt(historical_data, events)
            
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a hotel demand forecasting expert. Analyze historical patterns, seasonal trends, and event impacts to predict future demand and suggest optimal pricing strategies."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.openai_max_tokens,
                temperature=0.3  # Lower temperature for more consistent predictions
            )
            
            if not response.choices:
                raise AIServiceError("No response from OpenAI")
            
            ai_content = response.choices[0].message.content
            prediction = self._parse_demand_prediction(ai_content, historical_data, events)
            
            logger.success("✅ Demand trend prediction completed")
            return prediction
            
        except Exception as e:
            logger.error(f"❌ AI demand prediction failed: {str(e)}")
            logger.info("🔄 Falling back to basic trend analysis")
            return self._basic_demand_analysis(historical_data, events)
    
    async def generate_pricing_recommendations(
        self, 
        current_rates: Dict[str, Any],
        market_data: Dict[str, Any],
        business_goals: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-powered pricing recommendations.
        
        Args:
            current_rates: Current hotel rates and occupancy
            market_data: Market trends and competitor information
            business_goals: Hotel's business objectives (revenue vs occupancy)
            
        Returns:
            Dict: Pricing recommendations with rationale
        """
        if not self.is_available:
            logger.warning("🤖 AI pricing recommendations not available - providing basic suggestions")
            return self._basic_pricing_recommendations(current_rates, market_data)
        
        try:
            logger.info("💰 Generating AI-powered pricing recommendations")
            
            prompt = self._create_pricing_prompt(current_rates, market_data, business_goals)
            
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a hotel pricing optimization expert. Provide specific, actionable pricing recommendations with clear rationale based on market data, competitive positioning, and business objectives."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.openai_max_tokens,
                temperature=0.2  # Low temperature for consistent recommendations
            )
            
            if not response.choices:
                raise AIServiceError("No response from OpenAI")
            
            ai_content = response.choices[0].message.content
            recommendations = self._parse_pricing_recommendations(ai_content, current_rates, market_data)
            
            logger.success("✅ Pricing recommendations generated")
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ AI pricing recommendations failed: {str(e)}")
            logger.info("🔄 Falling back to basic recommendations")
            return self._basic_pricing_recommendations(current_rates, market_data)
    
    def _create_rate_analysis_prompt(
        self, 
        hotel_data: Dict[str, Any], 
        competitor_data: List[Dict[str, Any]], 
        context: Optional[str] = None
    ) -> str:
        """Create a detailed prompt for rate analysis."""
        prompt = f"""
        Analyze the following hotel rate data and provide insights:

        HOTEL DATA:
        {json.dumps(hotel_data, indent=2)}

        COMPETITOR DATA:
        {json.dumps(competitor_data, indent=2)}
        """
        
        if context:
            prompt += f"\n\nADDITIONAL CONTEXT:\n{context}"
        
        prompt += """

        Please provide:
        1. Competitive position analysis
        2. Rate optimization recommendations
        3. Market trend insights
        4. Action items with priority
        5. Risk assessment

        Format your response as structured JSON with clear sections.
        """
        
        return prompt
    
    def _create_demand_prediction_prompt(
        self, 
        historical_data: List[Dict[str, Any]], 
        events: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Create a prompt for demand trend prediction."""
        prompt = f"""
        Analyze historical hotel data and predict future demand trends:

        HISTORICAL DATA:
        {json.dumps(historical_data[-30:], indent=2)}  # Last 30 records
        """
        
        if events:
            prompt += f"\n\nUPCOMING EVENTS:\n{json.dumps(events, indent=2)}"
        
        prompt += """

        Please provide:
        1. Demand trend analysis (next 30 days)
        2. Peak and low demand periods
        3. Event impact assessment
        4. Pricing opportunity windows
        5. Revenue optimization strategies

        Format as structured JSON with dates and specific predictions.
        """
        
        return prompt
    
    def _create_pricing_prompt(
        self, 
        current_rates: Dict[str, Any], 
        market_data: Dict[str, Any], 
        business_goals: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a prompt for pricing recommendations."""
        prompt = f"""
        Generate pricing recommendations based on:

        CURRENT RATES:
        {json.dumps(current_rates, indent=2)}

        MARKET DATA:
        {json.dumps(market_data, indent=2)}
        """
        
        if business_goals:
            prompt += f"\n\nBUSINESS GOALS:\n{json.dumps(business_goals, indent=2)}"
        
        prompt += """

        Please provide:
        1. Specific rate recommendations by room type
        2. Implementation timeline
        3. Expected impact on revenue/occupancy
        4. Competitive positioning strategy
        5. Monitoring KPIs

        Include rationale for each recommendation with confidence levels.
        """
        
        return prompt
    
    def _parse_ai_analysis(
        self, 
        ai_content: str, 
        hotel_data: Dict[str, Any], 
        competitor_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse and structure AI analysis response."""
        try:
            # Try to parse as JSON first
            if ai_content.strip().startswith('{'):
                return json.loads(ai_content)
        except json.JSONDecodeError:
            pass
        
        # Fallback: structure the text response
        return {
            "analysis_type": "rate_comparison",
            "hotel": hotel_data.get('name', 'Unknown'),
            "timestamp": datetime.now().isoformat(),
            "ai_insights": ai_content,
            "summary": self._extract_summary(ai_content),
            "recommendations": self._extract_recommendations(ai_content),
            "confidence": "medium"  # Default confidence
        }
    
    def _parse_demand_prediction(
        self, 
        ai_content: str, 
        historical_data: List[Dict[str, Any]], 
        events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Parse AI demand prediction response."""
        try:
            if ai_content.strip().startswith('{'):
                return json.loads(ai_content)
        except json.JSONDecodeError:
            pass
        
        return {
            "prediction_type": "demand_forecast",
            "forecast_period": "30_days",
            "timestamp": datetime.now().isoformat(),
            "ai_insights": ai_content,
            "trend_summary": self._extract_summary(ai_content),
            "key_periods": self._extract_periods(ai_content),
            "confidence": "medium"
        }
    
    def _parse_pricing_recommendations(
        self, 
        ai_content: str, 
        current_rates: Dict[str, Any], 
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse AI pricing recommendation response."""
        try:
            if ai_content.strip().startswith('{'):
                return json.loads(ai_content)
        except json.JSONDecodeError:
            pass
        
        return {
            "recommendation_type": "pricing_optimization",
            "timestamp": datetime.now().isoformat(),
            "ai_insights": ai_content,
            "summary": self._extract_summary(ai_content),
            "action_items": self._extract_recommendations(ai_content),
            "implementation_priority": "high"
        }
    
    def _basic_rate_analysis(
        self, 
        hotel_data: Dict[str, Any], 
        competitor_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Provide basic rate analysis when AI is not available."""
        logger.info("📊 Performing basic rate analysis")
        
        hotel_rate = hotel_data.get('rate', 0)
        competitor_rates = [comp.get('rate', 0) for comp in competitor_data if comp.get('rate')]
        
        if not competitor_rates:
            return {
                "analysis_type": "rate_comparison",
                "hotel": hotel_data.get('name', 'Unknown'),
                "timestamp": datetime.now().isoformat(),
                "error": "No competitor data available",
                "recommendations": ["Collect competitor rate data for better analysis"]
            }
        
        avg_competitor_rate = sum(competitor_rates) / len(competitor_rates)
        min_competitor_rate = min(competitor_rates)
        max_competitor_rate = max(competitor_rates)
        
        position = "competitive"
        if hotel_rate < min_competitor_rate:
            position = "below_market"
        elif hotel_rate > max_competitor_rate:
            position = "above_market"
        
        recommendations = []
        if position == "below_market":
            recommendations.append(f"Consider increasing rate by ${avg_competitor_rate - hotel_rate:.2f} to match market average")
        elif position == "above_market":
            recommendations.append("Monitor occupancy closely - premium positioning may impact bookings")
        else:
            recommendations.append("Current rate is competitively positioned")
        
        return {
            "analysis_type": "rate_comparison",
            "hotel": hotel_data.get('name', 'Unknown'),
            "timestamp": datetime.now().isoformat(),
            "current_rate": hotel_rate,
            "market_position": position,
            "competitor_average": avg_competitor_rate,
            "competitor_range": f"${min_competitor_rate} - ${max_competitor_rate}",
            "recommendations": recommendations,
            "confidence": "basic"
        }
    
    def _basic_demand_analysis(
        self, 
        historical_data: List[Dict[str, Any]], 
        events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Provide basic demand analysis when AI is not available."""
        logger.info("📈 Performing basic demand analysis")
        
        if not historical_data:
            return {
                "prediction_type": "demand_forecast",
                "timestamp": datetime.now().isoformat(),
                "error": "No historical data available",
                "recommendations": ["Collect historical rate and occupancy data"]
            }
        
        # Simple trend analysis
        recent_data = historical_data[-7:]  # Last 7 days
        avg_rate = sum(d.get('rate', 0) for d in recent_data) / len(recent_data)
        
        return {
            "prediction_type": "demand_forecast",
            "timestamp": datetime.now().isoformat(),
            "recent_average_rate": avg_rate,
            "data_points": len(historical_data),
            "trend_summary": "Basic trend analysis based on recent data",
            "recommendations": ["Enable AI features for advanced demand prediction"],
            "confidence": "basic"
        }
    
    def _basic_pricing_recommendations(
        self, 
        current_rates: Dict[str, Any], 
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Provide basic pricing recommendations when AI is not available."""
        logger.info("💰 Generating basic pricing recommendations")
        
        return {
            "recommendation_type": "pricing_optimization",
            "timestamp": datetime.now().isoformat(),
            "summary": "Basic pricing guidance based on available data",
            "recommendations": [
                "Monitor competitor rates daily",
                "Adjust rates based on demand patterns",
                "Consider seasonal factors",
                "Enable AI features for advanced pricing optimization"
            ],
            "confidence": "basic"
        }
    
    def _extract_summary(self, text: str) -> str:
        """Extract a summary from AI response text."""
        lines = text.split('\n')
        summary_lines = []
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['summary', 'conclusion', 'key insight']):
                summary_lines.append(line.strip())
        
        if summary_lines:
            return ' '.join(summary_lines)
        
        # Fallback: return first few sentences
        sentences = text.split('.')[:3]
        return '. '.join(sentences) + '.' if sentences else text[:200]
    
    def _extract_recommendations(self, text: str) -> List[str]:
        """Extract recommendations from AI response text."""
        lines = text.split('\n')
        recommendations = []
        
        for line in lines:
            line = line.strip()
            if (line.startswith(('•', '-', '*', '1.', '2.', '3.')) or 
                'recommend' in line.lower() or 
                'suggest' in line.lower()):
                # Clean up the recommendation
                clean_rec = line.lstrip('•-*123456789. ').strip()
                if clean_rec and len(clean_rec) > 10:  # Reasonable length
                    recommendations.append(clean_rec)
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _extract_periods(self, text: str) -> List[Dict[str, Any]]:
        """Extract time periods from AI response text."""
        periods = []
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['peak', 'high demand', 'low demand', 'slow']):
                periods.append({
                    "description": line.strip(),
                    "extracted_at": datetime.now().isoformat()
                })
        
        return periods[:3]  # Limit to top 3 periods 