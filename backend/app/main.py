import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import api_router
from app.core.config import settings
from app.core.errors import (
    AppError,
    app_error_handler,
    generic_error_handler,
    http_error_handler,
    validation_error_handler,
)
from app.core.logging import logger, request_id_ctx_var, setup_logging
from app.db.session import check_db_health
from app.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown events."""
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} mode...")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title="ListedWheels API",
    description="Trust-focused marketplace for used vehicles in India",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers & Request ID Logging Middleware
@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_ctx_var.set(req_id)
    start_time = time.perf_counter()

    try:
        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        # Headers
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Process-Time-Ms"] = str(process_time_ms)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        logger.info(f"{request.method} {request.url.path} completed with {response.status_code} in {process_time_ms}ms")
        return response
    finally:
        request_id_ctx_var.reset(token)


# Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(StarletteHTTPException, http_error_handler)
app.add_exception_handler(Exception, generic_error_handler)


# Health Check Endpoints
@app.get("/health", response_model=HealthResponse, tags=["health"], summary="Service health check")
@app.get(f"{settings.API_V1_STR}/health", response_model=HealthResponse, tags=["health"], summary="Service health check (v1)")
async def health_check() -> HealthResponse:
    """Returns application health status and database connectivity."""
    db_ok = await check_db_health()
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        database="connected" if db_ok else "unreachable",
    )


# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
