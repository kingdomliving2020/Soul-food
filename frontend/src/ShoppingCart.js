import React, { useRef, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart as CartIcon, Trash2 } from 'lucide-react';

const ShoppingCart = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity,
    getCartTotal,
    getCartCount
  } = useCart();
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const cartCount = getCartCount();
  const total = getCartTotal();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="relative p-2 text-white hover:text-purple-200 transition-colors"
        aria-label="Shopping cart"
      >
        <CartIcon className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isCartOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 sm:w-[480px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-4 rounded-t-lg">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <CartIcon className="w-6 h-6" />
              Shopping Cart ({cartCount})
            </h3>
          </div>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <div className="p-10 text-center">
              <CartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium text-lg">There are no items in your cart.</p>
            </div>
          ) : (
            <>
              <div className={`p-5 space-y-4 ${cartItems.length > 5 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-3">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {item.metadata?.seriesName || item.name}
                        </h4>
                        <p className="text-sm font-semibold text-purple-600 mt-1">
                          {item.name}
                        </p>
                        
                        {/* Detailed Fulfillment Information */}
                        <div className="mt-3 space-y-1 text-sm bg-blue-50 rounded p-3 border border-blue-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">📦 Package:</span>
                            <span className="text-gray-900 font-semibold">
                              {item.name} 
                              {item.name.includes('Nibble') && ' (1 Lesson)'}
                              {item.name.includes('Snack Pack') && ' (4 Lessons)'}
                              {item.name.includes('Mealtime Bundle') && ' (12 Lessons)'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">👤 Edition:</span>
                            <span className="text-gray-900 font-semibold capitalize">
                              {item.metadata?.edition || 'Adult'} Edition
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">📄 Format:</span>
                            <span className="text-gray-900 font-semibold uppercase">
                              {item.metadata?.medium === 'pdf' && '📥 PDF Download'}
                              {item.metadata?.medium === 'paperback' && '📚 Paperback (Print)'}
                              {item.metadata?.medium === 'online' && '💻 Online Access'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">🍽️ Series:</span>
                            <span className="text-gray-900 font-semibold capitalize">
                              {item.metadata?.series || 'N/A'}
                            </span>
                          </div>
                          
                          {/* Fulfillment Notice */}
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs text-blue-800 font-medium">
                              {item.metadata?.medium === 'pdf' && '✓ Digital delivery - Instant download after payment'}
                              {item.metadata?.medium === 'paperback' && '✓ Physical book - Ships within 3-5 business days'}
                              {item.metadata?.medium === 'online' && '✓ Online access - Available immediately to subscribers'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors ml-2"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      {/* Quantity */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 font-medium mr-2">Qty:</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.listPrice > item.salePrice && (
                          <div className="text-sm text-gray-400 line-through">
                            ${(item.listPrice * item.quantity).toFixed(2)}
                          </div>
                        )}
                        <div className="text-xl font-bold text-purple-600">
                          ${(item.salePrice * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${item.salePrice.toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-5 space-y-3 rounded-b-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800 text-lg">Total:</span>
                  <span className="text-3xl font-bold text-purple-600">${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg text-base"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg border border-gray-300 transition-colors text-base"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
