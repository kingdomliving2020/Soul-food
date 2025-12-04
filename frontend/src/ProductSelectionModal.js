import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

const ProductSelectionModal = ({ isOpen, onClose, seriesData, products, onAddToCart }) => {
  const [selectedBundle, setSelectedBundle] = useState('snack_pack');
  const [selectedEdition, setSelectedEdition] = useState('adult');
  const [selectedMedium, setSelectedMedium] = useState('pdf');
  const [quantity, setQuantity] = useState(1);
  const [showLargeOrderAlert, setShowLargeOrderAlert] = useState(false);

  // Early return if modal is not open or data not loaded
  if (!isOpen || !seriesData || !products || Object.keys(products).length === 0) {
    return null;
  }

  const currentProduct = products[selectedBundle];
  
  // Safety check - if product doesn't exist yet, return loading state
  if (!currentProduct) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    );
  }
  
  // Calculate price based on medium
  const getPrice = (priceObj, medium) => {
    if (!priceObj) return 0;
    if (typeof priceObj === 'number') return priceObj;
    return priceObj[medium] || priceObj.pdf || priceObj;
  };

  const listPrice = getPrice(currentProduct.list_price, selectedMedium);
  const salePrice = getPrice(currentProduct.sale_price, selectedMedium);
  const totalPrice = (salePrice * quantity).toFixed(2);
  const totalListPrice = (listPrice * quantity).toFixed(2);
  const savings = ((listPrice - salePrice) * quantity).toFixed(2);

  // Check for large print orders
  useEffect(() => {
    if (!currentProduct) return;
    
    if (selectedMedium === 'paperback' && quantity >= 25) {
      setShowLargeOrderAlert(true);
      // Send notification to backend
      fetch('http://localhost:8001/api/payments/notify-large-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          product_name: currentProduct.name,
          selections: {
            mealtime: seriesData.id,
            edition: selectedEdition,
            medium: selectedMedium
          }
        })
      }).catch(err => console.error('Failed to send large order notification:', err));
    } else {
      setShowLargeOrderAlert(false);
    }
  }, [quantity, selectedMedium, selectedEdition, seriesData?.id, currentProduct?.name]);

  const handleAddToCart = () => {
    const cartItem = {
      product_id: selectedBundle,
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
    adult: 'Adult Edition',
    youth: 'Youth Edition (Ages 12-20)',
    instructor: 'Instructor Edition (Teaching Toolkit)'
  };

  const mediumLabels = {
    pdf: 'PDF Download (Interactive)',
    paperback: 'Paperback (Print on Demand)',
    online: 'Online Access (Subscribers Only)'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{seriesData.name}</h2>
            <p className="text-blue-100 text-sm">{seriesData.theme}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bundle Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Package Size
            </label>
            <select
              value={selectedBundle}
              onChange={(e) => {
                setSelectedBundle(e.target.value);
                if (e.target.value === 'nibble') setSelectedMedium('pdf');
              }}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-base focus:border-blue-500 focus:outline-none"
            >
              <option value="nibble">Nibble - Single Lesson (PDF only)</option>
              <option value="snack_pack">Snack Pack - 4 Lessons</option>
              <option value="mealtime_bundle">Mealtime Bundle - 12 Lessons (Complete Series)</option>
              <option value="combo_bundle">Combo Bundle - 24 Lessons</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">{currentProduct.description}</p>
          </div>

          {/* Edition Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Edition
            </label>
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-base focus:border-blue-500 focus:outline-none"
            >
              {currentProduct.options.edition.map(edition => (
                <option key={edition} value={edition}>
                  {editionLabels[edition]}
                </option>
              ))}
            </select>
          </div>

          {/* Medium Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Format
            </label>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-base focus:border-blue-500 focus:outline-none"
              disabled={selectedBundle === 'nibble'}
            >
              {currentProduct.options.medium.map(medium => (
                <option key={medium} value={medium}>
                  {mediumLabels[medium]}
                </option>
              ))}
            </select>
            {selectedBundle === 'nibble' && (
              <p className="text-sm text-amber-600 mt-1">
                ℹ️ Single lessons (Nibble) are only available as PDF downloads
              </p>
            )}
          </div>

          {/* Quantity Counter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-200 hover:bg-gray-300 rounded-lg p-3 transition-colors"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className="w-20 text-center border-2 border-gray-300 rounded-lg p-3 text-lg font-semibold focus:border-blue-500 focus:outline-none"
                min="1"
                max="99"
              />
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className="bg-gray-200 hover:bg-gray-300 rounded-lg p-3 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Large Order Alert */}
          {showLargeOrderAlert && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
              <p className="text-amber-800 font-semibold">📧 Large Order Notification</p>
              <p className="text-amber-700 text-sm mt-1">
                Orders over 25 print items require manual review. We'll contact you at kingdomlivingproject@gmail.com shortly to confirm your bulk order!
              </p>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">List Price:</span>
              <span className="text-gray-500 line-through">${totalListPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sale Price:</span>
              <span className="text-green-600 font-semibold">${totalPrice}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">You Save:</span>
              <span className="text-green-600 font-bold">${savings}</span>
            </div>
          </div>

          {/* License Protection Notice */}
          {selectedMedium === 'pdf' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                🔒 <strong>License Protected:</strong> Downloads are for personal use only. 
                Redistribution is prohibited and violates copyright law.
              </p>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center space-x-2 transition-all"
          >
            <ShoppingCart size={24} />
            <span>Add to Cart - ${totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
