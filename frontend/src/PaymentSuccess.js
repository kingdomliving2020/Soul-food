import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle } from 'lucide-react';
import { useCart } from './CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  const sessionId = searchParams.get('session_id');
  const maxAttempts = 5;

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      setError('No payment session found');
      return;
    }

    checkPaymentStatus();
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      setError('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/status/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      setPaymentData(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        // Clear the cart after successful payment
        clearCart();
      } else if (data.status === 'expired') {
        setStatus('failed');
        setError('Payment session expired');
      } else {
        // Still pending, check again after 2 seconds
        setAttempts(prev => prev + 1);
        setTimeout(checkPaymentStatus, 2000);
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setStatus('failed');
      setError(err.message || 'Failed to verify payment');
    }
  };

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
                    <span className="font-mono text-gray-900">{sessionId.slice(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-gray-900">
                      ${(paymentData.amount_total / 100).toFixed(2)} {paymentData.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-semibold">Paid</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              You now have access to your purchased content. Check your email for the receipt.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition-all"
              >
                View My Content
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
