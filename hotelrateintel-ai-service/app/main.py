"""
Main application module for HotelRateIntel AI Service.

This module initializes the FastAPI application with all necessary middleware,
error handling, and debugging capabilities.

Author: HotelRateIntel Development Team
Created: 2024
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from typing import Dict, Any

from loguru import logger
from app.core.config import settings, setup_logging
from app.api.api_v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    This function handles:
    - Application startup initialization
    - Logging setup
    - Resource cleanup on shutdown
    - Debugging information
    
    Args:
        app: FastAPI application instance
    """
    # Startup
    logger.info("🌟 Starting HotelRateIntel AI Service...")
    
    try:
        # Initialize logging system
        setup_logging()
        logger.info("✅ Logging system configured")
        
        # Log application configuration
        logger.info(f"🔧 Configuration loaded:")
        logger.info(f"  - Debug mode: {settings.debug}")
        logger.info(f"  - OpenAI model: {settings.openai_model}")
        logger.info(f"  - Rate limit: {settings.rate_limit_requests_per_minute}/min")
        
        # Validate critical settings
        if not settings.openai_api_key or settings.openai_api_key == "your_openai_api_key_here":
            logger.warning("⚠️  OpenAI API key not configured - AI features will be limited")
        else:
            logger.info("✅ OpenAI API key configured")
            
        # Test OpenAI connection (optional)
        try:
            from app.services.ai_service import AIService
            ai_service = AIService()
            await ai_service.test_connection()
            logger.info("✅ OpenAI connection test successful")
        except Exception as e:
            logger.warning(f"⚠️  OpenAI connection test failed: {str(e)}")
            logger.info("💡 AI features may be limited without proper OpenAI configuration")
        
        logger.success("🚀 Application startup completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🛑 Shutting down HotelRateIntel AI Service...")
    logger.info("✅ Shutdown completed successfully")


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    This function:
    - Initializes the FastAPI app with metadata
    - Configures middleware for security and debugging
    - Sets up error handlers
    - Includes API routers
    - Adds debugging endpoints if in debug mode
    
    Returns:
        FastAPI: Configured application instance
    """
    # Create FastAPI application with comprehensive metadata
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="""
        🏨 **HotelRateIntel AI Service**
        
        A powerful AI-driven service for hotel rate analysis and competitive intelligence.
        
        ## Features
        
        * 🤖 **AI-Powered Insights**: Leverage OpenAI for intelligent rate analysis
        * 🌐 **Web Scraping**: Automated competitor rate collection
        * 📊 **Trend Analysis**: Historical pricing patterns and forecasting
        * 🔍 **Smart Filtering**: Advanced filtering and comparison tools
        * 🚨 **Alert System**: Real-time price change notifications
        * 📱 **API-First**: RESTful API for integration with any frontend
        
        ## Rate Limiting
        
        API requests are limited to {rate_limit}/minute per client.
        
        ## Authentication
        
        Most endpoints require JWT authentication. Use `/auth/login` to obtain a token.
        """.format(rate_limit=settings.rate_limit_requests_per_minute),
        openapi_url="/api/v1/openapi.json" if settings.debug else None,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan
    )
    
    # Configure CORS middleware for cross-origin requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.debug else ["https://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add trusted host middleware for security
    if not settings.debug:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["localhost", "127.0.0.1", settings.host]
        )
    
    # Custom middleware for request logging and timing
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """
        Log all HTTP requests with timing and debugging information.
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware in chain
            
        Returns:
            Response: HTTP response with timing headers
        """
        start_time = time.time()
        
        # Log request details
        logger.info(
            f"📥 {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        if settings.debug:
            logger.debug(f"🔍 Request headers: {dict(request.headers)}")
            logger.debug(f"🔍 Query params: {dict(request.query_params)}")
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Add timing header
            response.headers["X-Process-Time"] = str(process_time)
            
            # Log response
            status_emoji = "✅" if response.status_code < 400 else "❌"
            logger.info(
                f"📤 {status_emoji} {response.status_code} "
                f"({process_time:.3f}s)"
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"💥 Request failed after {process_time:.3f}s: {str(e)}")
            raise
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Handle all unhandled exceptions with proper logging and debugging.
        
        Args:
            request: HTTP request that caused the exception
            exc: The exception that occurred
            
        Returns:
            JSONResponse: Standardized error response
        """
        error_id = f"ERR-{int(time.time())}"
        
        logger.error(
            f"🚨 Unhandled exception {error_id}: {type(exc).__name__}: {str(exc)}"
        )
        
        if settings.debug:
            logger.exception("📍 Full exception traceback:")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": str(exc) if settings.debug else "An unexpected error occurred",
                "error_id": error_id,
                "type": type(exc).__name__ if settings.debug else None
            }
        )
    
    # HTTP exception handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """
        Handle HTTP exceptions with proper logging.
        
        Args:
            request: HTTP request that caused the exception
            exc: The HTTP exception that occurred
            
        Returns:
            JSONResponse: Standardized HTTP error response
        """
        logger.warning(
            f"⚠️  HTTP {exc.status_code}: {exc.detail} "
            f"for {request.method} {request.url.path}"
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "Request failed",
                "message": exc.detail,
                "status_code": exc.status_code
            }
        )
    
    # Include API router
    app.include_router(api_router, prefix="/api/v1")
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check() -> Dict[str, Any]:
        """
        Application health check endpoint.
        
        Returns:
            Dict: Health status information
        """
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "timestamp": time.time(),
            "debug_mode": settings.debug
        }
    
    # Debug endpoints (only in debug mode)
    if settings.debug:
        @app.get("/debug/config", tags=["Debug"])
        async def debug_config() -> Dict[str, Any]:
            """
            Debug endpoint to view current configuration (debug mode only).
            
            Returns:
                Dict: Current application configuration (sensitive values masked)
            """
            config_dict = settings.dict()
            
            # Mask sensitive values
            sensitive_keys = ['openai_api_key', 'secret_key', 'database_url']
            for key in sensitive_keys:
                if key in config_dict and config_dict[key]:
                    config_dict[key] = "***MASKED***"
            
            return {
                "message": "Debug configuration dump",
                "config": config_dict,
                "warning": "This endpoint is only available in debug mode"
            }
        
        @app.get("/debug/test-error", tags=["Debug"])
        async def debug_test_error():
            """
            Debug endpoint to test error handling (debug mode only).
            
            Raises:
                Exception: Test exception for debugging
            """
            logger.warning("🧪 Test error endpoint called")
            raise Exception("This is a test error for debugging purposes")
    
    logger.info("🏗️  FastAPI application created and configured")
    return app


# Create the application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    logger.info("🌟 Starting development server...")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=settings.debug
    ) 