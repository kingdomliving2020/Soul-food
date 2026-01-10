import React, { useState } from 'react';
import { useCart, PRODUCTS } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingBag, Trash2, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Gift & Order Notes
  const [isGift, setIsGift] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Customer info for email delivery
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const subtotal = getCartTotal();
  const discount = couponApplied ? (subtotal * couponApplied.discount_percent / 100) : 0;
  const total = subtotal - discount;
  
  // Minimum order for coupon discount
  const COUPON_MINIMUM = 7.00;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    // Check minimum order requirement
    if (subtotal < COUPON_MINIMUM) {
      setCouponError(`Coupons require a minimum order of $${COUPON_MINIMUM.toFixed(2)}`);
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      // Get product IDs - use uniqueKey or productId, filter out any undefined
      const productIds = cartItems
        .map(item => item.productId || item.uniqueKey || item.id)
        .filter(id => id);
      
      console.log('Validating coupon with productIds:', productIds);
      
      const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          product_ids: productIds
        }),
      });

      // Handle case where body may already be consumed by interceptor
      if (response.bodyUsed) {
        console.error('Response body already consumed');
        setCouponError('Unable to validate coupon. Please refresh and try again.');
        setCouponApplied(null);
        return;
      }

      const data = await response.json();

      if (data.valid) {
        setCouponApplied(data);
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        setCouponApplied(null);
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      // More specific error message
      if (err.message && err.message.includes('body stream')) {
        setCouponError('Unable to validate coupon. Please refresh the page and try again.');
      } else {
        setCouponError('Failed to validate coupon. Please try again.');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate total with coupon discount
      let totalAmount = cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
      if (couponApplied) {
        totalAmount = totalAmount - (totalAmount * couponApplied.discount_percent / 100);
      }
      
      // If total is $0 (100% discount), bypass Stripe and go directly to success
      if (totalAmount <= 0 && couponApplied) {
        // Record the free order with customer email for confirmation
        const orderResponse = await fetch(`${BACKEND_URL}/api/payments/free-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems.map(item => ({
              product_id: item.productId || item.uniqueKey || item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.salePrice
            })),
            coupon_code: couponApplied.code,
            discount_percent: couponApplied.discount_percent,
            customer_email: customerEmail || null,
            customer_name: customerName || null
          }),
        });

        if (orderResponse.ok) {
          // Handle case where body may already be consumed by interceptor
          let orderData;
          if (orderResponse.bodyUsed) {
            // Generate order ID locally if response was consumed
            orderData = { order_id: `FREE-${Date.now().toString(36).toUpperCase()}`, download_links: [] };
          } else {
            orderData = await orderResponse.json();
          }
          
          // Store order info including download links and redirect to success/download page
          sessionStorage.setItem('orderComplete', JSON.stringify({
            orderId: orderData.order_id,
            items: cartItems,
            coupon: couponApplied,
            downloadLinks: orderData.download_links || [],
            customerEmail: customerEmail
          }));
          clearCart();
          navigate('/order-success?free=true&order=' + orderData.order_id);
        } else {
          // Handle error response with bodyUsed check
          if (!orderResponse.bodyUsed) {
            const errorData = await orderResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to process free order');
          } else {
            throw new Error('Failed to process free order. Please try again.');
          }
        }
        return;
      }
      
      // For paid orders, use Stripe with full cart
      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId || item.uniqueKey || item.id,
            name: item.name,
            quantity: item.quantity,
            salePrice: item.salePrice,
            price: item.salePrice
          })),
          origin_url: window.location.origin,
          coupon_code: couponApplied?.code || null,
          discount_percent: couponApplied?.discount_percent || 0,
          is_gift: isGift,
          order_notes: orderNotes.trim() || null
        }),
      });

      // Handle bodyUsed check for interceptor
      let data;
      if (response.bodyUsed) {
        throw new Error('Unable to process checkout. Please refresh and try again.');
      } else {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout session');
      }
      
      // Store coupon in session storage for later application
      if (couponApplied) {
        sessionStorage.setItem('appliedCoupon', JSON.stringify(couponApplied));
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Checkout error:', err);
      // Handle the specific body stream error
      if (err.message && err.message.includes('body stream')) {
        setError('Unable to process checkout. Please refresh the page and try again.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items to your cart to continue</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-flex items-center"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {cartItems.map((item) => (
                <div key={item.uniqueKey || item.productId} className="flex justify-between items-center py-4 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {(item.isPreOrder || item.name?.includes('[PRE-ORDER]')) && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          PRE-ORDER
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      {item.listPrice > item.salePrice && (
                        <div className="text-sm text-gray-400 line-through">
                          ${item.listPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="text-lg font-bold text-purple-600">
                        ${(item.salePrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.uniqueKey || item.productId)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
              
              {/* Coupon Code Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Have a coupon code?
                </label>
                {!couponApplied ? (
                  <div className="flex gap-1.5 items-stretch">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <div>
                        <div className="font-semibold text-green-800 text-sm">{couponApplied.code}</div>
                        <div className="text-xs text-green-600">{couponApplied.discount_percent}% discount applied</div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-xs mt-2">{couponError}</p>
                )}
                {subtotal < COUPON_MINIMUM && !couponApplied && (
                  <p className="text-amber-600 text-xs mt-2">💡 Coupons require minimum order of ${COUPON_MINIMUM.toFixed(2)}</p>
                )}
              </div>
              
              {/* Customer Email for Order Confirmation */}
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-800">Get Order Confirmation</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                  📧 We'll send your order confirmation and download links to this email.
                </p>
              </div>
              
              {/* Gift & Order Notes Section */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="isGift"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <label htmlFor="isGift" className="flex-1">
                    <span className="text-sm font-semibold text-slate-700">🎁 This is a gift</span>
                    <p className="text-xs text-slate-500 mt-0.5">We'll include a gift message and remove pricing</p>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Order Notes <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Color preferences, gift message, special instructions..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{orderNotes.length}/500</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount ({couponApplied.discount_percent}%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">${total.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="text-xs text-green-600 text-right mt-1">
                      You save ${discount.toFixed(2)}!
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Continue to Payment
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure payment powered by Stripe
              </p>

              {/* Return Policy Notice - Paperback books only */}
              <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">📚 Return Policy (Paperback Books)</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Returns accepted if workbook is unmarked</li>
                  <li>• 15% restocking fee applies</li>
                  <li>• Damaged in shipping? Contact us for exchange</li>
                </ul>
                <p className="text-xs text-slate-500 mt-2 italic">
                  Digital products (PDF, ePub, Interactive) are non-refundable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
