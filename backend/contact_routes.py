from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactMessage(BaseModel):
    email: str
    message: str
    timestamp: str
    page: str = "/"


@router.post("/message")
async def send_contact_message(message: ContactMessage):
    """
    Receive contact messages from chatbot widget
    TODO: Integrate with email service to send to kingdomlivingproject@gmail.com
    """
    try:
        # Log the message
        print(f"""
        =====================================
        NEW CONTACT MESSAGE
        =====================================
        From: {message.email}
        Time: {message.timestamp}
        Page: {message.page}
        
        Message:
        {message.message}
        
        TO: kingdomlivingproject@gmail.com
        =====================================
        """)
        
        # TODO: Integrate with SendGrid, AWS SES, or similar email service
        # Example with SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        # 
        # message = Mail(
        #     from_email='noreply@soulfood.com',
        #     to_emails='kingdomlivingproject@gmail.com',
        #     subject=f'New Contact Message from {message.email}',
        #     html_content=f'<p>{message.message}</p>'
        # )
        # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        # response = sg.send(message)
        
        return {
            "status": "success",
            "message": "Your message has been received. We'll respond shortly at kingdomlivingproject@gmail.com"
        }
        
    except Exception as e:
        print(f"Error sending contact message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")
