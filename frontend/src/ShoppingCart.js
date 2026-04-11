import React, { useRef } from 'react';
import { useCart } from './CartContext';
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
  
  const dropdownRef = useRef(null);
  const cartCount = getCartCount();
  const total = getCartTotal();

  const handleCheckout = () => {
    setIsCartOpen(false);
    window.location.href = '/checkout';
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
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsCartOpen(false)} />
          
          {/* Cart dropdown - Mobile full width, Desktop positioned */}
          <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-full sm:w-80 md:w-96 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[85vh] sm:max-h-[80vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-3 rounded-t-2xl sm:rounded-t-xl flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <CartIcon className="w-5 h-5" />
                Cart ({cartCount})
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
              <div className="p-6 sm:p-8 text-center flex-shrink-0">
                <CartIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium text-sm sm:text-base">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.uniqueKey || item.productId);
                          }}
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

                {/* Footer - Always visible, never cut off */}
                <div className="border-t bg-gray-50 p-4 space-y-3 rounded-b-xl flex-shrink-0 safe-area-bottom">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-base">Total:</span>
                    <span className="text-xl font-bold text-purple-600">${total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg text-base"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 transition-colors text-sm"
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
