import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RefundRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    order_number: '',
    email: '',
    reason: '',
    items_to_return: '',
    description: '',
    refund_type: 'full'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { id: 'damaged', label: 'Item arrived damaged' },
    { id: 'not_as_expected', label: 'Not what I expected' },
    { id: 'ordered_wrong', label: 'Ordered wrong item/edition' },
    { id: 'ordered_too_much', label: 'Ordered too many' },
    { id: 'duplicate', label: 'Duplicate order' },
    { id: 'technical_issue', label: 'Technical issue with digital content' },
    { id: 'other', label: 'Other reason' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/refund-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.detail || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted</h1>
            <p className="text-gray-600 mb-6">
              We've received your refund request for order <strong>{formData.order_number}</strong>. 
              You'll receive an email confirmation shortly, and our team will review your request within 1-2 business days.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-amber-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• We'll review your request within 1-2 business days</li>
                <li>• You'll receive an email with our decision</li>
                <li>• If approved, refunds are processed within 5-7 business days</li>
                <li>• Physical items must be returned before refund is issued</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Title */}
          <div className="bg-gradient-to-r from-purple-600 to-orange-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Request a Refund or Return</h1>
            <p className="text-purple-100 mt-1">We're sorry to hear something wasn't right</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Order Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., SF-2026-XXXXX"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Find this in your order confirmation email</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="The email used for your order"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Refund Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Refund Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refund_type"
                    value="full"
                    checked={formData.refund_type === 'full'}
                    onChange={(e) => setFormData({ ...formData, refund_type: e.target.value })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-gray-700">Full Refund</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refund_type"
                    value="partial"
                    checked={formData.refund_type === 'partial'}
                    onChange={(e) => setFormData({ ...formData, refund_type: e.target.value })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-gray-700">Partial Refund</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refund_type"
                    value="exchange"
                    checked={formData.refund_type === 'exchange'}
                    onChange={(e) => setFormData({ ...formData, refund_type: e.target.value })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-gray-700">Exchange</span>
                </label>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Request *
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select a reason...</option>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Items to Return (for partial) */}
            {formData.refund_type === 'partial' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Which items do you want to return?
                </label>
                <input
                  type="text"
                  placeholder="e.g., Holiday Series - Adult Edition"
                  value={formData.items_to_return}
                  onChange={(e) => setFormData({ ...formData, items_to_return: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Please describe the issue
              </label>
              <textarea
                rows={4}
                placeholder="Tell us more about what happened..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Policy Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Refund Policy</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Digital products:</strong> Refunds within 7 days if not downloaded</li>
                <li>• <strong>Physical products:</strong> Returns accepted within 30 days, unused condition</li>
                <li>• <strong>Damaged items:</strong> Full refund or replacement, no return needed</li>
                <li>• <strong>Processing time:</strong> 5-7 business days after approval</li>
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Alternative */}
        <div className="text-center mt-6 text-gray-600">
          <p>Need immediate help? Email us at{' '}
            <a href="mailto:support@kingdom-soul.com" className="text-purple-600 hover:underline">
              support@kingdom-soul.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundRequest;
