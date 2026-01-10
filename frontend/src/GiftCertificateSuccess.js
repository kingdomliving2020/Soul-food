import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Gift, Loader2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GiftCertificateSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);

  const sessionId = searchParams.get('session_id');
  const pendingId = searchParams.get('pending_id');

  useEffect(() => {
    const activateCertificate = async () => {
      if (!pendingId) {
        setError('Missing certificate information');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/gift-certificates/activate/${pendingId}?session_id=${sessionId || ''}`,
          { method: 'POST' }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setCertificateData(data);
        } else {
          throw new Error(data.detail || 'Failed to activate gift certificate');
        }
      } catch (err) {
        console.error('Activation error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    activateCertificate();
  }, [pendingId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Activating your gift certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            If you were charged, please contact us at support@kingdom-soul.com with your payment details.
          </p>
          <button
            onClick={() => navigate('/gift-certificates')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gift Sent! 🎁</h1>
          <p className="text-gray-600">
            Your gift certificate has been delivered!
          </p>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <Gift className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gift Certificate Details</h2>
            
            {certificateData && (
              <div className="space-y-3 mt-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-700 mb-1">Certificate Code</p>
                  <p className="text-2xl font-mono font-bold text-orange-800">
                    {certificateData.code}
                  </p>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-green-600">${certificateData.amount?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Sent to</span>
                  <span className="font-semibold">{certificateData.recipient_email}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Valid until</span>
                  <span className="font-semibold">
                    {certificateData.expires_at 
                      ? new Date(certificateData.expires_at).toLocaleDateString()
                      : '1 year from now'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>The recipient will receive an email with their gift certificate code</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>They can redeem it at checkout on any Soul Food purchase</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>You'll receive a confirmation email as well</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/quick-order')}
            className="flex-1 bg-white border-2 border-orange-500 text-orange-600 font-bold py-3 px-6 rounded-lg hover:bg-orange-50 transition-colors"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            data-testid="proceed-to-checkout-btn"
          >
            Proceed to Checkout
          </button>
        </div>
        
        {/* Secondary Actions */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => navigate('/gift-certificates')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium underline"
            data-testid="send-another-gift-btn"
          >
            Send Another Gift
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-700 text-sm font-medium underline"
            data-testid="return-home-btn"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftCertificateSuccess;
