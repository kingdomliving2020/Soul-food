import React, { useRef, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart as CartIcon, Trash2, X } from 'lucide-react';

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
        <CartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu - Mobile optimized */}
      {isCartOpen && (
        <>
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setIsCartOpen(false)} />
          
          {/* Cart dropdown */}
          <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[80vh] sm:max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <CartIcon className="w-5 h-5" />
                Cart ({cartCount})
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <CartIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium text-sm sm:text-base">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.uniqueKey || item.productId}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      {/* Item Header */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {item.metadata?.seriesName || item.name}
                          </h4>
                          <p className="text-xs text-purple-600 font-medium truncate">
                            {item.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.uniqueKey || item.productId)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Item Details - Compact */}
                      <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                        <div className="flex justify-between">
                          <span>📄 {item.metadata?.medium === 'pdf' ? 'PDF' : item.metadata?.medium === 'paperback' ? 'Print' : 'Online'}</span>
                          <span className="capitalize">{item.metadata?.edition || 'Adult'} Ed.</span>
                        </div>
                      </div>

                      {/* Quantity and Price Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.uniqueKey || item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.uniqueKey || item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-purple-600">
                            ${(item.salePrice * item.quantity).toFixed(2)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              ${item.salePrice.toFixed(2)} ea
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 p-3 sm:p-4 space-y-2 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-sm sm:text-base">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">${total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg text-sm sm:text-base"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg border border-gray-300 transition-colors text-sm"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;
