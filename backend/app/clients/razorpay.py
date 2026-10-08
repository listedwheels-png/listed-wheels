from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.logging import logger


class RazorpayClient:
    """Client for interacting with Razorpay payment gateway API."""

    def __init__(self) -> None:
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    def create_order(self, amount_paise: int, receipt: str, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Creates a Razorpay order in paise."""
        # Stub for Razorpay order creation
        return {
            "id": f"order_mock_{receipt}",
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
        }

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        """Verifies HMAC SHA256 webhook signature from Razorpay."""
        import hmac
        import hashlib
        if not self.webhook_secret:
            return True
        expected = hmac.new(self.webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)


razorpay_client = RazorpayClient()
