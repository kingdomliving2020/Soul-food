import React, { useState } from 'react';
import { useCart, PRODUCTS } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  const subtotal = getCartTotal();
  const discount = couponApplied ? (subtotal * couponApplied.discount_percent / 100) : 0;
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const productIds = cartItems.map(item => item.productId);
      
      const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          product_ids: productIds
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setCouponApplied(data);
        setCouponError('');
      } else {
        setCouponError(data.message);
        setCouponApplied(null);
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponError('Failed to validate coupon. Please try again.');
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
      // For simplicity, we'll checkout with the first item
      // In a real scenario, you might want to handle multiple items differently
      const firstItem = cartItems[0];
      
      // Calculate discounted amount if coupon applied
      let itemAmount = firstItem.salePrice * firstItem.quantity;
      if (couponApplied) {
        itemAmount = itemAmount - (itemAmount * couponApplied.discount_percent / 100);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: firstItem.productId,
          quantity: firstItem.quantity,
          origin_url: window.location.origin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Store coupon in session storage for later application
      if (couponApplied) {
        sessionStorage.setItem('appliedCoupon', JSON.stringify(couponApplied));
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
                <div key={item.productId} className="flex justify-between items-center py-4 border-b last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right ml-4">
                    {item.listPrice > item.salePrice && (
                      <div className="text-sm text-gray-400 line-through">
                        ${item.listPrice.toFixed(2)}
                      </div>
                    )}
                    <div className="text-lg font-bold text-purple-600">
                      ${(item.salePrice * item.quantity).toFixed(2)}
                    </div>
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
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
