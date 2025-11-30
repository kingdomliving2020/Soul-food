"""
Soul Food Subscription Management Rules
========================================

SUBSCRIPTION PRICING & BILLING RULES:
-------------------------------------

1. **Rate Lock-In**:
   - Users lock in the advertised rate at the time of purchase
   - Rate remains fixed for the lifetime of their subscription
   - New subscribers may see different rates, but existing subscribers keep their original rate

2. **Coupon/Voucher Policy**:
   - Coupons and vouchers CANNOT be applied to monthly subscription items
   - No double reductions allowed on subscription products
   - One-time purchases (books, bundles) CAN use coupons
   - Subscription products are marked as `coupon_eligible: False`

3. **Cancellation Policy**:
   - Users can cancel at any time
   - If canceled **5+ days before next billing date**: No charge for upcoming month
   - If canceled **less than 5 days before billing**: User is charged for upcoming month, then cancellation takes effect
   - Formula: `days_until_billing >= 5` → No charge, else → One more charge

4. **Refund Policy**:
   - **NO REFUNDS** for the active/current month
   - Subscription only stops future charges
   - Users retain access through the end of their paid period
   - Example: If user cancels on Jan 15th (paid through Jan 31st), they keep access until Jan 31st

5. **Billing Cycle**:
   - All subscriptions bill monthly on the same day of the month as signup
   - Example: Signed up Jan 15th → Bills on 15th of each month
   - For months with fewer days (e.g., Feb 28/29), bills on the last day

6. **Access Management**:
   - Active subscribers get immediate access to all available content
   - Access continues through the end of paid period even after cancellation
   - Grace period: 3 days after failed payment before access is revoked

SUBSCRIPTION PRODUCTS:
---------------------

Adult Edition ($9.99/month):
- All Soul Food series lessons
- WEB Bible content
- Interactive workbooks
- Monthly audible prayers (adult-targeted)
- Theme-based teaching videos
- General audio per meal series
- Community discussion access

Youth Edition ($9.99/month):
- Youth-focused lessons (ages 12-20)
- Engaging interactive activities
- Monthly youth-targeted prayers
- Youth-specific teaching videos
- Audio content per meal theme
- Peer community access
- Parent resources

Instructor Edition ($14.99/month):
- All Adult & Youth content
- Math connections to biblical concepts
- Dual scripture view for comparison
- Historical reference connections
- Teaching guides & answer keys
- Discussion prompts & facilitation tips
- All multimedia (audio & video)
- Downloadable teaching materials

IMPLEMENTATION NOTES:
--------------------

Database Schema Requirements:
- Store `subscription_rate` in user record (locked rate)
- Store `subscription_start_date` (for billing cycle)
- Store `next_billing_date` (calculated)
- Store `cancellation_requested_date` (for 5-day rule)
- Store `subscription_status`: 'active', 'cancelled', 'grace_period', 'expired'

Validation Rules:
- Check `coupon_eligible` flag before applying coupons
- Calculate days until next billing for cancellation logic
- Enforce rate lock-in by using stored `subscription_rate` not current catalog price

Recommended Cron Jobs:
- Daily: Check for billing dates and process payments
- Daily: Check for failed payments and grace period expiration
- Daily: Process pending cancellations (5-day rule)
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple


def can_cancel_without_charge(next_billing_date: datetime) -> bool:
    """
    Check if user can cancel without being charged for next month.
    
    Args:
        next_billing_date: The date of the next scheduled billing
        
    Returns:
        True if cancellation is 5+ days before billing, False otherwise
    """
    days_until_billing = (next_billing_date - datetime.now()).days
    return days_until_billing >= 5


def calculate_next_billing_date(start_date: datetime, months_elapsed: int = 1) -> datetime:
    """
    Calculate the next billing date based on signup date.
    
    Args:
        start_date: The original subscription start date
        months_elapsed: Number of months since start (default 1 for next month)
        
    Returns:
        The next billing date
    """
    # Add months to start date
    month = start_date.month + months_elapsed
    year = start_date.year
    
    # Handle year overflow
    while month > 12:
        month -= 12
        year += 1
    
    # Handle day overflow for shorter months
    day = start_date.day
    try:
        next_date = datetime(year, month, day, start_date.hour, start_date.minute)
    except ValueError:
        # Day doesn't exist in target month (e.g., Jan 31 -> Feb 31)
        # Use last day of target month
        if month == 12:
            next_month = 1
            next_year = year + 1
        else:
            next_month = month + 1
            next_year = year
        last_day = (datetime(next_year, next_month, 1) - timedelta(days=1)).day
        next_date = datetime(year, month, last_day, start_date.hour, start_date.minute)
    
    return next_date


def validate_coupon_for_product(product_id: str, products: Dict) -> Tuple[bool, str]:
    """
    Validate if a coupon can be applied to a product.
    
    Args:
        product_id: The ID of the product
        products: Product catalog dictionary
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if product_id not in products:
        return False, "Invalid product"
    
    product = products[product_id]
    
    # Check if product is subscription type
    if product.get('type') == 'subscription':
        return False, "Coupons cannot be applied to subscription products"
    
    # Check coupon_eligible flag
    if not product.get('coupon_eligible', True):
        return False, "This product is not eligible for coupon discounts"
    
    return True, "Coupon can be applied"


def process_cancellation(
    user_subscription: Dict,
    cancellation_date: datetime = None
) -> Dict:
    """
    Process a subscription cancellation request.
    
    Args:
        user_subscription: User's subscription data including next_billing_date
        cancellation_date: Date of cancellation request (default: now)
        
    Returns:
        Dictionary with cancellation details
    """
    if cancellation_date is None:
        cancellation_date = datetime.now()
    
    next_billing = user_subscription['next_billing_date']
    will_charge = not can_cancel_without_charge(next_billing)
    
    # Calculate access end date
    if will_charge:
        # User will be charged one more time, access until next billing date
        access_end_date = next_billing
        final_charge_amount = user_subscription.get('subscription_rate', 9.99)
    else:
        # No charge, access ends at current period end
        access_end_date = user_subscription.get('current_period_end', next_billing)
        final_charge_amount = 0.00
    
    return {
        "cancellation_date": cancellation_date,
        "will_charge_next_month": will_charge,
        "final_charge_amount": final_charge_amount,
        "access_end_date": access_end_date,
        "status": "cancelled_pending" if will_charge else "cancelled",
        "message": (
            f"Your subscription will be cancelled. "
            f"{'You will be charged one final time on ' + next_billing.strftime('%B %d, %Y') if will_charge else 'No additional charges will be made.'} "
            f"You will have access until {access_end_date.strftime('%B %d, %Y')}."
        )
    }
