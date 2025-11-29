import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
          <XCircle className="w-12 h-12 text-yellow-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h2>
        
        <p className="text-lg text-gray-600 mb-6">
          You cancelled the payment process. No charges were made.
        </p>

        <p className="text-gray-500 mb-8">
          Your cart items are still saved. You can complete your purchase anytime.
        </p>

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
            Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
