import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Search, 
  Package, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OrderLookup = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  
  // Refund request state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [itemCondition, setItemCondition] = useState('unopened');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both order number and email');
      return;
    }
    
    setLoading(true);
    setError(null);
    setOrder(null);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/orders/lookup`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.found) {
            setOrder(data);
          } else {
            setError(data.detail || 'Order not found');
          }
        } catch (e) {
          setError('Failed to lookup order');
        }
      }
    };
    
    xhr.onerror = function() {
      setLoading(false);
      setError('Network error - please try again');
    };
    
    xhr.send(JSON.stringify({
      order_number: orderNumber.trim(),
      email: email.trim()
    }));
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error('Please select a reason for the refund');
      return;
    }
    
    setSubmittingRefund(true);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/orders/request-refund`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setSubmittingRefund(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            toast.success('Refund request submitted successfully!');
            setShowRefundForm(false);
            // Refresh order data
            handleLookup({ preventDefault: () => {} });
          } else {
            toast.error(data.detail || 'Failed to submit refund request');
          }
        } catch (e) {
          toast.error('Failed to submit refund request');
        }
      }
    };
    
    xhr.send(JSON.stringify({
      order_number: order.order.order_number,
      email: email.trim(),
      reason: refundReason,
      item_condition: itemCondition,
      additional_notes: additionalNotes || null
    }));
  };

  const handleCancelPreorder = async () => {
    if (!confirm('Are you sure you want to cancel this pre-order? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/orders/cancel-preorder`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            toast.success(`Pre-order cancelled! Refund of $${data.refund_amount.toFixed(2)} processed.`);
            handleLookup({ preventDefault: () => {} });
          } else {
            toast.error(data.detail || 'Failed to cancel pre-order');
          }
        } catch (e) {
          toast.error('Failed to cancel pre-order');
        }
      }
    };
    
    xhr.send(JSON.stringify({
      order_number: order.order.order_number,
      email: email.trim()
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      'refunded': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Refunded' },
      'partial_refund': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Partial Refund' },
      'requested': { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Refund Requested' },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Package, label: status };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Order Lookup</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              Find Your Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Order Number
                  </label>
                  <Input
                    placeholder="e.g., SF-2026-ABC12"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="uppercase"
                    data-testid="order-number-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="email-input"
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                data-testid="lookup-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Order {order.order.order_number}</CardTitle>
                    <p className="text-slate-600 mt-1">
                      Placed on {new Date(order.order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(order.order.payment_status)}
                    {order.order.refund_status && getStatusBadge(order.order.refund_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Items */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-800">Items</h3>
                  <div className="divide-y">
                    {order.order.items.map((item, idx) => (
                      <div key={item.product_id || item.id || `${item.name}-${idx}`} className="py-3 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">Qty: {item.quantity || 1}</p>
                          {item.is_digital && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.is_downloaded 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.is_downloaded ? 'Downloaded' : 'Digital'}
                            </span>
                          )}
                          {!item.refund_eligible && item.refund_reason && (
                            <p className="text-xs text-orange-600 mt-1">{item.refund_reason}</p>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800">
                          ${(item.salePrice || item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-xl text-indigo-600">
                      ${(order.order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Links */}
            {order.download_links && order.download_links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-600" />
                    Your Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.download_links.map((link, idx) => (
                      <div key={link.product_id || link.product_name || `dl-${idx}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{link.product_name}</p>
                          <p className="text-sm text-slate-600">
                            Downloaded {link.download_count} of {link.max_downloads} times
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => navigate(`/payment-success?order_id=${order.order.order_number}`)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Access
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Refund Section */}
            {order.refund_eligible && !order.order.refund_status && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                    Need a Refund?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.days_remaining !== null && (
                    <p className="text-sm text-slate-600 mb-4">
                      You have <strong>{order.days_remaining} days</strong> remaining in your 30-day return window.
                    </p>
                  )}
                  
                  {!showRefundForm ? (
                    <div className="space-y-4">
                      {order.order.is_preorder && !order.order.shipped ? (
                        <Button
                          onClick={handleCancelPreorder}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel Pre-Order (Full Refund)
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowRefundForm(true)}
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                          Request Refund
                        </Button>
                      )}
                      <p className="text-xs text-slate-500">
                        View our <a href="/refund-policy" className="text-indigo-600 underline">Refund Policy</a>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Reason for Refund *</label>
                        <select
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="">Select a reason</option>
                          <option value="Changed my mind">Changed my mind</option>
                          <option value="Ordered by mistake">Ordered by mistake</option>
                          <option value="Found a better alternative">Found a better alternative</option>
                          <option value="Product not as expected">Product not as expected</option>
                          <option value="Item damaged or defective">Item damaged or defective</option>
                          <option value="Wrong item received">Wrong item received</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Item Condition (Physical Items)</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="condition"
                              value="unopened"
                              checked={itemCondition === 'unopened'}
                              onChange={(e) => setItemCondition(e.target.value)}
                            />
                            <span>Unopened (100% refund)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="condition"
                              value="opened"
                              checked={itemCondition === 'opened'}
                              onChange={(e) => setItemCondition(e.target.value)}
                            />
                            <span>Opened (85% refund)</span>
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Note: Digital items that have been downloaded are non-refundable.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Additional Notes</label>
                        <textarea
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          placeholder="Any additional details about your refund request..."
                          className="w-full p-2 border rounded-lg"
                          rows={3}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          For damaged/defective items, please email photos to support@kingdom-soul.com
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleRefundRequest}
                          disabled={submittingRefund}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {submittingRefund ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Refund Request'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRefundForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refund Not Available */}
            {!order.refund_eligible && order.refund_reason && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Refund Not Available</p>
                      <p className="text-sm text-orange-700 mt-1">{order.refund_reason}</p>
                      <p className="text-sm text-orange-600 mt-2">
                        For questions, contact <a href="mailto:support@kingdom-soul.com" className="underline">support@kingdom-soul.com</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-slate-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-3">Need Help?</h3>
            <p className="text-slate-600 mb-4">
              If you can't find your order or have questions, please contact us at{' '}
              <a href="mailto:support@kingdom-soul.com" className="text-indigo-600 font-medium">
                support@kingdom-soul.com
              </a>
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/refund-policy')}
            >
              View Refund Policy
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderLookup;
