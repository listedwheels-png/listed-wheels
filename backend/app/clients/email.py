from typing import List, Optional
from app.core.logging import logger


class EmailClient:
    """Client for transactional emails using AWS SES."""

    def send_email(
        self,
        to_addresses: List[str],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
    ) -> bool:
        logger.info(f"Mock SES sending email to {to_addresses} - Subject: {subject}")
        return True


email_client = EmailClient()
