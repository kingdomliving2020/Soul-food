import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-amber-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="cancel-heading">
          No Worries!
        </h2>
        
        <p className="text-lg text-gray-600 mb-2">
          Your payment was not processed. No charges were made.
        </p>

        <p className="text-gray-500 mb-8">
          Your cart items are still saved. Pick up right where you left off.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/checkout')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2"
            data-testid="return-to-checkout-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Checkout
          </button>
          <button
            onClick={() => navigate('/quick-order')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2"
            data-testid="continue-shopping-btn"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-8 rounded-lg transition-all"
            data-testid="back-to-home-btn"
          >
            Back to Home
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact us at orders@kingdom-soul.com
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
