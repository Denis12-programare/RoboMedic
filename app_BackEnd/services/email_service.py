import logging
import smtplib
from email.message import EmailMessage

from backend.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.host = settings.EMAIL_SMTP_HOST
        self.port = settings.EMAIL_SMTP_PORT
        self.user = settings.EMAIL_SMTP_USER
        self.password = settings.EMAIL_SMTP_PASSWORD
        self.from_address = settings.EMAIL_SMTP_FROM or self.user
        self.use_tls = settings.EMAIL_SMTP_USE_TLS

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.user and self.password and self.from_address)

    def send_verification_code(self, recipient: str, code: str) -> bool:
        if not all([self.host, self.port, self.user, self.password, self.from_address]):
            logger.warning("Email configuration is incomplete, skipping code delivery to %s", recipient)
            return False

        message = EmailMessage()
        message["Subject"] = "RoboMedic verification code"
        message["From"] = self.from_address
        message["To"] = recipient
        message.set_content(
            f"Hi there,\n\nYour RoboMedic verification code is: {code}\n\n"
            "If you didn't request this, just ignore this email.\n\n"
            "Cheers,\nRoboMedic Team"
        )

        try:
            with smtplib.SMTP(self.host, self.port, timeout=10) as smtp:
                if self.use_tls:
                    smtp.starttls()
                smtp.login(self.user, self.password)
                smtp.send_message(message)
            logger.info("Sent verification code to %s", recipient)
            return True
        except Exception as exc:
            logger.exception("Unable to send verification email to %s: %s", recipient, exc)
            return False


email_service = EmailService()
