import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from jinja2 import Template
import os
from dataclasses import dataclass

from ..app import SessionLocal, Alert, RateData, Hotel, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AlertTrigger:
    alert_id: int
    alert_name: str
    hotel_name: str
    condition: str
    threshold: float
    current_rate: float
    previous_rate: Optional[float]
    source: str
    user_email: str

class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@hotelrateintel.com")
    
    def _get_email_template(self) -> str:
        """Email template for rate alerts"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header { background-color: #3b82f6; color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 8px 8px 0 0; }
                .alert-info { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .rate-change { font-size: 24px; font-weight: bold; color: #dc2626; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Rate Alert - {{ alert_name }}</h1>
                </div>
                
                <p>Your rate alert has been triggered for <strong>{{ hotel_name }}</strong>.</p>
                
                <div class="alert-info">
                    <h3>Alert Details:</h3>
                    <ul>
                        <li><strong>Condition:</strong> {{ condition_text }}</li>
                        <li><strong>Threshold:</strong> ${{ threshold }}</li>
                        <li><strong>Current Rate:</strong> <span class="rate-change">${{ current_rate }}</span></li>
                        {% if previous_rate %}
                        <li><strong>Previous Rate:</strong> ${{ previous_rate }}</li>
                        {% endif %}
                        <li><strong>Source:</strong> {{ source }}</li>
                        <li><strong>Triggered:</strong> {{ timestamp }}</li>
                    </ul>
                </div>
                
                <p>This alert was triggered because the rate {{ condition_description }}.</p>
                
                <p><a href="{{ dashboard_url }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a></p>
                
                <div class="footer">
                    <p>Best regards,<br>HotelRateIntel Team</p>
                    <p><small>To manage your alerts, visit your dashboard. This is an automated message.</small></p>
                </div>
            </div>
        </body>
        </html>
        """
    
    async def send_alert_email(self, trigger: AlertTrigger):
        """Send email notification for rate alert"""
        try:
            # Prepare email content
            template = Template(self._get_email_template())
            
            condition_text = self._get_condition_text(trigger.condition, trigger.threshold)
            condition_description = self._get_condition_description(trigger)
            
            html_content = template.render(
                alert_name=trigger.alert_name,
                hotel_name=trigger.hotel_name,
                condition_text=condition_text,
                threshold=trigger.threshold,
                current_rate=trigger.current_rate,
                previous_rate=trigger.previous_rate,
                source=trigger.source,
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                condition_description=condition_description,
                dashboard_url="http://localhost:3000/dashboard"  # Update with actual URL
            )
            
            # Create email message
            msg = MimeMultipart('alternative')
            msg['Subject'] = f"🔔 Rate Alert: {trigger.hotel_name} - {trigger.alert_name}"
            msg['From'] = self.from_email
            msg['To'] = trigger.user_email
            
            # Add HTML content
            html_part = MimeText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            if self.smtp_username and self.smtp_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                
                logger.info(f"Alert email sent to {trigger.user_email} for {trigger.hotel_name}")
            else:
                logger.warning("SMTP credentials not configured, skipping email")
                
        except Exception as e:
            logger.error(f"Error sending alert email: {e}")
    
    def _get_condition_text(self, condition: str, threshold: float) -> str:
        """Get human-readable condition text"""
        if condition == 'above':
            return f"Rate above ${threshold}"
        elif condition == 'below':
            return f"Rate below ${threshold}"
        elif condition == 'change':
            return f"Rate change > {threshold}%"
        return "Unknown condition"
    
    def _get_condition_description(self, trigger: AlertTrigger) -> str:
        """Get description of why alert was triggered"""
        if trigger.condition == 'above':
            return f"went above your threshold of ${trigger.threshold}"
        elif trigger.condition == 'below':
            return f"dropped below your threshold of ${trigger.threshold}"
        elif trigger.condition == 'change' and trigger.previous_rate:
            change_pct = abs((trigger.current_rate - trigger.previous_rate) / trigger.previous_rate * 100)
            return f"changed by {change_pct:.1f}% (threshold: {trigger.threshold}%)"
        return "met your alert conditions"

class AlertService:
    """Service for managing and processing rate alerts"""
    
    def __init__(self):
        self.email_service = EmailService()
    
    async def check_all_alerts(self):
        """Check all active alerts against current rate data"""
        db = SessionLocal()
        
        try:
            # Get all active alerts
            active_alerts = db.query(Alert).filter(Alert.enabled == True).all()
            
            logger.info(f"Checking {len(active_alerts)} active alerts")
            
            for alert in active_alerts:
                try:
                    await self._check_single_alert(db, alert)
                except Exception as e:
                    logger.error(f"Error checking alert {alert.id}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in check_all_alerts: {e}")
        finally:
            db.close()
    
    async def _check_single_alert(self, db: Session, alert: Alert):
        """Check a single alert against current rate data"""
        
        # Get latest rate data for the hotel
        latest_rate = db.query(RateData).filter(
            RateData.hotel_id == alert.hotel_id
        ).order_by(RateData.scraped_at.desc()).first()
        
        if not latest_rate:
            logger.warning(f"No rate data found for hotel {alert.hotel_id}")
            return
        
        # Get previous rate for change calculations
        previous_rate = db.query(RateData).filter(
            and_(
                RateData.hotel_id == alert.hotel_id,
                RateData.scraped_at < latest_rate.scraped_at
            )
        ).order_by(RateData.scraped_at.desc()).first()
        
        # Check if alert conditions are met
        should_trigger = self._should_trigger_alert(alert, latest_rate, previous_rate)
        
        if should_trigger:
            await self._trigger_alert(db, alert, latest_rate, previous_rate)
    
    def _should_trigger_alert(self, alert: Alert, current_rate: RateData, previous_rate: Optional[RateData]) -> bool:
        """Determine if alert should be triggered"""
        
        # Check cooldown period (don't trigger same alert within 1 hour)
        if alert.last_triggered:
            time_since_last = datetime.utcnow() - alert.last_triggered
            if time_since_last < timedelta(hours=1):
                return False
        
        # Check conditions
        if alert.condition == 'above':
            return current_rate.rate > alert.threshold
        
        elif alert.condition == 'below':
            return current_rate.rate < alert.threshold
        
        elif alert.condition == 'change' and previous_rate:
            change_pct = abs((current_rate.rate - previous_rate.rate) / previous_rate.rate * 100)
            return change_pct > alert.threshold
        
        return False
    
    async def _trigger_alert(self, db: Session, alert: Alert, current_rate: RateData, previous_rate: Optional[RateData]):
        """Trigger alert: send notification and update database"""
        
        try:
            # Get user and hotel information
            user = db.query(User).filter(User.id == alert.user_id).first()
            hotel = db.query(Hotel).filter(Hotel.id == alert.hotel_id).first()
            
            if not user or not hotel:
                logger.error(f"User or hotel not found for alert {alert.id}")
                return
            
            # Create trigger object
            trigger = AlertTrigger(
                alert_id=alert.id,
                alert_name=alert.name,
                hotel_name=hotel.name,
                condition=alert.condition,
                threshold=alert.threshold,
                current_rate=current_rate.rate,
                previous_rate=previous_rate.rate if previous_rate else None,
                source=current_rate.source,
                user_email=user.email
            )
            
            # Send email notification
            await self.email_service.send_alert_email(trigger)
            
            # Update alert last_triggered timestamp
            alert.last_triggered = datetime.utcnow()
            db.commit()
            
            logger.info(f"Alert {alert.id} triggered for hotel {hotel.name}")
            
        except Exception as e:
            logger.error(f"Error triggering alert {alert.id}: {e}")
            db.rollback()

class AlertScheduler:
    """Scheduler for running alert checks periodically"""
    
    def __init__(self, check_interval: int = 300):  # 5 minutes default
        self.check_interval = check_interval
        self.alert_service = AlertService()
        self.running = False
    
    async def start(self):
        """Start the alert checking scheduler"""
        self.running = True
        logger.info(f"Starting alert scheduler (checking every {self.check_interval} seconds)")
        
        while self.running:
            try:
                await self.alert_service.check_all_alerts()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in alert scheduler: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    def stop(self):
        """Stop the alert scheduler"""
        self.running = False
        logger.info("Alert scheduler stopped")

# Background task for alert processing
async def run_alert_monitoring():
    """Background task to continuously monitor alerts"""
    scheduler = AlertScheduler(check_interval=300)  # Check every 5 minutes
    await scheduler.start()

# Manual alert check function
async def check_alerts_now():
    """Manually trigger alert checking (useful for testing)"""
    service = AlertService()
    await service.check_all_alerts()

if __name__ == "__main__":
    # Test the alert service
    async def test_alerts():
        await check_alerts_now()
    
    asyncio.run(test_alerts()) 