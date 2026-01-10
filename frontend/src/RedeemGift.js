import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, CheckCircle, AlertCircle, Loader2, ArrowRight, Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RedeemGift = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('lookup'); // 'lookup', 'confirm', 'success'
  const [certificateCode, setCertificateCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [redemptionData, setRedemptionData] = useState(null);

  // Format code as user types (SF-GC-XXXXX-XXXX)
  const handleCodeChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCertificateCode(value);
    setError(null);
  };

  // Look up the certificate
  const handleLookup = async () => {
    if (!certificateCode.trim()) {
      setError('Please enter your gift certificate code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/gift-certificates/verify/${certificateCode}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setCertificateData(data);
        setStep('confirm');
      } else if (data.reason === 'already_redeemed' && data.discount_code) {
        // Already redeemed - show the discount code
        setRedemptionData({
          discount_code: data.discount_code,
          already_redeemed: true
        });
        setStep('success');
      } else {
        setError(data.message || 'Invalid certificate code');
      }
    } catch (err) {
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redeem the certificate
  const handleRedeem = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/gift-certificates/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: certificateCode,
          user_email: email
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRedemptionData(data);
        setStep('success');
        toast.success('Gift certificate redeemed!');
      } else {
        setError(data.detail || data.message || 'Failed to redeem certificate');
      }
    } catch (err) {
      setError('Failed to redeem certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy discount code to clipboard
  const copyDiscountCode = () => {
    if (redemptionData?.discount_code) {
      navigator.clipboard.writeText(redemptionData.discount_code);
      toast.success('Discount code copied!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <span>← Back to Home</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Redeem Gift Certificate</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-lg">
        {/* Step 1: Look up certificate */}
        {step === 'lookup' && (
          <Card className="shadow-xl border-orange-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Redeem Your Gift</CardTitle>
              <p className="text-slate-600 mt-2">Enter your gift certificate code to get started</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gift Certificate Code</label>
                <Input
                  placeholder="SF-GC-XXXXX-XXXX"
                  value={certificateCode}
                  onChange={handleCodeChange}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={17}
                />
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Find this code in your gift certificate email
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleLookup}
                disabled={loading || !certificateCode.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    Look Up Certificate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm and enter email */}
        {step === 'confirm' && certificateData && (
          <Card className="shadow-xl border-green-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Certificate Found!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certificate Details */}
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl p-6 text-center">
                <p className="text-sm text-orange-700 mb-2">Gift Certificate</p>
                <p className="text-3xl font-bold text-orange-800">${certificateData.amount?.toFixed(2)}</p>
                <p className="text-sm text-orange-600 mt-2">{certificateData.certificate_name}</p>
                {certificateData.sender_name && (
                  <p className="text-sm text-orange-700 mt-4">
                    From: <strong>{certificateData.sender_name}</strong>
                  </p>
                )}
                {certificateData.message && (
                  <p className="text-sm text-slate-600 italic mt-2">"{certificateData.message}"</p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-slate-600 mb-4 text-center">
                  Enter your email to receive your one-time discount code:
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setStep('lookup'); setCertificateData(null); }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={loading || !email.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      Redeem Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success - Show discount code */}
        {step === 'success' && redemptionData && (
          <Card className="shadow-xl border-green-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">
                {redemptionData.already_redeemed ? 'Already Redeemed!' : '🎉 Success!'}
              </CardTitle>
              <p className="text-slate-600 mt-2">
                {redemptionData.already_redeemed 
                  ? 'Here\'s your discount code from before:'
                  : 'Your discount code is ready to use!'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Code Display */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-center text-white">
                <p className="text-sm opacity-80 mb-2">Your One-Time Discount Code:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-mono font-bold tracking-wider">
                    {redemptionData.discount_code}
                  </p>
                  <button 
                    onClick={copyDiscountCode}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {redemptionData.amount && (
                  <p className="text-lg mt-3 opacity-90">
                    Value: <strong>${redemptionData.amount.toFixed(2)} OFF</strong>
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">How to Use:</h4>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Add items to your cart</li>
                  <li>Go to checkout</li>
                  <li>Enter code: <strong>{redemptionData.discount_code}</strong></li>
                  <li>Your discount will be applied!</li>
                </ol>
              </div>

              {/* Email Note */}
              {!redemptionData.already_redeemed && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    We've also sent this code to <strong>{email}</strong> for safekeeping.
                  </span>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  This code can only be used <strong>once</strong> and expires in 90 days.
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Back to Home
                </Button>
                <Button
                  onClick={() => navigate('/quick-order')}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Having trouble? Contact{' '}
          <a href="mailto:support@kingdom-soul.com" className="text-orange-600 hover:underline">
            support@kingdom-soul.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default RedeemGift;
