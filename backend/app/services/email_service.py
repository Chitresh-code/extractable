"""
Email service using Resend API.
Handles sending transactional emails like welcome emails and password reset emails.
"""

import logging
from typing import Optional
from resend import Resend
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Resend client
resend_client = None
if settings.resend_api_key:
    resend_client = Resend(api_key=settings.resend_api_key)
else:
    logger.warning("RESEND_API_KEY not set. Email functionality will be disabled.")


async def send_welcome_email(
    email: str, first_name: Optional[str] = None, last_name: Optional[str] = None
) -> bool:
    """
    Send welcome email to newly registered user.

    Args:
        email: User's email address
        first_name: User's first name (optional)
        last_name: User's last name (optional)

    Returns:
        True if email was sent successfully, False otherwise
    """
    if not resend_client:
        logger.warning("Resend client not initialized. Skipping welcome email.")
        return False

    try:
        # Format recipient name for email header
        name_parts = [part for part in [first_name, last_name] if part]
        full_name = " ".join(name_parts) if name_parts else None
        recipient = f'"{full_name}" <{email}>' if full_name else email
        
        # Format greeting name
        greeting_name = full_name or first_name or "there"
        subject = "Welcome to Extractable!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Extractable</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Extractable!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi {greeting_name},</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for joining Extractable! We're excited to have you on board.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Extractable helps you extract structured tables from PDFs and images using advanced AI technology.
                </p>
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <h3 style="margin-top: 0; color: #667eea;">Get Started:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Upload PDFs or images</li>
                        <li>Extract structured table data</li>
                        <li>Export to CSV, Excel, or JSON</li>
                    </ul>
                </div>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    If you have any questions, feel free to reach out to our support team.
                </p>
                <p style="font-size: 16px; margin-top: 30px;">
                    Best regards,<br>
                    The Extractable Team
                </p>
            </div>
        </body>
        </html>
        """

        params = {
            "from": settings.resend_from_email,
            "to": [recipient],
            "subject": subject,
            "html": html_content,
        }

        response = resend_client.emails.send(params)
        logger.info(f"Welcome email sent to {email}: {response}")
        return True

    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}", exc_info=True)
        return False


async def send_password_reset_email(
    email: str, reset_token: str, first_name: Optional[str] = None, last_name: Optional[str] = None
) -> bool:
    """
    Send password reset email to user.

    Args:
        email: User's email address
        reset_token: Password reset token
        first_name: User's first name (optional)
        last_name: User's last name (optional)

    Returns:
        True if email was sent successfully, False otherwise
    """
    if not resend_client:
        logger.warning("Resend client not initialized. Skipping password reset email.")
        return False

    try:
        # Format recipient name for email header
        name_parts = [part for part in [first_name, last_name] if part]
        full_name = " ".join(name_parts) if name_parts else None
        recipient = f'"{full_name}" <{email}>' if full_name else email
        
        # Format greeting name
        greeting_name = full_name or first_name or "there"
        reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
        subject = "Reset Your Extractable Password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi {greeting_name},</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    We received a request to reset your password for your Extractable account.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Click the button below to reset your password. This link will expire in 1 hour.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                </p>
                <p style="font-size: 14px; color: #666;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{reset_url}" style="color: #667eea; word-break: break-all;">{reset_url}</a>
                </p>
                <p style="font-size: 16px; margin-top: 30px;">
                    Best regards,<br>
                    The Extractable Team
                </p>
            </div>
        </body>
        </html>
        """

        params = {
            "from": settings.resend_from_email,
            "to": [recipient],
            "subject": subject,
            "html": html_content,
        }

        response = resend_client.emails.send(params)
        logger.info(f"Password reset email sent to {email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}", exc_info=True)
        return False

