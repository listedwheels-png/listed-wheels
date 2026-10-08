from fastapi import APIRouter
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.listings import router as listings_router
from app.api.routes.media import router as media_router
from app.api.routes.payments import router as payments_router
from app.api.routes.promos import router as promos_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.reports import router as reports_router
from app.api.routes.admin import router as admin_router
from app.api.routes.plans import router as plans_router
from app.api.routes.favorites import router as favorites_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(listings_router, prefix="/listings", tags=["listings"])
api_router.include_router(media_router, prefix="/media", tags=["media"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(promos_router, prefix="/promos", tags=["promos"])
api_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(plans_router, prefix="/plans", tags=["plans"])
api_router.include_router(favorites_router, prefix="/favorites", tags=["favorites"])
