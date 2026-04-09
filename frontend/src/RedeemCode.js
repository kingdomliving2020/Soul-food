import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gift, Check, ArrowRight, LogIn, UserPlus, Package, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RedeemCode = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState(false);

  const token = localStorage.getItem('soul_food_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('soul_food_user')); } catch { return null; }
  })();

  // Auto-verify if code is in URL
  useEffect(() => {
    if (codeFromUrl) {
      handleVerify(codeFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (orderCode) => {
    const c = (orderCode || code).trim().toUpperCase();
    if (!c) { setError('Please enter your order number.'); return; }
    setLoading(true);
    setError('');
    setOrderInfo(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/verify-claim?code=${encodeURIComponent(c)}`);
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        // If body was already consumed, use status code to determine error
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Order not found. Please check your order number.');
          } else if (res.status === 400) {
            throw new Error('This order has not been paid.');
          }
          throw new Error('Failed to verify order. Please try again.');
        }
        throw new Error('Failed to process response');
      }
      if (!res.ok) throw new Error(data.detail || 'Order not found');
      setOrderInfo(data);
      if (data.already_claimed) {
        setError('This order has already been claimed.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!token) {
      toast.info('Please sign in or create an account first.');
      navigate('/auth', { state: { returnTo: `/redeem?code=${code}` } });
      return;
    }
    setClaiming(true);
    setError('');
    try {
      const controller = new AbortController();
      const res = await fetch(`${BACKEND_URL}/api/orders/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_number: code.trim().toUpperCase() }),
        signal: controller.signal
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        // If body was already consumed, use status code to determine error
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('This order was placed with a different email. Please log in with the email used during purchase.');
          } else if (res.status === 401) {
            throw new Error('Please log in to claim this order.');
          } else if (res.status === 404) {
            throw new Error('Order not found.');
          } else if (res.status === 409) {
            throw new Error('This order has already been claimed.');
          }
          throw new Error('Failed to claim order. Please try again.');
        }
        throw new Error('Failed to process response');
      }
      
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Claim failed');
      }
      
      setClaimed(true);
      toast.success('Order claimed! Your content is in My Library.');
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while claiming the order';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Gift className="w-10 h-10 mx-auto mb-3 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="redeem-heading">Redeem Your Purchase</h1>
          <p className="text-purple-200 text-sm">Enter your order number to add content to your library.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Success State */}
        {claimed && (
          <Card className="border-2 border-green-300 mb-6" data-testid="claim-success">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Content Claimed!</h2>
              <p className="text-slate-600 mb-5">Your purchases are now available in your library.</p>
              <Button
                onClick={() => navigate('/my-library')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-8 py-3"
                data-testid="go-to-library-after-claim"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to My Library
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Code Input */}
        {!claimed && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Order Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value); setError(''); }}
                  placeholder="SF-2026-XXXXX"
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl text-base font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none uppercase"
                  data-testid="redeem-code-input"
                />
                <Button
                  onClick={() => handleVerify()}
                  disabled={loading || !code.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl font-semibold"
                  data-testid="redeem-lookup-btn"
                >
                  {loading ? 'Looking up...' : 'Look Up'}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Find your order number in your confirmation email or Stripe receipt.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6" data-testid="redeem-error">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Order Info */}
            {orderInfo && !orderInfo.already_claimed && (
              <Card className="border-2 border-purple-200 mb-6" data-testid="order-info-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-800">Order {orderInfo.order_number}</h3>
                    <Badge className="bg-green-100 text-green-700 text-xs ml-auto">Paid</Badge>
                  </div>

                  {orderInfo.customer_name && (
                    <p className="text-sm text-slate-600 mb-1">Customer: {orderInfo.customer_name}</p>
                  )}
                  <p className="text-sm text-slate-500 mb-4">Email: {orderInfo.masked_email}</p>

                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Items</p>
                    {orderInfo.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-700">{item.name}</span>
                        {item.quantity > 1 && <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>}
                      </div>
                    ))}
                  </div>

                  {/* Claim Action */}
                  {token ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">Logged in as <strong>{user?.email}</strong></p>
                      <Button
                        onClick={handleClaim}
                        disabled={claiming}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-bold"
                        data-testid="claim-order-btn"
                      >
                        {claiming ? 'Claiming...' : 'Claim This Order'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 font-medium text-center mb-1">Sign in or create an account to claim</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => navigate('/auth', { state: { returnTo: `/redeem?code=${code}`, mode: 'login' } })}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
                          data-testid="redeem-sign-in-btn"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                        <Button
                          onClick={() => navigate('/auth', { state: { returnTo: `/redeem?code=${code}`, mode: 'register' } })}
                          variant="outline"
                          className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 py-3 rounded-xl font-semibold"
                          data-testid="redeem-create-account-btn"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Text */}
        <div className="text-center text-xs text-slate-400 mt-8">
          <p>Need help? Contact <a href="mailto:support@kingdom-soul.com" className="text-purple-500 underline">support@kingdom-soul.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default RedeemCode;
