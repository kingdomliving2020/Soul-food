"""
Redeem / Claim Code Routes
Allows guest purchasers to link orders to their user account.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import os

router = APIRouter(prefix="/api/orders", tags=["orders"])

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient
mongo_client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
db = mongo_client[os.environ.get("DB_NAME")]


class ClaimRequest(BaseModel):
    order_number: str
    email: str


class ClaimAuthRequest(BaseModel):
    order_number: str


async def get_current_user_optional(request: Request):
    """Extract user from token if present, return None if not"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        from jose import jwt
        payload = jwt.decode(token, os.environ.get("JWT_SECRET_KEY"), algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        return user
    except Exception:
        return None


@router.get("/verify-claim")
async def verify_claim(code: str):
    """Check if an order exists and is claimable"""
    order_number = code.strip().upper()
    
    tx = await db.payment_transactions.find_one(
        {"order_number": order_number},
        {"_id": 0, "order_number": 1, "customer_email": 1, "customer_name": 1,
         "payment_status": 1, "items": 1, "total_amount": 1, "claimed_by_user_id": 1}
    )
    
    if not tx:
        raise HTTPException(status_code=404, detail="Order not found. Please check your order number.")
    
    if tx.get("payment_status") not in ("paid", "completed"):
        raise HTTPException(status_code=400, detail="This order has not been paid.")
    
    already_claimed = bool(tx.get("claimed_by_user_id"))
    
    # Mask email for privacy (show first 2 chars + domain)
    email = tx.get("customer_email", "")
    masked = email[:2] + "***@" + email.split("@")[-1] if "@" in email else "***"
    
    items = []
    for item in tx.get("items", []):
        items.append({
            "name": item.get("name", item.get("product_id", "Unknown")),
            "quantity": item.get("quantity", 1)
        })
    
    return {
        "order_number": order_number,
        "masked_email": masked,
        "customer_name": tx.get("customer_name", ""),
        "items": items,
        "total": tx.get("total_amount", 0),
        "already_claimed": already_claimed,
        "claimable": not already_claimed
    }


@router.post("/claim")
async def claim_order(req: ClaimAuthRequest, request: Request):
    """Claim a guest order and link download links to the logged-in user"""
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Please log in or create an account to claim your order.")
    
    order_number = req.order_number.strip().upper()
    user_id = user["id"]
    user_email = user.get("email", "")
    
    # Find the transaction
    tx = await db.payment_transactions.find_one({"order_number": order_number}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    if tx.get("payment_status") not in ("paid", "completed"):
        raise HTTPException(status_code=400, detail="This order has not been paid.")
    
    # Check if already claimed by another user
    if tx.get("claimed_by_user_id") and tx["claimed_by_user_id"] != user_id:
        raise HTTPException(status_code=409, detail="This order has already been claimed by another account.")
    
    # Check if already claimed by this user
    if tx.get("claimed_by_user_id") == user_id:
        return {"message": "You have already claimed this order.", "already_claimed": True}
    
    # Verify email matches (customer_email must match logged-in user's email)
    customer_email = tx.get("customer_email", "").lower().strip()
    if customer_email and user_email.lower().strip() != customer_email:
        raise HTTPException(
            status_code=403,
            detail=f"This order was placed with a different email. Please log in with the email used during purchase."
        )
    
    # Claim: Update payment_transaction
    await db.payment_transactions.update_one(
        {"order_number": order_number},
        {"$set": {
            "claimed_by_user_id": user_id,
            "claimed_at": datetime.now(timezone.utc).isoformat(),
            "claimed_email": user_email
        }}
    )
    
    # Update all download_links for this order to use the user's ID
    dl_result = await db.download_links.update_many(
        {"order_id": order_number},
        {"$set": {
            "user_id": user_id,
            "user_email": user_email,
            "claimed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Also check for orders collection
    await db.orders.update_many(
        {"order_number": order_number},
        {"$set": {
            "claimed_by_user_id": user_id,
            "claimed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Order claimed successfully! Your content is now in My Library.",
        "claimed": True,
        "downloads_linked": dl_result.modified_count,
        "order_number": order_number
    }
