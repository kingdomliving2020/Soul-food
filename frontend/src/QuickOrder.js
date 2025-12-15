import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from './CartContext';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ShoppingCart, X, Trash2 } from 'lucide-react';

// Back Cover Preview Modal Component
const BackCoverModal = ({ isOpen, onClose, frontCover, backCover, productName }) => {
  const [showBack, setShowBack] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  if (!isOpen) return null;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-slate-800">{productName}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Cover Toggle */}
        <div className="flex justify-center gap-4 p-3 bg-slate-50">
          <button
            onClick={() => setShowBack(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${!showBack ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            Front Cover
          </button>
          <button
            onClick={() => setShowBack(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${showBack ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            Back Cover
          </button>
        </div>

        {/* Image with Magnify */}
        <div className="p-6 flex justify-center">
          <div 
            className="relative cursor-zoom-in overflow-hidden rounded-lg shadow-lg"
            style={{ maxWidth: '350px' }}
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
          >
            <img 
              src={showBack ? backCover : frontCover} 
              alt={showBack ? 'Back Cover' : 'Front Cover'}
              className="w-full h-auto transition-transform duration-200"
              style={zoom ? {
                transform: 'scale(2)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`
              } : {}}
            />
            {/* Magnify hint */}
            {!zoom && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Hover to zoom
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickOrder = () => {
  const { addToCart, cartItems, removeFromCart, updateQuantity, getCartTotal, getCartCount, isCartOpen, setIsCartOpen } = useCart();
  const [previewModal, setPreviewModal] = useState({ isOpen: false, frontCover: '', backCover: '', productName: '' });
  
  // Cover images mapping by edition and format
  const coverImages = {
    breakfast: {
      adult: {
        physical: { front: '/covers/breakfast-adult-front.jpg', back: '/covers/breakfast-adult-back.jpg' },
        ebook: { front: '/covers/breakfast-adult-front.jpg', back: '/covers/breakfast-adult-back.jpg' },
        subscription_monthly: { front: '/covers/breakfast-adult-front.jpg', back: '/covers/breakfast-adult-back.jpg' },
        subscription_annual: { front: '/covers/breakfast-adult-front.jpg', back: '/covers/breakfast-adult-back.jpg' }
      },
      youth: {
        physical: { front: '/covers/breakfast-youth-front.jpg', back: '/covers/breakfast-youth-back.jpg' },
        ebook: { front: '/covers/breakfast-youth-ebook-front.jpg', back: '/covers/breakfast-youth-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/breakfast-youth-front.jpg', back: '/covers/breakfast-youth-back.jpg' },
        subscription_annual: { front: '/covers/breakfast-youth-front.jpg', back: '/covers/breakfast-youth-back.jpg' }
      },
      instructor: {
        physical: { front: '/covers/breakfast-instructor-front.jpg', back: '/covers/breakfast-instructor-back.jpg' },
        ebook: { front: '/covers/breakfast-instructor-front.jpg', back: '/covers/breakfast-instructor-back.jpg' },
        subscription_monthly: { front: '/covers/breakfast-instructor-front.jpg', back: '/covers/breakfast-instructor-back.jpg' },
        subscription_annual: { front: '/covers/breakfast-instructor-front.jpg', back: '/covers/breakfast-instructor-back.jpg' }
      }
    },
    holiday: {
      adult: {
        physical: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-adult-ebook-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      },
      youth: {
        physical: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-youth-back.jpg' },
        ebook: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-youth-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-youth-back.jpg' },
        subscription_annual: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-youth-back.jpg' }
      },
      instructor: {
        physical: { front: '/covers/holiday-instructor-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-instructor-front.jpg', back: '/covers/holiday-instructor-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-instructor-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-instructor-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      },
      bundle: {
        physical: { front: '/covers/holiday-adult-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      }
    }
  };

  // Product catalog - Holiday first, then Breakfast, then Nibbles/Snack Packs, then Box Set, then Coming Soon
  const products = [
    {
      id: 'holiday',
      name: 'Holiday Series',
      subtitle: '4 C\'s of Christianity (6 Lessons)',
      available: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['physical', 'pdf', 'epub'],
      prices: {
        adult: { physical: 9.99, pdf: 7.99, epub: 5.99 },
        youth: { physical: 9.99, pdf: 7.99, epub: 5.99 },
        instructor: { physical: 14.99, pdf: 12.99, epub: 9.99 }
      }
    },
    {
      id: 'breakfast',
      name: 'Break*fast Series',
      subtitle: 'Foundation in Christ (48 Lessons)',
      available: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription_monthly', 'subscription_annual', 'ebook', 'physical'],
      prices: {
        adult: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        youth: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        instructor: { subscription_monthly: 11.99, subscription_annual: 119.99, ebook: 49.99, physical: 79.99 }
      }
    },
    {
      id: 'holiday-nibble',
      name: 'Holiday Nibble',
      subtitle: 'Single Interactive Lesson',
      description: 'One complete interactive lesson from the Holiday Series',
      available: true,
      isNibble: true,
      editions: ['adult', 'youth'],
      formats: ['interactive'],
      prices: {
        adult: { interactive: 1.99 },
        youth: { interactive: 1.99 }
      }
    },
    {
      id: 'holiday-snack-pack',
      name: 'Holiday Snack Pack',
      subtitle: '6-Lesson Bundle (Save 30%!)',
      description: 'All 6 Holiday lessons at a discounted price',
      available: true,
      isSnackPack: true,
      badge: 'Best Value',
      editions: ['adult', 'youth'],
      formats: ['interactive'],
      prices: {
        adult: { interactive: 8.99 },
        youth: { interactive: 8.99 }
      }
    },
    {
      id: 'breakfast-nibble',
      name: 'Breakfast Nibble',
      subtitle: 'Single Interactive Lesson',
      description: 'One complete interactive lesson from the Breakfast Series',
      available: true,
      isNibble: true,
      editions: ['adult', 'youth'],
      formats: ['interactive'],
      prices: {
        adult: { interactive: 1.99 },
        youth: { interactive: 1.99 }
      }
    },
    {
      id: 'breakfast-snack-pack',
      name: 'Breakfast Snack Pack',
      subtitle: '12-Lesson Bundle (Save 35%!)',
      description: '12 Breakfast lessons - one full quarter of content',
      available: true,
      isSnackPack: true,
      badge: 'Best Value',
      editions: ['adult', 'youth'],
      formats: ['interactive'],
      prices: {
        adult: { interactive: 15.99 },
        youth: { interactive: 15.99 }
      }
    },
    {
      id: 'holiday-box-set',
      name: 'Holiday Box Set',
      subtitle: 'Holiday + Break*fast Series Bundle',
      available: true,
      badge: 'FREE Bookmark + eBook',
      editions: ['bundle'],
      formats: ['physical', 'pdf', 'epub'],
      prices: {
        bundle: { physical: 39.99, pdf: 34.99, epub: 29.99 }
      },
      useHolidayCovers: true
    },
    {
      id: 'lunch',
      name: 'Lunch Series',
      subtitle: 'Kingdom Relationships',
      available: false,
      comingSoon: 'Q1 2026',
      isPlaceholder: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription_monthly', 'subscription_annual', 'ebook', 'physical'],
      prices: {
        adult: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        youth: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        instructor: { subscription_monthly: 11.99, subscription_annual: 119.99, ebook: 49.99, physical: 79.99 }
      }
    },
    {
      id: 'dinner',
      name: 'Dinner Series',
      subtitle: 'Finding Your Purpose',
      available: false,
      comingSoon: 'Q1 2026',
      isPlaceholder: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription_monthly', 'subscription_annual', 'ebook', 'physical'],
      prices: {
        adult: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        youth: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        instructor: { subscription_monthly: 11.99, subscription_annual: 119.99, ebook: 49.99, physical: 79.99 }
      }
    },
    {
      id: 'supper',
      name: 'Supper Series',
      subtitle: 'Maturity in Faith',
      available: false,
      comingSoon: 'Q2 2026',
      isPlaceholder: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription_monthly', 'subscription_annual', 'ebook', 'physical'],
      prices: {
        adult: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        youth: { subscription_monthly: 7.99, subscription_annual: 79.99, ebook: 24.99, physical: 39.99 },
        instructor: { subscription_monthly: 11.99, subscription_annual: 119.99, ebook: 49.99, physical: 79.99 }
      }
    }
  ];

  const merchandise = [
    {
      id: 'gift-certificate',
      name: 'Digital Gift Certificate',
      subtitle: 'For books or game passes - Valid 1 year',
      image: '/soul-food-logo.png',
      price: 25.00,
      isGiftCertificate: true,
      link: '/gift-certificates'
    },
    {
      id: 'leather-bookmark',
      name: 'Bygone Leather Bookmark',
      subtitle: 'Personalized with your initial (includes pen holder)',
      image: '/covers/leather-bookmark-1.png',
      price: 1.50,
      bundlePrice: { qty: 3, price: 3.00 }
    },
    {
      id: 'magnetic-bookmark',
      name: 'Magnetic Artistic Bookmark',
      subtitle: 'Decorative rubber magnet design',
      image: '/covers/magnetic-bookmark-1.png',
      price: 1.50,
      bundlePrice: { qty: 3, price: 3.00 }
    },
    {
      id: 'soul-food-pen',
      name: 'Soul Food "Truth Served Daily" Pen',
      subtitle: 'Medium tip with stylus (Black or Blue ink)',
      image: '/covers/soul-food-pen.png',
      price: 4.00,
      bundlePrice: { qty: 6, price: 20.00 },
      bulkBonus: 'FREE with book orders: 2 pens (10+ books), 5 pens (25+ books), 10 pens (50+ books)'
    }
  ];

  // State for each product's selections
  const [selections, setSelections] = useState({});

  const updateSelection = (productId, field, value) => {
    setSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        // Reset format if edition changes
        ...(field === 'edition' ? { format: null } : {})
      }
    }));
  };

  // Get the correct cover image based on product, edition, and format
  const getCoverImage = (product, type = 'front') => {
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || product.formats[0];
    
    // Handle box set
    if (product.useHolidayCovers) {
      return coverImages.holiday?.bundle?.physical?.[type] || '/covers/holiday-adult-front.jpg';
    }
    
    // Handle placeholder products
    if (product.isPlaceholder) {
      return '/soul-food-logo.png';
    }
    
    // Handle nibbles and snack packs - use the parent series image
    if (product.isNibble || product.isSnackPack) {
      const seriesId = product.id.includes('holiday') ? 'holiday' : 'breakfast';
      const editionKey = edition === 'bundle' ? 'adult' : edition;
      return coverImages[seriesId]?.adult?.physical?.[type] || 
             (seriesId === 'holiday' ? '/covers/holiday-adult-front.jpg' : '/covers/breakfast-adult-front.jpg');
    }
    
    // Get cover from mapping
    const productCovers = coverImages[product.id];
    if (productCovers && productCovers[edition] && productCovers[edition][format]) {
      return productCovers[edition][format][type];
    }
    
    // Fallback based on product ID
    if (product.id.includes('holiday')) {
      return type === 'front' ? '/covers/holiday-adult-front.jpg' : '/covers/holiday-adult-back.jpg';
    }
    return type === 'front' ? '/covers/breakfast-adult-front.jpg' : '/covers/breakfast-adult-back.jpg';
  };

  const getPrice = (product) => {
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || product.formats[0];
    return product.prices[edition]?.[format] || 0;
  };

  const handleAddToCart = (product) => {
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || product.formats[0];
    const quantity = selection.quantity || 1;
    const price = getPrice(product);

    addToCart({
      id: `${product.id}-${edition}-${format}`,
      name: `${product.name} - ${edition.toUpperCase()} - ${format.toUpperCase()}`,
      price: price,
      quantity: quantity,
      image: getCoverImage(product, 'front')
    });

    toast.success(`Added ${quantity}x ${product.name} to cart!`);
  };

  const handleMerchandiseAdd = (item) => {
    const selection = selections[item.id] || {};
    const quantity = selection.quantity || 1;
    const inkColor = selection.inkColor || 'black';

    addToCart({
      id: `${item.id}-${inkColor}`,
      name: item.id === 'soul-food-pen' ? `${item.name} (${inkColor} ink)` : item.name,
      price: item.price,
      quantity: quantity,
      image: item.image
    });

    toast.success(`Added ${quantity}x ${item.name} to cart!`);
  };

  const openPreview = (product) => {
    setPreviewModal({
      isOpen: true,
      frontCover: getCoverImage(product, 'front'),
      backCover: getCoverImage(product, 'back'),
      productName: product.name
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Back Cover Preview Modal */}
      <BackCoverModal 
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        frontCover={previewModal.frontCover}
        backCover={previewModal.backCover}
        productName={previewModal.productName}
      />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            <div className="flex items-center gap-2">
              <img src="/quick-order-rounded-60.png" alt="" className="h-10 w-auto rounded-lg" />
              <span className="text-lg font-bold text-slate-800">Truth, Served Daily</span>
            </div>
            
            {/* Cart Button */}
            <div className="relative">
              <Button
                onClick={() => setIsCartOpen(!isCartOpen)}
                variant="ghost"
                className="relative p-2 text-slate-700 hover:text-slate-900"
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Button>
              
              {/* Cart Dropdown */}
              {isCartOpen && (
                <>
                  <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsCartOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
                    {/* Cart Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Cart ({getCartCount()})
                      </h3>
                      <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {cartItems.length === 0 ? (
                      <div className="p-8 text-center">
                        <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 space-y-3 overflow-y-auto flex-1">
                          {cartItems.map((item) => (
                            <div key={item.uniqueKey || item.id} className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.uniqueKey || item.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.uniqueKey || item.id, item.quantity - 1)}
                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.uniqueKey || item.id, item.quantity + 1)}
                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="font-bold text-purple-600">
                                  ${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Cart Footer */}
                        <div className="border-t bg-gray-50 p-4 rounded-b-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">Total:</span>
                            <span className="text-2xl font-bold text-purple-600">${getCartTotal().toFixed(2)}</span>
                          </div>
                          <Button
                            onClick={() => window.location.href = '/checkout'}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3"
                          >
                            Proceed to Checkout
                          </Button>
                          <Button
                            onClick={() => setIsCartOpen(false)}
                            variant="outline"
                            className="w-full"
                          >
                            Continue Shopping
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section - Updated tagline instead of repeating Quick Order */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            🍽️ What's on Your Plate Today?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Select your spiritual nourishment below and add to your cart in seconds!
          </p>
        </div>

        {/* Soul Food Series */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">📚 Soul Food Series</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  {/* Amazon-style horizontal layout */}
                  <div className="flex gap-4">
                    {/* Left: Thumbnail Image */}
                    <div className="relative flex-shrink-0">
                      {!product.available && (
                        <Badge className="absolute top-2 left-2 bg-amber-500 z-10 text-xs">
                          Pre-Order {product.comingSoon}
                        </Badge>
                      )}
                      {product.badge && (
                        <Badge className="absolute top-2 left-2 bg-emerald-500 z-10 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                      
                      {/* Image with Coming Soon overlay for placeholders */}
                      {product.isPlaceholder ? (
                        <div className="w-24 h-36 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                          {/* Faded Soul Food logo background */}
                          <img 
                            src="/soul-food-logo.png" 
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                            style={{ filter: 'grayscale(50%) brightness(150%)' }}
                          />
                          {/* COMING SOON watermark */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="text-slate-400 font-bold text-xs transform -rotate-12 whitespace-nowrap" style={{ textShadow: '0 0 10px white' }}>
                              COMING SOON
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img 
                            src={getCoverImage(product, 'front')} 
                            alt={product.name}
                            className="w-24 h-36 object-cover rounded-lg border border-slate-200"
                          />
                          {/* Magnifying glass button */}
                          <button
                            onClick={() => openPreview(product)}
                            className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View covers"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Product Info & Controls */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="mb-2">
                        <h3 className="text-base font-bold text-slate-800 truncate">{product.name}</h3>
                        <p className="text-xs text-slate-600">{product.subtitle}</p>
                      </div>
                      
                      {/* Edition Selector */}
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-slate-700">Edition:</label>
                        <select
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          value={selections[product.id]?.edition || product.editions[0]}
                          onChange={(e) => updateSelection(product.id, 'edition', e.target.value)}
                        >
                          {product.editions.map(ed => (
                            <option key={ed} value={ed}>
                              {ed === 'adult' ? 'Adult (AE)' :
                               ed === 'youth' ? 'Youth (YE)' :
                               ed === 'instructor' ? 'Instructor (IE)' :
                               ed === 'bundle' ? 'Bundle Set' : ed}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Format Selector */}
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-slate-700">Format:</label>
                        <select
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          value={selections[product.id]?.format || product.formats[0]}
                          onChange={(e) => updateSelection(product.id, 'format', e.target.value)}
                        >
                          {product.formats.map(fmt => (
                            <option key={fmt} value={fmt}>
                              {fmt === 'subscription_monthly' ? 'Monthly Sub' :
                               fmt === 'subscription_annual' ? 'Annual Sub' :
                               fmt === 'ebook' ? 'eBook' :
                               fmt === 'physical' ? 'Paperback' :
                               fmt === 'pdf' ? 'Interactive PDF' :
                               fmt === 'epub' ? 'ePub' : fmt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Selector */}
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-slate-700">Qty:</label>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSelection(product.id, 'quantity', Math.max(1, (selections[product.id]?.quantity || 1) - 1))}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm">
                            {selections[product.id]?.quantity || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSelection(product.id, 'quantity', (selections[product.id]?.quantity || 1) + 1)}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <div className="text-lg font-bold text-purple-600">
                          ${getPrice(product).toFixed(2)}
                          {(selections[product.id]?.format || product.formats[0]) === 'subscription_monthly' && (
                            <span className="text-xs text-slate-500">/mo</span>
                          )}
                          {(selections[product.id]?.format || product.formats[0]) === 'subscription_annual' && (
                            <span className="text-xs text-slate-500">/yr</span>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-xs px-3"
                          disabled={!product.available}
                        >
                          {product.available ? 'Add' : 'Soon'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Merchandise Section */}
        <section>
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🎁 Merchandise</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {merchandise.map(item => (
              <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                <CardContent className="p-4 flex flex-col flex-1">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-32 object-contain rounded-lg mb-3 bg-white"
                  />
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{item.name}</h4>
                  <p className="text-xs text-slate-600 mb-3">{item.subtitle}</p>
                  
                  {/* Spacer to push content to consistent positions */}
                  <div className="flex-1 flex flex-col justify-end">
                    {/* Pen Color Selector */}
                    {item.id === 'soul-food-pen' && (
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1">Ink Color:</label>
                        <select
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          value={selections[item.id]?.inkColor || 'black'}
                          onChange={(e) => updateSelection(item.id, 'inkColor', e.target.value)}
                        >
                          <option value="black">Black Ink</option>
                          <option value="blue">Blue Ink</option>
                        </select>
                      </div>
                    )}

                    {/* Leather Bookmark Initial */}
                    {item.id === 'leather-bookmark' && (
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1">Your Initial:</label>
                        <input
                          type="text"
                          maxLength="1"
                          placeholder="A"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs uppercase"
                          value={selections[item.id]?.initial || ''}
                          onChange={(e) => updateSelection(item.id, 'initial', e.target.value.toUpperCase())}
                        />
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1">Quantity:</label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSelection(item.id, 'quantity', Math.max(1, (selections[item.id]?.quantity || 1) - 1))}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-semibold text-sm">
                          {selections[item.id]?.quantity || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSelection(item.id, 'quantity', (selections[item.id]?.quantity || 1) + 1)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="mb-3 text-xs text-slate-600">
                      <div className="font-semibold">${item.price.toFixed(2)} each</div>
                      {item.bundlePrice && (
                        <div className="text-emerald-600 font-semibold">
                          {item.bundlePrice.qty} for ${item.bundlePrice.price.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Add to Cart or Go to Gift Certificates */}
                    {item.isGiftCertificate ? (
                      <Button
                        onClick={() => window.location.href = item.link}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs"
                      >
                        Create Gift Certificate →
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleMerchandiseAdd(item)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-xs"
                      >
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Bulk Order Info - ALL THREE TIERS */}
        <section className="mt-12">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-900">🎉 Bulk Order Bonuses!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded-xl shadow">
                  <div className="text-3xl mb-2">📦</div>
                  <div className="font-bold text-base mb-1">10+ Books</div>
                  <div className="text-emerald-600 font-semibold text-sm">2 FREE Pens</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-bold text-base mb-1">25+ Books</div>
                  <div className="text-emerald-600 font-semibold text-sm">5 FREE Pens</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow">
                  <div className="text-3xl mb-2">🏢</div>
                  <div className="font-bold text-base mb-1">50+ Books</div>
                  <div className="text-emerald-600 font-semibold text-sm">10 FREE Pens</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow">
                  <div className="text-3xl mb-2">🎁</div>
                  <div className="font-bold text-base mb-1">Holiday Box Set</div>
                  <div className="text-emerald-600 font-semibold text-sm">1 FREE Bookmark</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default QuickOrder;
