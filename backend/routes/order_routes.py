"""
Soul Food Order Management & Refund Routes
==========================================
Handles order lookup, refund requests, and admin refund processing.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import stripe
import secrets
import string

from motor.motor_asyncio import AsyncIOMotorClient

# Database
client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

router = APIRouter(prefix="/api/orders", tags=["orders"])

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')


def generate_friendly_order_number() -> str:
    """
    Generate a friendly order number: SF-2026-XXXXX
    SF = Soul Food
    2026 = Year
    XXXXX = 5 random alphanumeric chars
    """
    year = datetime.utcnow().year
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
    random_part = ''.join(secrets.choice(chars) for _ in range(5))
    return f"SF-{year}-{random_part}"


# ========================
# CUSTOMER-FACING ENDPOINTS
# ========================

class OrderLookupRequest(BaseModel):
    order_number: str
    email: str


class RefundRequestModel(BaseModel):
    order_number: str
    email: str
    reason: str
    item_condition: Optional[str] = None  # "unopened", "opened", "damaged"
    additional_notes: Optional[str] = None


@router.post("/lookup")
async def lookup_order(request: OrderLookupRequest):
    """
    Customer order lookup by order number and email.
    Returns order details if found and email matches.
    """
    order_number = request.order_number.strip().upper()
    email = request.email.strip().lower()
    
    # Search in orders collection
    order = await db.orders.find_one({
        "$or": [
            {"order_number": order_number},
            {"order_id": order_number}
        ]
    }, {"_id": 0})
    
    # Also search in payment_transactions (for Stripe orders)
    if not order:
        transaction = await db.payment_transactions.find_one({
            "$or": [
                {"order_number": order_number},
                {"session_id": order_number}
            ]
        }, {"_id": 0})
        
        if transaction:
            order = {
                "order_id": transaction.get("order_number") or transaction.get("session_id"),
                "order_number": transaction.get("order_number") or transaction.get("session_id"),
                "items": transaction.get("items", []),
                "total_amount": transaction.get("total_amount", 0),
                "payment_status": transaction.get("payment_status", "unknown"),
                "order_type": "paid",
                "customer_email": transaction.get("customer_email"),
                "stripe_session_id": transaction.get("session_id"),
                "stripe_payment_intent": transaction.get("payment_intent_id"),
                "created_at": transaction.get("created_at"),
                "refund_status": transaction.get("refund_status")
            }
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Please check your order number.")
    
    # Verify email matches (case-insensitive)
    order_email = (order.get("customer_email") or "").lower()
    if order_email and order_email != email:
        raise HTTPException(status_code=403, detail="Email does not match order records.")
    
    # Get download links if any
    order_id = order.get("order_id") or order.get("order_number")
    download_links = await db.download_links.find(
        {"order_id": order_id, "revoked": False},
        {"_id": 0, "token_hash": 0}
    ).to_list(100)
    
    # Determine if order is eligible for refund
    created_at = order.get("created_at")
    refund_eligible = False
    refund_reason = ""
    
    if order.get("refund_status") in ["refunded", "partial_refund"]:
        refund_reason = "This order has already been refunded."
    elif order.get("payment_status") != "paid" and order.get("payment_status") != "completed":
        refund_reason = "Payment was not completed for this order."
    elif created_at:
        # Check if within 30-day window
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        days_since_order = (datetime.utcnow() - created_at.replace(tzinfo=None)).days
        if days_since_order > 30:
            refund_reason = "This order is outside the 30-day return window."
        else:
            refund_eligible = True
    else:
        refund_eligible = True
    
    # Check if any items have been downloaded (digital items non-refundable after download)
    has_downloads = len(download_links) > 0
    downloaded_items = []
    for link in download_links:
        if link.get("download_count", 0) > 0:
            downloaded_items.append(link.get("product_name", link.get("product_id")))
    
    # Format items with refund eligibility
    items_with_eligibility = []
    for item in order.get("items", []):
        item_name = item.get("name", item.get("product_name", "Unknown"))
        item_id = item.get("product_id", item.get("id", ""))
        is_digital = "digital" in item_id.lower() or "pdf" in item_id.lower() or "ebook" in item_id.lower()
        is_downloaded = item_name in downloaded_items or item_id in [l.get("product_id") for l in download_links if l.get("download_count", 0) > 0]
        
        item_refund_eligible = refund_eligible
        item_refund_reason = ""
        
        if is_digital and is_downloaded:
            item_refund_eligible = False
            item_refund_reason = "Digital item has been downloaded"
        elif is_digital and has_downloads:
            item_refund_reason = "Digital item - non-refundable after download"
        
        items_with_eligibility.append({
            **item,
            "is_digital": is_digital,
            "is_downloaded": is_downloaded,
            "refund_eligible": item_refund_eligible,
            "refund_reason": item_refund_reason
        })
    
    return {
        "found": True,
        "order": {
            "order_number": order.get("order_number") or order.get("order_id"),
            "items": items_with_eligibility,
            "total_amount": order.get("total_amount", 0),
            "payment_status": order.get("payment_status"),
            "order_status": order.get("status", "completed"),
            "refund_status": order.get("refund_status"),
            "created_at": order.get("created_at").isoformat() if hasattr(order.get("created_at"), 'isoformat') else str(order.get("created_at", "")),
            "customer_email": order.get("customer_email"),
            "is_preorder": order.get("is_preorder", False),
            "shipped": order.get("shipped", False)
        },
        "download_links": [{
            "product_name": link.get("product_name"),
            "download_count": link.get("download_count", 0),
            "max_downloads": link.get("max_downloads", 3),
            "expires_at": link.get("expires_at").isoformat() if hasattr(link.get("expires_at"), 'isoformat') else str(link.get("expires_at", ""))
        } for link in download_links],
        "refund_eligible": refund_eligible,
        "refund_reason": refund_reason,
        "days_remaining": max(0, 30 - (datetime.utcnow() - created_at.replace(tzinfo=None)).days) if created_at and isinstance(created_at, datetime) else None
    }


@router.post("/request-refund")
async def request_refund(request: RefundRequestModel):
    """
    Submit a refund request. Sends email to support team.
    """
    from email_service import send_email, get_base_template, SUPPORT_EMAIL
    
    order_number = request.order_number.strip().upper()
    email = request.email.strip().lower()
    
    # Verify order exists and email matches
    order = await db.orders.find_one({
        "$or": [
            {"order_number": order_number},
            {"order_id": order_number}
        ]
    })
    
    if not order:
        transaction = await db.payment_transactions.find_one({
            "$or": [
                {"order_number": order_number},
                {"session_id": order_number}
            ]
        })
        if transaction:
            order = transaction
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_email = (order.get("customer_email") or "").lower()
    if order_email and order_email != email:
        raise HTTPException(status_code=403, detail="Email does not match order records")
    
    # Create refund request record
    refund_request = {
        "order_number": order_number,
        "customer_email": email,
        "reason": request.reason,
        "item_condition": request.item_condition,
        "additional_notes": request.additional_notes,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.refund_requests.insert_one(refund_request)
    
    # Update order with refund request status
    await db.orders.update_one(
        {"$or": [{"order_number": order_number}, {"order_id": order_number}]},
        {"$set": {"refund_status": "requested", "refund_requested_at": datetime.utcnow()}}
    )
    await db.payment_transactions.update_one(
        {"$or": [{"order_number": order_number}, {"session_id": order_number}]},
        {"$set": {"refund_status": "requested", "refund_requested_at": datetime.utcnow()}}
    )
    
    # Calculate refund estimate
    total = order.get("total_amount", 0)
    if request.item_condition == "opened":
        estimated_refund = total * 0.85  # 15% restocking fee
        fee_note = "15% restocking fee applied for opened items"
    else:
        estimated_refund = total
        fee_note = "Full refund (unopened item)"
    
    # Send email to support
    support_html = f"""
    <div style="padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">🔄 New Refund Request</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 15px 0; color: #991b1b;">Order Details</h3>
            <p><strong>Order Number:</strong> {order_number}</p>
            <p><strong>Customer Email:</strong> {email}</p>
            <p><strong>Order Total:</strong> ${total:.2f}</p>
            <p><strong>Estimated Refund:</strong> ${estimated_refund:.2f} ({fee_note})</p>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #334155;">Refund Request Details</h3>
            <p><strong>Reason:</strong> {request.reason}</p>
            <p><strong>Item Condition:</strong> {request.item_condition or 'Not specified'}</p>
            {f'<p><strong>Additional Notes:</strong> {request.additional_notes}</p>' if request.additional_notes else ''}
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0;">
            <p style="margin: 0; color: #065f46;">
                <strong>Action Required:</strong> Review this refund request and process via the Admin Dashboard or Stripe.
            </p>
        </div>
    </div>
    """
    
    support_email_html = get_base_template(support_html, f"Refund Request: {order_number}")
    
    await send_email(
        to=SUPPORT_EMAIL,
        subject=f"🔄 Refund Request - Order {order_number}",
        html=support_email_html
    )
    
    # Send confirmation to customer
    customer_html = f"""
    <div style="padding: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Refund Request Received</h2>
        
        <p style="color: #4b5563;">Thank you for contacting us. We've received your refund request for order <strong>{order_number}</strong>.</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #334155;">What happens next?</h3>
            <ol style="color: #64748b; margin: 0; padding-left: 20px;">
                <li>Our support team will review your request within 1-2 business days</li>
                <li>If approved, refunds are processed to your original payment method</li>
                <li>You'll receive an email confirmation once the refund is processed</li>
            </ol>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please reply to this email or contact us at {SUPPORT_EMAIL}.
        </p>
    </div>
    """
    
    customer_email_html = get_base_template(customer_html, "Your Refund Request")
    
    await send_email(
        to=email,
        subject=f"Refund Request Received - Order {order_number}",
        html=customer_email_html
    )
    
    return {
        "success": True,
        "message": "Refund request submitted successfully. You'll receive an email confirmation shortly.",
        "estimated_refund": estimated_refund,
        "fee_note": fee_note
    }


@router.post("/cancel-preorder")
async def cancel_preorder(request: OrderLookupRequest):
    """
    Cancel a pre-order that hasn't shipped yet.
    Automatically processes refund via Stripe.
    """
    order_number = request.order_number.strip().upper()
    email = request.email.strip().lower()
    
    # Find the order
    order = await db.orders.find_one({
        "$or": [
            {"order_number": order_number},
            {"order_id": order_number}
        ]
    })
    
    transaction = await db.payment_transactions.find_one({
        "$or": [
            {"order_number": order_number},
            {"session_id": order_number}
        ]
    })
    
    if not order and not transaction:
        raise HTTPException(status_code=404, detail="Order not found")
    
    source = order or transaction
    
    # Verify email
    order_email = (source.get("customer_email") or "").lower()
    if order_email and order_email != email:
        raise HTTPException(status_code=403, detail="Email does not match order records")
    
    # Check if it's a pre-order and hasn't shipped
    if not source.get("is_preorder"):
        raise HTTPException(status_code=400, detail="This is not a pre-order. Please submit a regular refund request.")
    
    if source.get("shipped"):
        raise HTTPException(status_code=400, detail="This order has already shipped. Please submit a return request instead.")
    
    # Process refund via Stripe
    payment_intent_id = source.get("payment_intent_id") or source.get("stripe_payment_intent")
    
    if payment_intent_id:
        try:
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                reason="requested_by_customer"
            )
            
            # Update order status
            update_data = {
                "refund_status": "refunded",
                "refund_id": refund.id,
                "refund_amount": refund.amount / 100,
                "refunded_at": datetime.utcnow(),
                "status": "cancelled"
            }
            
            await db.orders.update_one(
                {"$or": [{"order_number": order_number}, {"order_id": order_number}]},
                {"$set": update_data}
            )
            await db.payment_transactions.update_one(
                {"$or": [{"order_number": order_number}, {"session_id": order_number}]},
                {"$set": update_data}
            )
            
            return {
                "success": True,
                "message": "Pre-order cancelled and refund processed successfully.",
                "refund_amount": refund.amount / 100,
                "refund_id": refund.id
            }
            
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to process refund: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Cannot process automatic refund. Please contact support.")


# ========================
# ADMIN ENDPOINTS
# ========================

class AdminRefundRequest(BaseModel):
    order_number: str
    refund_type: str  # "full", "partial_15", "custom"
    custom_amount: Optional[float] = None
    reason: Optional[str] = None


@router.get("/admin/list")
async def admin_list_orders(
    status: Optional[str] = None,
    refund_status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Admin endpoint to list all orders with filtering.
    """
    query = {}
    
    if status:
        query["payment_status"] = status
    if refund_status:
        query["refund_status"] = refund_status
    
    # Get orders from both collections
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    transactions = await db.payment_transactions.find(
        {**query, "payment_status": "paid"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Merge and dedupe
    all_orders = []
    seen_ids = set()
    
    for order in orders:
        order_id = order.get("order_number") or order.get("order_id")
        if order_id not in seen_ids:
            seen_ids.add(order_id)
            all_orders.append({
                "order_number": order_id,
                "customer_email": order.get("customer_email"),
                "total_amount": order.get("total_amount", 0),
                "payment_status": order.get("payment_status"),
                "refund_status": order.get("refund_status"),
                "order_type": order.get("order_type"),
                "items_count": len(order.get("items", [])),
                "created_at": order.get("created_at").isoformat() if hasattr(order.get("created_at"), 'isoformat') else str(order.get("created_at", "")),
                "source": "orders"
            })
    
    for txn in transactions:
        txn_id = txn.get("order_number") or txn.get("session_id")
        if txn_id not in seen_ids:
            seen_ids.add(txn_id)
            all_orders.append({
                "order_number": txn_id,
                "customer_email": txn.get("customer_email"),
                "total_amount": txn.get("total_amount", 0),
                "payment_status": txn.get("payment_status"),
                "refund_status": txn.get("refund_status"),
                "order_type": "paid",
                "items_count": len(txn.get("items", [])),
                "created_at": txn.get("created_at").isoformat() if hasattr(txn.get("created_at"), 'isoformat') else str(txn.get("created_at", "")),
                "source": "transactions"
            })
    
    # Sort by created_at
    all_orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Get refund requests count
    pending_refunds = await db.refund_requests.count_documents({"status": "pending"})
    
    return {
        "orders": all_orders[:limit],
        "total": len(all_orders),
        "pending_refund_requests": pending_refunds
    }


@router.get("/admin/refund-requests")
async def admin_list_refund_requests(status: Optional[str] = None, limit: int = 50):
    """
    Admin endpoint to list refund requests.
    """
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.refund_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "requests": requests,
        "total": len(requests)
    }


@router.post("/admin/process-refund")
async def admin_process_refund(request: AdminRefundRequest):
    """
    Admin endpoint to process a refund via Stripe.
    """
    from email_service import send_email, get_base_template
    
    order_number = request.order_number.strip().upper()
    
    # Find the order/transaction
    order = await db.orders.find_one({
        "$or": [{"order_number": order_number}, {"order_id": order_number}]
    })
    
    transaction = await db.payment_transactions.find_one({
        "$or": [{"order_number": order_number}, {"session_id": order_number}]
    })
    
    source = order or transaction
    
    if not source:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if source.get("refund_status") == "refunded":
        raise HTTPException(status_code=400, detail="This order has already been fully refunded")
    
    # Get payment intent
    payment_intent_id = source.get("payment_intent_id") or source.get("stripe_payment_intent")
    session_id = source.get("session_id") or source.get("stripe_session_id")
    
    # If no payment intent, try to get it from Stripe session
    if not payment_intent_id and session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            payment_intent_id = session.payment_intent
        except stripe.error.StripeError:
            pass
    
    if not payment_intent_id:
        raise HTTPException(status_code=400, detail="Cannot find payment information for this order. Manual refund may be required in Stripe dashboard.")
    
    # Calculate refund amount
    total_amount = source.get("total_amount", 0)
    
    if request.refund_type == "full":
        refund_amount = total_amount
    elif request.refund_type == "partial_15":
        refund_amount = total_amount * 0.85  # 15% restocking fee
    elif request.refund_type == "custom" and request.custom_amount:
        refund_amount = min(request.custom_amount, total_amount)
    else:
        raise HTTPException(status_code=400, detail="Invalid refund type")
    
    # Process refund via Stripe
    try:
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            amount=int(refund_amount * 100),  # Stripe uses cents
            reason="requested_by_customer"
        )
        
        # Determine refund status
        refund_status = "refunded" if refund_amount >= total_amount else "partial_refund"
        
        # Update order/transaction
        update_data = {
            "refund_status": refund_status,
            "refund_id": refund.id,
            "refund_amount": refund_amount,
            "refunded_at": datetime.utcnow(),
            "refund_reason": request.reason
        }
        
        await db.orders.update_one(
            {"$or": [{"order_number": order_number}, {"order_id": order_number}]},
            {"$set": update_data}
        )
        await db.payment_transactions.update_one(
            {"$or": [{"order_number": order_number}, {"session_id": order_number}]},
            {"$set": update_data}
        )
        
        # Update refund request if exists
        await db.refund_requests.update_one(
            {"order_number": order_number},
            {"$set": {"status": "approved", "processed_at": datetime.utcnow(), "refund_id": refund.id}}
        )
        
        # Send confirmation email to customer
        customer_email = source.get("customer_email")
        if customer_email:
            customer_html = f"""
            <div style="padding: 20px;">
                <h2 style="color: #059669; margin-bottom: 20px;">✅ Refund Processed</h2>
                
                <p style="color: #4b5563;">Good news! Your refund for order <strong>{order_number}</strong> has been processed.</p>
                
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0;">
                    <h3 style="margin: 0 0 15px 0; color: #065f46;">Refund Details</h3>
                    <p style="margin: 5px 0;"><strong>Order Number:</strong> {order_number}</p>
                    <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ${refund_amount:.2f}</p>
                    <p style="margin: 5px 0;"><strong>Refund ID:</strong> {refund.id}</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                    The refund will appear on your original payment method within 5-10 business days, depending on your bank.
                </p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    Thank you for your understanding. If you have any questions, please contact us at support@kingdom-soul.com.
                </p>
            </div>
            """
            
            customer_email_html = get_base_template(customer_html, "Your Refund Has Been Processed")
            
            await send_email(
                to=customer_email,
                subject=f"✅ Refund Processed - Order {order_number}",
                html=customer_email_html
            )
        
        return {
            "success": True,
            "message": f"Refund of ${refund_amount:.2f} processed successfully",
            "refund_id": refund.id,
            "refund_amount": refund_amount,
            "refund_status": refund_status
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


@router.get("/admin/order/{order_number}")
async def admin_get_order_details(order_number: str):
    """
    Admin endpoint to get full order details.
    """
    order_number = order_number.strip().upper()
    
    # Find in orders
    order = await db.orders.find_one({
        "$or": [{"order_number": order_number}, {"order_id": order_number}]
    }, {"_id": 0})
    
    # Find in transactions
    transaction = await db.payment_transactions.find_one({
        "$or": [{"order_number": order_number}, {"session_id": order_number}]
    }, {"_id": 0})
    
    if not order and not transaction:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get refund request if any
    refund_request = await db.refund_requests.find_one(
        {"order_number": order_number},
        {"_id": 0}
    )
    
    # Get download links
    order_id = order_number
    if order:
        order_id = order.get("order_id") or order.get("order_number")
    elif transaction:
        order_id = transaction.get("session_id")
    
    download_links = await db.download_links.find(
        {"order_id": order_id},
        {"_id": 0, "token_hash": 0}
    ).to_list(100)
    
    return {
        "order": order,
        "transaction": transaction,
        "refund_request": refund_request,
        "download_links": download_links
    }
