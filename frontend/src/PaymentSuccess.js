import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, Download, ExternalLink, Package } from 'lucide-react';
import { useCart } from './CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  const sessionId = searchParams.get('session_id');
  const maxAttempts = 15;
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  const checkPaymentStatus = useCallback(async () => {
    if (attemptsRef.current >= maxAttempts) {
      setStatus('timeout');
      setError('Payment verification is taking longer than expected. Your payment was likely successful — please check your email for confirmation or visit My Library.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/status/${sessionId}`);
      
      if (!response.ok) {
        // Don't fail on 404/500 — the webhook may still be processing
        console.log(`[PaymentSuccess] Status check attempt ${attemptsRef.current + 1}: HTTP ${response.status}, retrying...`);
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        timerRef.current = setTimeout(checkPaymentStatus, 2500);
        return;
      }

      const data = await response.json();
      setPaymentData(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        clearCart();
        
        // Fetch download links with a small delay to let webhook finish
        const orderId = data.transaction?.order_number || sessionId;
        const fetchDownloads = async (retries = 3) => {
          try {
            const dlResponse = await fetch(`${BACKEND_URL}/api/payments/download-links/${orderId}`);
            if (dlResponse.ok) {
              const dlData = await dlResponse.json();
              if (dlData.links && dlData.links.length > 0) {
                setDownloadLinks(dlData.links);
              } else if (retries > 0) {
                setTimeout(() => fetchDownloads(retries - 1), 3000);
              }
            }
          } catch (dlErr) {
            console.error('Error fetching download links:', dlErr);
            if (retries > 0) setTimeout(() => fetchDownloads(retries - 1), 3000);
          }
        };
        setTimeout(() => fetchDownloads(), 1000);
      } else if (data.status === 'expired') {
        setStatus('failed');
        setError('Payment session expired');
      } else {
        // Still pending — retry
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        timerRef.current = setTimeout(checkPaymentStatus, 2000);
      }
    } catch (err) {
      // Network error — retry instead of immediately failing
      console.log(`[PaymentSuccess] Network error on attempt ${attemptsRef.current + 1}:`, err.message);
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      if (attemptsRef.current < maxAttempts) {
        timerRef.current = setTimeout(checkPaymentStatus, 3000);
      } else {
        setStatus('timeout');
        setError('Could not verify payment. Your purchase may still be processing — check your email or visit My Library.');
      }
    }
  }, [sessionId, clearCart]);

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      setError('No payment session found');
      return;
    }
    attemptsRef.current = 0;
    checkPaymentStatus();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [sessionId, checkPaymentStatus]);

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center">
            <Loader className="w-20 h-20 mx-auto text-blue-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your purchase.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Attempt {attempts + 1} of {maxAttempts}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your purchase!
            </p>
            
            {paymentData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Order Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-gray-900">{paymentData.transaction?.order_number || sessionId.slice(0, 20)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-gray-900">
                      ${(paymentData.amount_total / 100).toFixed(2)} {paymentData.currency?.toUpperCase() || 'USD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-semibold">Paid</span>
                  </div>
                </div>
              </div>
            )}

            {/* Download Links Section */}
            {downloadLinks.length > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Your Downloads</h3>
                </div>
                <div className="space-y-3">
                  {downloadLinks.map((link, index) => (
                    <a
                      key={index}
                      href={`${BACKEND_URL}/api/downloads/file/${link.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{link.product_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600">
                        <span className="text-sm">Download</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-3">
                  Downloads expire in 7 days. You can download each file up to 3 times.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⏳</div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Downloads Processing</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Your download links are being generated. This usually takes a few seconds.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        🔄 Refresh Page
                      </button>
                      <button
                        onClick={() => navigate('/my-library')}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        📚 Go to My Library
                      </button>
                    </div>
                    <p className="text-yellow-600 text-xs mt-3">
                      Download links will also be sent to your email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              A confirmation email has been sent to your email address.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/quick-order')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition-all"
              >
                Refresh Downloads
              </button>
            </div>
          </div>
        );

      case 'failed':
      case 'timeout':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {status === 'timeout' ? 'Verification Timeout' : 'Payment Issue'}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {error || 'We encountered an issue verifying your payment.'}
            </p>

            {status === 'timeout' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Your payment may still be processing. Please check your email for confirmation,
                  or contact support if you have any concerns.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentSuccess;
