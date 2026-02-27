import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Edition-specific cover images
const COVER_IMAGES = {
  holiday: {
    ae: '/covers/holiday-adult-front.jpg',
    ye: '/covers/holiday-ye-front.jpg',
    ie: '/covers/holiday-ie-front.jpg'
  },
  breakfast: {
    ae: '/covers/breakfast-adult-front.jpg',
    ye: '/covers/breakfast-youth-front.jpg',
    ie: '/covers/breakfast-instructor-front.jpg'
  },
  lunch: {
    ae: '/covers/breakfast-adult-front.jpg', // placeholder
    ye: '/covers/breakfast-youth-front.jpg',
    ie: '/covers/breakfast-instructor-front.jpg'
  }
};

const ProductSelectionModal = ({ isOpen, onClose, seriesData, products, onAddToCart }) => {
  const [selectedEdition, setSelectedEdition] = useState('ae'); // ae, ye, ie
  const [selectedMedium, setSelectedMedium] = useState('digital');
  const [quantity, setQuantity] = useState(1);
  const [showLargeOrderAlert, setShowLargeOrderAlert] = useState(false);

  // Get the cover image for current selection
  const getCoverImage = () => {
    if (!seriesData?.id) return null;
    return COVER_IMAGES[seriesData.id]?.[selectedEdition] || COVER_IMAGES[seriesData.id]?.ae;
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedEdition('ae');
      setSelectedMedium('digital');
      setQuantity(1);
    }
  }, [isOpen, seriesData?.id]);

  // Get the correct product key based on series, edition, and medium
  const getProductKey = () => {
    if (!seriesData) return null;
    
    const seriesId = seriesData.id;
    
    if (seriesId === 'holiday') {
      // Holiday series: holiday_ae, holiday_ye, holiday_ie
      return `holiday_${selectedEdition}`;
    } else if (seriesId === 'breakfast') {
      // Breakfast series: breakfast_ae_digital, breakfast_ae_paperback, etc.
      return `breakfast_${selectedEdition}_${selectedMedium}`;
    } else if (seriesId === 'lunch') {
      // Lunch series: lunch_ae_paperback, etc.
      return `lunch_${selectedEdition}_paperback`;
    }
    
    return null;
  };

  const productKey = getProductKey();
  const currentProduct = productKey ? products?.[productKey] : null;
  const coverImage = getCoverImage();
  
  // Get price - handle both number and object formats
  const getPrice = (priceValue) => {
    if (!priceValue) return 0;
    if (typeof priceValue === 'number') return priceValue;
    if (typeof priceValue === 'object') {
      return priceValue[selectedMedium] || priceValue.digital || priceValue.pdf || Object.values(priceValue)[0] || 0;
    }
    return parseFloat(priceValue) || 0;
  };

  const listPrice = currentProduct ? getPrice(currentProduct.list_price) : 0;
  const salePrice = currentProduct ? getPrice(currentProduct.sale_price) : 0;
  const totalPrice = (salePrice * quantity).toFixed(2);
  const totalListPrice = (listPrice * quantity).toFixed(2);
  const savings = ((listPrice - salePrice) * quantity).toFixed(2);

  // Check for large print orders
  useEffect(() => {
    if (!currentProduct || !isOpen) return;
    
    if (selectedMedium === 'paperback' && quantity >= 25) {
      setShowLargeOrderAlert(true);
      fetch(`${BACKEND_URL}/api/payments/notify-large-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          product_name: currentProduct.name,
          selections: {
            series: seriesData?.id,
            edition: selectedEdition,
            medium: selectedMedium
          }
        })
      }).catch(err => console.error('Failed to send large order notification:', err));
    } else {
      setShowLargeOrderAlert(false);
    }
  }, [quantity, selectedMedium, selectedEdition, seriesData?.id, currentProduct, isOpen]);

  const handleAddToCart = () => {
    if (!currentProduct || !productKey) return;
    
    const cartItem = {
      product_id: productKey,
      product_name: currentProduct.name,
      series: seriesData.id,
      series_name: seriesData.name,
      edition: selectedEdition,
      medium: selectedMedium,
      quantity,
      unit_price: salePrice,
      total_price: parseFloat(totalPrice)
    };

    onAddToCart(cartItem);
    onClose();
  };

  const editionLabels = {
    ae: 'Adult Edition (AE)',
    ye: 'Youth Edition (YE) - Ages 12-20',
    ie: 'Instructor Edition (IE) - Teaching Toolkit'
  };

  const mediumLabels = {
    digital: 'PDF Download (Interactive)',
    paperback: 'Paperback (Print on Demand)'
  };

  // Determine available mediums based on series
  const getAvailableMediums = () => {
    if (seriesData?.id === 'holiday') {
      return ['digital']; // Holiday is digital only
    }
    return ['digital', 'paperback'];
  };

  // Early returns AFTER all hooks
  if (!isOpen) return null;

  // Show loading if products not loaded yet
  if (!products || Object.keys(products).length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    );
  }

  // If no matching product found, show helpful message
  if (!currentProduct) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Product Not Available</h3>
          <p className="text-gray-600 mb-4">
            The selected combination ({seriesData?.name} - {editionLabels[selectedEdition]} - {mediumLabels[selectedMedium]}) is not currently available.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Try selecting a different edition or format.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex justify-between items-center">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-2xl font-bold leading-tight">{seriesData.name}</h2>
            <p className="text-purple-200 text-xs sm:text-sm mt-1">{seriesData.theme}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 sm:p-2 flex-shrink-0">
            <X size={20} className="sm:hidden" />
            <X size={24} className="hidden sm:block" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Edition Selection */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              Select Edition
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(editionLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEdition(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedEdition === key 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Medium Selection - Only show if multiple options */}
          {getAvailableMediums().length > 1 && (
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Select Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableMediums().map(medium => (
                  <button
                    key={medium}
                    onClick={() => setSelectedMedium(medium)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedMedium === medium 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="font-medium text-sm">{mediumLabels[medium]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Digital only notice for Holiday */}
          {seriesData?.id === 'holiday' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                📥 <strong>Digital Download Only</strong> - The Holiday Series is available as an interactive PDF download.
              </p>
            </div>
          )}

          {/* Quantity Counter */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-200 hover:bg-gray-300 rounded-lg p-2 sm:p-3 transition-colors"
              >
                <Minus size={16} className="sm:hidden" />
                <Minus size={20} className="hidden sm:block" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className="w-16 sm:w-20 text-center border-2 border-gray-300 rounded-lg p-2 sm:p-3 text-base sm:text-lg font-semibold focus:border-purple-500 focus:outline-none"
                min="1"
                max="99"
              />
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className="bg-gray-200 hover:bg-gray-300 rounded-lg p-2 sm:p-3 transition-colors"
              >
                <Plus size={16} className="sm:hidden" />
                <Plus size={20} className="hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Large Order Alert */}
          {showLargeOrderAlert && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
              <p className="text-amber-800 font-semibold">📧 Large Order Notification</p>
              <p className="text-amber-700 text-sm mt-1">
                Orders over 25 print items require manual review. We'll contact you shortly to confirm your bulk order!
              </p>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-gray-600">Unit Price:</span>
              <div className="text-right">
                {listPrice > salePrice && (
                  <span className="text-gray-400 line-through mr-2">${listPrice.toFixed(2)}</span>
                )}
                <span className="text-green-600 font-semibold">${salePrice.toFixed(2)}</span>
              </div>
            </div>
            {quantity > 1 && (
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">Subtotal ({quantity} items):</span>
                <span className="font-semibold">${totalPrice}</span>
              </div>
            )}
            {parseFloat(savings) > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm sm:text-base">
                <span className="text-gray-700 font-semibold">You Save:</span>
                <span className="text-green-600 font-bold">${savings}</span>
              </div>
            )}
          </div>

          {/* Product Description */}
          {currentProduct.description && (
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-purple-800 text-sm">{currentProduct.description}</p>
            </div>
          )}

          {/* License Protection Notice */}
          {selectedMedium === 'digital' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
              <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                🔒 <strong>License Protected:</strong> Downloads are for personal use only. 
                Redistribution is prohibited and violates copyright law.
              </p>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 rounded-xl text-base sm:text-lg shadow-lg flex items-center justify-center space-x-2 transition-all"
          >
            <ShoppingCart size={20} className="sm:hidden" />
            <ShoppingCart size={24} className="hidden sm:block" />
            <span>Add to Cart - ${totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
