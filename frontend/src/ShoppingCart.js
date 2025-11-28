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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-lg">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CartIcon className="w-5 h-5" />
              Shopping Cart ({cartCount})
            </h3>
          </div>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <div className="p-8 text-center">
              <CartIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">There are no items in your cart.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.listPrice > item.salePrice && (
                          <div className="text-xs text-gray-400 line-through">
                            ${item.listPrice.toFixed(2)}
                          </div>
                        )}
                        <div className="text-base font-bold text-purple-600">
                          ${(item.salePrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-4 space-y-3 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg border border-gray-300 transition-colors"
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
