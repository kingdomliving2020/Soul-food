import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GiftCertificate = () => {
  const { addGiftCertificateToCart } = useCart();
  const [selectedType, setSelectedType] = useState('book');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Track if adding to cart
  const [addingToCart, setAddingToCart] = useState(false);

  const certificateTypes = {
    book: {
      name: 'Book Selection Gift Certificate',
      icon: '📚',
      description: 'Redeemable for any Soul Food series book',
      image: '/soul-food-logo.png',
      amounts: [25, 50, 75, 100]
    },
    mixup: {
      name: 'Mix-Up Game Pass',
      icon: '🎮',
      description: '8-hour game access pass',
      image: '/soul-food-logo.png',
      amounts: [10, 20, 30]
    },
    tricky: {
      name: 'Tricky Testament Game Pass',
      icon: '🎯',
      description: '8-hour game access pass',
      image: '/soul-food-logo.png',
      amounts: [10, 20, 30]
    },
    subscription: {
      name: 'Subscription Gift',
      icon: '🎁',
      description: 'Gift a Soul Food subscription',
      image: '/soul-food-logo.png',
      amounts: [9.99, 29.97, 109.89] // 1 month, 3 months, annual
    }
  };

  // Calculate discounted amount
  const getDiscountedAmount = () => {
    if (!couponApplied) return amount;
    if (couponApplied.is_gift_certificate && couponApplied.discount_dollars > 0) {
      return Math.max(0, amount - couponApplied.discount_dollars);
    }
    return amount - (amount * couponApplied.discount_percent / 100);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          product_ids: [`gift_certificate_${selectedType}`],
          cart_total: amount
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setCouponApplied({
          code: couponCode.toUpperCase(),
          discount_percent: data.discount_percent,
          discount_dollars: data.discount_dollars || 0,
          is_gift_certificate: data.is_gift_certificate || false,
          message: data.message
        });
        setCouponError('');
        toast.success(`Coupon applied! ${data.discount_percent}% off`);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        setCouponApplied(null);
      }
    } catch (error) {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePurchaseCertificate = async () => {
    // Validate required fields
    if (!recipientName.trim()) {
      setError('Please enter the recipient\'s name');
      return;
    }
    if (!recipientEmail.trim()) {
      setError('Please enter the recipient\'s email');
      return;
    }
    if (!senderName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!senderEmail.trim()) {
      setError('Please enter your email address for order confirmation');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid recipient email address');
      return;
    }
    if (!emailRegex.test(senderEmail)) {
      setError('Please enter a valid email address for yourself');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/gift-certificates/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificate_type: selectedType,
          amount: amount,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          sender_name: senderName,
          sender_email: senderEmail,
          message: message || null,
          coupon_code: couponApplied?.code || null,
          discount_percent: couponApplied?.discount_percent || 0
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.detail || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Gift certificate error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      toast.error(err.message || 'Failed to process gift certificate');
    } finally {
      setLoading(false);
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
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Gift Certificates</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            🎁 Gift Certificates
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Give the gift of spiritual nourishment! Valid for 1 year from purchase.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Certificate Type Selection */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Choose Gift Type</h3>
            <div className="space-y-4">
              {Object.entries(certificateTypes).map(([key, type]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all ${
                    selectedType === key 
                      ? 'border-2 border-orange-500 shadow-lg' 
                      : 'border border-slate-200 hover:border-orange-300'
                  }`}
                  onClick={() => {
                    setSelectedType(key);
                    setAmount(type.amounts[0]);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{type.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-800">{type.name}</h4>
                        <p className="text-sm text-slate-600">{type.description}</p>
                      </div>
                      {selectedType === key && (
                        <CheckCircle className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Amount Selection */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Select Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {certificateTypes[selectedType].amounts.map(amt => (
                    <Button
                      key={amt}
                      variant={amount === amt ? "default" : "outline"}
                      className={amount === amt ? "bg-orange-600 hover:bg-orange-700" : ""}
                      onClick={() => setAmount(amt)}
                    >
                      ${amt.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Certificate Preview & Details */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Certificate Details</h3>
            
            {/* Preview */}
            <Card className="mb-6 bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mb-4">
                    <img 
                      src="/soul-food-logo.png" 
                      alt="Soul Food" 
                      className="w-24 h-24 mx-auto object-contain"
                    />
                  </div>
                  <h3 className="text-3xl font-bold text-orange-800 mb-2">Gift Certificate</h3>
                  <p className="text-sm text-slate-600 mb-4">Valid for 1 year from purchase</p>
                  
                  <div className="bg-white rounded-lg p-6 mb-4">
                    <div className="text-4xl mb-2">{certificateTypes[selectedType].icon}</div>
                    <p className="font-semibold text-lg text-slate-800">{certificateTypes[selectedType].name}</p>
                    <p className="text-3xl font-bold text-orange-600 mt-4">${amount.toFixed(2)}</p>
                  </div>
                  
                  {recipientName && (
                    <p className="text-slate-700">
                      <span className="font-semibold">To:</span> {recipientName}
                    </p>
                  )}
                  {senderName && (
                    <p className="text-slate-700">
                      <span className="font-semibold">From:</span> {senderName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Recipient & Sender Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                  <Input
                    placeholder="Jane Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Email *</label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">The gift certificate will be sent to this email after payment</p>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Your Information (Purchaser)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your Email *</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">You'll receive a confirmation when the gift is delivered</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Personal Message (Optional)</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg"
                    rows="3"
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Coupon Code Section */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border border-purple-100">
                  <label className="block text-sm font-semibold text-purple-700 mb-2">
                    Have a coupon code?
                  </label>
                  {couponApplied ? (
                    <div className="flex items-center justify-between bg-green-100 p-3 rounded-lg">
                      <div>
                        <span className="font-bold text-green-700">{couponApplied.code}</span>
                        <span className="text-green-600 ml-2">
                          ({couponApplied.discount_percent}% off)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 uppercase"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-xs mt-2">{couponError}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Certificate Value</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount ({couponApplied.discount_percent}%)</span>
                      <span>-${(amount - getDiscountedAmount()).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-2">
                    <span>Total to Pay</span>
                    <span className="text-orange-600">${getDiscountedAmount().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchaseCertificate}
                  disabled={loading}
                  data-testid="gift-certificate-purchase-btn"
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Purchase & Send - ${getDiscountedAmount().toFixed(2)}</>
                  )}
                </Button>
                
                <p className="text-xs text-center text-slate-500">
                  🔒 Secure payment powered by Stripe. Certificate sent only after payment succeeds.
                </p>
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Terms & Conditions:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>Gift certificates valid for 1 year from date of purchase</li>
                <li>Non-refundable but transferable</li>
                <li>Can be combined with other offers</li>
                <li>Physical paper certificate available upon request with Soul Food stickers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCertificate;
