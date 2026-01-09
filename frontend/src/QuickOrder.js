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
        physical: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' }
      },
      youth: {
        physical: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-youth-back.jpg' },
        ebook: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-youth-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-youth-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-youth-back.jpg' }
      },
      instructor: {
        physical: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-instructor-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' }
      },
      bundle: {
        physical: { front: '/covers/holiday-ae-front-new.png', back: '/covers/holiday-adult-back.jpg' }
      }
    }
  };

  // Product catalog - Holiday first, then Breakfast, then Nibbles/Snack Packs, then Box Set, then Coming Soon
  // Sale ends January 15, 2026 - show list price crossed out with sale price
  const SALE_END_DATE = new Date('2026-01-15');
  const isSaleActive = new Date() < SALE_END_DATE;
  
  // Breakfast Series monthly topics for Snack Pack selection
  const breakfastMonths = [
    { id: 'month-1', name: 'Month 1: Prayer, the First Resort', lessons: 4, available: true },
    { id: 'month-2', name: 'Month 2: The Art of Through', lessons: 4, available: true },
    { id: 'month-3', name: 'Month 3: Faith & Foresight', lessons: 4, available: true }
  ];

  // Breakfast individual lessons for Nibble selection (organized by month)
  // NOTE: "In His Image" series is FREE - available in Free Lessons section above
  const breakfastLessons = [
    // Month 1: Prayer, the First Resort (Coming Soon - In His Image is FREE above)
    { id: 'prayer-esther', name: 'Esther - Second is Best', available: false, month: 1, comingSoon: true },
    { id: 'prayer-solomon', name: 'Solomon - Wisdom in Response', available: false, month: 1, comingSoon: true },
    { id: 'prayer-jesus', name: 'Jesus - Prayer as First Resort', available: false, month: 1, comingSoon: true },
    { id: 'prayer-paul', name: 'Paul & Silas - Faith in the Dark', available: false, month: 1, comingSoon: true },
    // Month 2 & 3 - Coming soon
    { id: 'through-1', name: 'The Art of Through - Lesson 1', available: false, month: 2, comingSoon: true },
    { id: 'faith-1', name: 'Faith & Foresight - Lesson 1', available: false, month: 3, comingSoon: true },
  ];

  // Holiday lessons for Nibble selection
  const holidayLessons = [
    { id: 'covenant', name: 'The Covenant', available: true },
    { id: 'cradle', name: 'The Cradle', available: true },
    { id: 'cross', name: 'The Cross', available: true },
    { id: 'comforter', name: 'The Comforter', available: true }
  ];

  // FREE LESSONS - Self-Worth series and Bonus lessons
  const freeLessons = [
    { id: 'in-his-image-1', name: 'Made in His Image', series: 'Self-Worth (5th Week)', description: 'Genesis 1:27 - You are created in God\'s image' },
    { id: 'in-his-image-2', name: 'Accepted and Loved', series: 'Self-Worth (5th Week)', description: 'Luke 5:31 - Jesus welcomes everyone' },
    { id: 'in-his-image-3', name: 'Chosen of God', series: 'Self-Worth (5th Week)', description: 'Luke 5:31-32 - You are chosen and valued' },
    { id: 'holiday-ae-bonus-names', name: 'The Names of God', series: 'Holiday Bonus', description: 'Proverbs 18:10 - Yahweh, Elohim, Adonai' },
    { id: 'holiday-ae-bonus-times', name: 'Times and Seasons', series: 'Holiday Bonus', description: 'Ecclesiastes 3:1 - Biblical numerology' }
  ];

  // COMPACT AMAZON-STYLE: One card per meal series with all options
  // Unavailable options are greyed out, Instructor bundles = Pre-order
  const mealSeries = [
    {
      id: 'holiday',
      name: 'Holiday Series',
      tagline: '4 C\'s of Christianity + 2 FREE Bonus Lessons',
      description: 'Covenant, Cradle, Cross, Comforter - celebrating faith through the seasons',
      available: true,
      editions: ['adult', 'youth'],
      formats: ['interactive', 'epub', 'physical'],
      packages: [
        { id: 'nibble', name: 'Nibble (1 Lesson)', lessons: 1, selectLesson: true, available: true },
        { id: 'full', name: 'Full Series (4 + 2 FREE)', lessons: 6, badge: '2 Bonus FREE!', available: true }
      ],
      pricing: {
        nibble: {
          listPrices: { adult: { interactive: 2.99, epub: 2.99 }, youth: { interactive: 2.99, epub: 2.99 } },
          prices: { adult: { interactive: 2.49, epub: 2.49 }, youth: { interactive: 2.49, epub: 2.49 } }
        },
        full: {
          listPrices: { adult: { physical: 24.99, interactive: 12.99, epub: 12.99 }, youth: { physical: 24.99, interactive: 12.99, epub: 12.99 } },
          prices: { adult: { physical: 21.99, interactive: 12.99, epub: 12.99 }, youth: { physical: 21.99, interactive: 12.99, epub: 12.99 } }
        }
      },
      lessonOptions: holidayLessons,
      salePercent: 10
    },
    {
      id: 'breakfast',
      name: 'Break*fast Series',
      tagline: 'Foundation in Christ',
      description: '48 lessons across 12 months of spiritual growth',
      available: true,
      editions: ['adult', 'youth'],
      formats: ['interactive', 'epub'],
      packages: [
        { id: 'nibble', name: 'Nibble (1 Lesson)', lessons: 1, selectLesson: true, available: true },
        { id: 'snack', name: 'Snack Pack (4 Lessons)', lessons: 4, selectMonth: true, available: true },
        { id: 'meal', name: 'Meal Bundle (12 Lessons)', lessons: 12, available: false, preOrder: true, note: 'Q2 2026' },
        { id: 'subscription', name: 'Subscription (All Access)', isSubscription: true, available: true }
      ],
      pricing: {
        nibble: {
          listPrices: { adult: { interactive: 2.99, epub: 2.99 }, youth: { interactive: 2.99, epub: 2.99 } },
          prices: { adult: { interactive: 2.49, epub: 2.49 }, youth: { interactive: 2.49, epub: 2.49 } }
        },
        snack: {
          listPrices: { adult: { interactive: 8.99, epub: 8.99 }, youth: { interactive: 8.99, epub: 8.99 } },
          prices: { adult: { interactive: 8.99, epub: 8.99 }, youth: { interactive: 8.99, epub: 8.99 } }
        },
        meal: {
          listPrices: { adult: { interactive: 26.97, epub: 26.97 }, youth: { interactive: 26.97, epub: 26.97 } },
          prices: { adult: { interactive: 21.99, epub: 21.99 }, youth: { interactive: 21.99, epub: 21.99 } }
        },
        subscription: {
          prices: { adult: { subscription_monthly: 9.99, subscription_annual: 99.00 }, youth: { subscription_monthly: 9.99, subscription_annual: 99.00 } }
        }
      },
      monthOptions: breakfastMonths,
      lessonOptions: breakfastLessons,
      salePercent: 10
    },
    {
      id: 'lunch',
      name: 'Lunch Series',
      tagline: 'Spiritual Maturity & Growth',
      description: 'Deeper lessons for continued spiritual development',
      available: false,
      preOrder: true,
      comingSoon: 'Q3 2026',
      editions: ['adult', 'youth'],
      formats: ['interactive', 'epub', 'physical'],
      packages: [
        { id: 'nibble', name: 'Nibble (1 Lesson)', lessons: 1, available: false, preOrder: true },
        { id: 'snack', name: 'Snack Pack (4 Lessons)', lessons: 4, available: false, preOrder: true },
        { id: 'meal', name: 'Meal Bundle (12 Lessons)', lessons: 12, available: false, preOrder: true }
      ],
      pricing: {
        nibble: {
          listPrices: { adult: { interactive: 3.99, epub: 2.99 }, youth: { interactive: 3.99, epub: 2.99 } },
          prices: { adult: { interactive: 3.59, epub: 2.69 }, youth: { interactive: 3.59, epub: 2.69 } }
        },
        snack: {
          listPrices: { adult: { interactive: 7.99, epub: 5.99 }, youth: { interactive: 7.99, epub: 5.99 } },
          prices: { adult: { interactive: 7.19, epub: 5.39 }, youth: { interactive: 7.19, epub: 5.39 } }
        },
        meal: {
          listPrices: { adult: { interactive: 16.99, epub: 12.99 }, youth: { interactive: 16.99, epub: 12.99 } },
          prices: { adult: { interactive: 15.29, epub: 11.69 }, youth: { interactive: 15.29, epub: 11.69 } }
        }
      },
      salePercent: 10
    },
    {
      id: 'instructor',
      name: 'Instructor Edition',
      tagline: 'Complete Teaching Resources',
      description: 'Full curriculum with teaching guides, answer keys, and group activities',
      available: false,
      preOrder: true,
      editions: ['instructor'],
      formats: ['interactive', 'epub', 'physical'],
      packages: [
        { id: 'holiday-full', name: 'Holiday Set (6 Lessons)', lessons: 6, available: false, preOrder: true },
        { id: 'meal', name: 'Meal Bundle (12 Lessons)', lessons: 12, available: false, preOrder: true },
        { id: 'full-set', name: 'Full Curriculum (36 Lessons)', lessons: 36, available: false, preOrder: true, badge: '15% Off' }
      ],
      pricing: {
        'holiday-full': {
          listPrices: { instructor: { physical: 14.99, interactive: 9.99, epub: 7.99 } },
          prices: { instructor: { physical: 13.49, interactive: 8.99, epub: 7.19 } }
        },
        meal: {
          listPrices: { instructor: { physical: 24.99, interactive: 19.99, epub: 15.99 } },
          prices: { instructor: { physical: 22.49, interactive: 17.99, epub: 14.39 } }
        },
        'full-set': {
          listPrices: { instructor: { physical: 45.99, interactive: 35.99, epub: 29.99 } },
          prices: { instructor: { physical: 39.09, interactive: 30.59, epub: 25.49 } }
        }
      },
      salePercent: 15
    }
  ];

  // Keep legacy products array for backward compatibility with existing render logic
  const products = [
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

  // Gaming passes - $30 Adult/Youth all-day, $40 Instructor (category selection)
  const gamingPasses = [
    {
      id: 'gaming-pass-30',
      name: 'Game Pass (30-Day)',
      subtitle: '30-Day Access (Adult/Youth)',
      description: '30-day access to Soul Food game content for study groups and family nights',
      image: '/images/bounty-stack-token.png',
      listPrice: 7.99,
      price: 7.99,
      editions: ['adult', 'youth']
    },
    {
      id: 'gaming-pass-90',
      name: 'Game Pass (90-Day)',
      subtitle: '90-Day Access - Best Value!',
      description: '90-day access to all game modes, categories, and review challenges',
      image: '/images/bounty-stack-token.png',
      listPrice: 19.99,
      price: 19.99,
      editions: ['adult', 'youth', 'instructor'],
      badge: 'Best Value'
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
      id: 'study-kit',
      name: 'Study Kit Add-On',
      subtitle: 'Pen + Magnetic Bookmark Set',
      image: '/covers/soul-food-pen.png',
      price: 9.99
    },
    {
      id: 'pen-lighted',
      name: 'SOFU Journal Pen - Lighted',
      subtitle: 'Branded lighted journal pen',
      image: '/covers/soul-food-pen.png',
      listPrice: 9.99,
      price: 9.09,
      badge: '10% Launch'
    },
    {
      id: 'pen-standard',
      name: 'SOFU Journal Pen',
      subtitle: 'Branded journal pen',
      image: '/covers/soul-food-pen.png',
      listPrice: 7.99,
      price: 7.29,
      badge: '10% Launch'
    },
    {
      id: 'bookmarks-set',
      name: 'Magnetic Bookmarks (Set of 3)',
      subtitle: 'Decorative magnetic bookmarks',
      image: '/covers/magnetic-bookmark-1.png',
      listPrice: 6.99,
      price: 6.29,
      badge: '10% Launch'
    },
    {
      id: 'bookmark-leather',
      name: 'Magnetic Leather Bookmark',
      subtitle: 'Premium magnetic leather bookmark',
      image: '/covers/leather-bookmark-1.png',
      listPrice: 6.99,
      price: 6.29,
      badge: '10% Launch'
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
    
    // Handle nibbles and snack packs - use dedicated cover images
    if (product.isNibble || product.isSnackPack) {
      const seriesId = product.id.includes('holiday') ? 'holiday' : 'breakfast';
      const editionKey = edition === 'bundle' ? 'adult' : edition;
      const productType = product.isNibble ? 'nibble' : 'snackpack';
      
      // Map to specific nibble/snackpack cover images
      const nibbleSnackCovers = {
        'breakfast-adult-nibble': '/covers/breakfast-adult-nibble.jpg',
        'breakfast-youth-nibble': '/covers/breakfast-youth-nibble.png',
        'breakfast-adult-snackpack': '/covers/breakfast-adult-snackpack.jpg',
        'breakfast-youth-snackpack': '/covers/breakfast-youth-snackpack.png',
        'holiday-adult-nibble': '/covers/holiday-adult-nibble.jpg',
        'holiday-youth-nibble': '/covers/holiday-adult-nibble.jpg', // fallback to adult
        'holiday-adult-snackpack': '/covers/holiday-adult-nibble.jpg', // fallback
        'holiday-youth-snackpack': '/covers/holiday-adult-nibble.jpg'  // fallback
      };
      
      const coverKey = `${seriesId}-${editionKey}-${productType}`;
      return nibbleSnackCovers[coverKey] || 
             (seriesId === 'holiday' ? '/covers/holiday-adult-nibble.jpg' : '/covers/breakfast-adult-nibble.jpg');
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

  const getListPrice = (product) => {
    if (!product.listPrices) return null;
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || product.formats[0];
    return product.listPrices[edition]?.[format] || null;
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
            🍽️ What&apos;s on Your Plate Today?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Select your spiritual nourishment below and add to your cart in seconds!
          </p>
        </div>

        {/* FREE LESSONS CARD - Same style as Holiday/Breakfast cards */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🤲 Free Lessons</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Lessons Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Cover Image */}
                  <div className="flex-shrink-0 w-36">
                    <img 
                      src="/images/free-lessons-card.png" 
                      alt="Free Lessons - Made in His Image, Names of God, Times & Seasons"
                      className="w-full h-full object-cover"
                      style={{ minHeight: '280px' }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg text-slate-800">Free Lesson Collection</h4>
                      <Badge className="bg-green-500 text-white text-xs">FREE</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Self-Worth Series + Holiday Bonus Lessons</p>
                    
                    {/* Lesson List */}
                    <div className="space-y-2 mb-4">
                      {freeLessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{lesson.name}</p>
                            <p className="text-xs text-green-600">{lesson.series}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <a
                              href={`/interactive-lesson/${lesson.id}`}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded font-medium transition-colors"
                            >
                              Start
                            </a>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interactive-lessons/download/nibble/${lesson.id}`);
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `SoulFood_${lesson.name.replace(/\s+/g, '_')}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                    toast.success('PDF downloaded!');
                                  } else {
                                    toast.error('Download not available yet');
                                  }
                                } catch (err) {
                                  toast.error('Download failed');
                                }
                              }}
                              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-medium transition-colors"
                            >
                              📥
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Price Display */}
                    <div className="text-center py-2 bg-green-100 rounded-lg">
                      <span className="text-2xl font-bold text-green-700">$0.00</span>
                      <span className="text-sm text-green-600 ml-2">All 5 Lessons FREE!</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* COMPACT AMAZON-STYLE: Soul Food Meals */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">📚 Soul Food Meals</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {mealSeries.map(meal => {
              const sel = selections[meal.id] || {};
              const defaultPkg = meal.packages?.[0]?.id || 'full';
              const selectedPkg = sel.package || defaultPkg;
              const selectedEdition = sel.edition || meal.editions?.[0] || 'adult';
              const selectedFormat = sel.format || (selectedPkg === 'subscription' ? 'subscription_monthly' : 'interactive');
              const selectedMonth = sel.month || (meal.monthOptions?.[0]?.id || 'month-1');
              const selectedLesson = sel.lesson || (meal.lessonOptions?.[0]?.id || 'covenant');
              
              const pkgData = meal.packages?.find(p => p.id === selectedPkg) || meal.packages?.[0];
              const pricingData = meal.pricing?.[selectedPkg] || {};
              
              // Get price based on selections
              const getPackagePrice = () => {
                if (!pricingData?.prices?.[selectedEdition]) return 0;
                return pricingData.prices[selectedEdition][selectedFormat] || 0;
              };
              const getPackageListPrice = () => {
                if (!pricingData?.listPrices?.[selectedEdition]) return null;
                return pricingData.listPrices[selectedEdition][selectedFormat] || null;
              };
              
              const price = getPackagePrice();
              const listPrice = getPackageListPrice();
              
              // Available formats for selected package
              const availableFormats = pkgData?.isSubscription 
                ? ['subscription_monthly', 'subscription_annual']
                : meal.formats.filter(f => !f.includes('subscription'));

              return (
                <Card key={meal.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Cover Image */}
                      <div className="flex-shrink-0 relative">
                        <img 
                          src={meal.id === 'holiday' ? '/covers/holiday-adult-front.jpg' : 
                               meal.id === 'lunch' ? '/soul-food-logo.png' :
                               '/covers/breakfast-adult-front.jpg'} 
                          alt={meal.name}
                          className={`w-28 h-40 object-cover rounded-lg border border-slate-200 shadow-sm ${meal.preOrder ? 'opacity-60 grayscale-[30%]' : ''}`}
                        />
                        {meal.preOrder && (
                          <Badge className="absolute top-2 left-2 bg-amber-500 text-xs">
                            Pre-Order
                          </Badge>
                        )}
                        {pkgData?.badge && !meal.preOrder && (
                          <Badge className="mt-2 bg-emerald-500 text-xs w-full justify-center">
                            {pkgData.badge}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Options */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-slate-800">{meal.name}</h4>
                        <p className="text-xs text-slate-500 mb-3">{meal.tagline}</p>
                        
                        {/* Package Size Selector */}
                        <div className="mb-2">
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Size:</label>
                          <select
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                            value={selectedPkg}
                            onChange={(e) => {
                              const pkg = meal.packages.find(p => p.id === e.target.value);
                              if (pkg?.available !== false) {
                                updateSelection(meal.id, 'package', e.target.value);
                              }
                            }}
                          >
                            {meal.packages.map(pkg => (
                              <option 
                                key={pkg.id} 
                                value={pkg.id}
                                disabled={pkg.available === false}
                                className={pkg.available === false ? 'text-slate-400' : ''}
                              >
                                {pkg.name} {pkg.preOrder ? '(Pre-Order)' : ''} {pkg.note && !pkg.preOrder ? `(${pkg.note})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Month Selector - for Snack Packs */}
                        {pkgData?.selectMonth && meal.monthOptions && (
                          <div className="mb-2">
                            <label className="block text-xs font-semibold mb-1 text-purple-700">📅 Select Month:</label>
                            <select
                              className="w-full p-2 border border-purple-300 rounded-lg text-sm bg-purple-50"
                              value={selectedMonth}
                              onChange={(e) => updateSelection(meal.id, 'month', e.target.value)}
                            >
                              {meal.monthOptions.map(month => (
                                <option key={month.id} value={month.id}>{month.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Lesson Selector - for Nibbles */}
                        {pkgData?.selectLesson && meal.lessonOptions && (
                          <div className="mb-2">
                            <label className="block text-xs font-semibold mb-1 text-orange-700">📖 Select Lesson:</label>
                            <select
                              className="w-full p-2 border border-orange-300 rounded-lg text-sm bg-orange-50"
                              value={selectedLesson}
                              onChange={(e) => {
                                const lesson = meal.lessonOptions.find(l => l.id === e.target.value);
                                if (lesson?.available !== false) {
                                  updateSelection(meal.id, 'lesson', e.target.value);
                                }
                              }}
                            >
                              {meal.lessonOptions.filter(l => l.available !== false).map(lesson => (
                                <option key={lesson.id} value={lesson.id}>
                                  {lesson.name}
                                </option>
                              ))}
                              {meal.lessonOptions.some(l => l.available === false) && (
                                <option disabled className="text-gray-400">
                                  ── Coming Soon ──
                                </option>
                              )}
                              {meal.lessonOptions.filter(l => l.available === false).map(lesson => (
                                <option key={lesson.id} value={lesson.id} disabled className="text-gray-400">
                                  {lesson.name} (Coming Soon)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {/* Edition Selector */}
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700">Edition:</label>
                            <select
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                              value={selectedEdition}
                              onChange={(e) => updateSelection(meal.id, 'edition', e.target.value)}
                            >
                              {meal.editions.map(ed => (
                                <option key={ed} value={ed}>
                                  {ed === 'adult' ? 'Adult' : ed === 'youth' ? 'Youth' : 'Instructor'}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Format Selector */}
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700">Format:</label>
                            <select
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                              value={selectedFormat}
                              onChange={(e) => updateSelection(meal.id, 'format', e.target.value)}
                            >
                              {availableFormats.map(fmt => (
                                <option key={fmt} value={fmt}>
                                  {fmt === 'physical' ? 'Paperback' :
                                   fmt === 'interactive' ? 'i-PDF' :
                                   fmt === 'epub' ? 'ePub' :
                                   fmt === 'subscription_monthly' ? 'Monthly' :
                                   fmt === 'subscription_annual' ? 'Annual' : fmt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Price & Add to Cart */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            {isSaleActive && listPrice && listPrice !== price && (
                              <span className="text-xs text-slate-400 line-through mr-2">${listPrice.toFixed(2)}</span>
                            )}
                            <span className="text-xl font-bold text-purple-600">
                              ${price.toFixed(2)}
                              {selectedFormat.includes('subscription') && (
                                <span className="text-xs text-slate-500">
                                  /{selectedFormat === 'subscription_monthly' ? 'mo' : 'yr'}
                                </span>
                              )}
                            </span>
                          </div>
                          <Button
                            onClick={() => {
                              const itemName = pkgData?.selectMonth 
                                ? `${meal.name} - ${meal.monthOptions.find(m => m.id === selectedMonth)?.name}`
                                : pkgData?.selectLesson
                                ? `${meal.name} - ${meal.lessonOptions.find(l => l.id === selectedLesson)?.name}`
                                : `${meal.name} - ${pkgData?.name}`;
                              
                              const isPreOrder = meal.preOrder || pkgData?.preOrder;
                              
                              addToCart({
                                id: `${meal.id}-${selectedPkg}${pkgData?.selectMonth ? `-${selectedMonth}` : ''}${pkgData?.selectLesson ? `-${selectedLesson}` : ''}-${selectedEdition}-${selectedFormat}`,
                                name: isPreOrder ? `[PRE-ORDER] ${itemName} - ${selectedEdition.toUpperCase()} - ${selectedFormat.toUpperCase()}` : `${itemName} - ${selectedEdition.toUpperCase()} - ${selectedFormat.toUpperCase()}`,
                                edition: selectedEdition,
                                format: selectedFormat,
                                price: price,
                                quantity: 1,
                                isPreOrder: isPreOrder
                              });
                              
                              if (isPreOrder) {
                                toast.success(`Pre-order added! ${itemName} will be available soon.`);
                              } else {
                                toast.success(`Added ${itemName} to cart!`);
                              }
                            }}
                            className={meal.preOrder || pkgData?.preOrder 
                              ? "bg-amber-500 hover:bg-amber-600 px-4" 
                              : "bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 px-4"}
                          >
                            {meal.preOrder || pkgData?.preOrder ? 'Pre-Order' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Legacy Products - Hidden for now, keeping for backward compatibility */}
        <section className="mb-16 hidden">
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
                        <div className="flex flex-col">
                          {/* Show list price crossed out if on sale */}
                          {isSaleActive && getListPrice(product) && getListPrice(product) !== getPrice(product) && (
                            <span className="text-xs text-slate-400 line-through">
                              ${getListPrice(product).toFixed(2)}
                            </span>
                          )}
                          <div className="text-lg font-bold text-purple-600">
                            ${getPrice(product).toFixed(2)}
                            {(selections[product.id]?.format || product.formats[0]) === 'subscription_monthly' && (
                              <span className="text-xs text-slate-500">/mo</span>
                            )}
                            {(selections[product.id]?.format || product.formats[0]) === 'subscription_annual' && (
                              <span className="text-xs text-slate-500">/yr</span>
                            )}
                          </div>
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
              <CardTitle className="text-2xl text-purple-900">🎉 Bulk Order Discounts!</CardTitle>
              <p className="text-purple-700 mt-2">Enter promo code at checkout for instant savings!</p>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow border-2 border-amber-200">
                  <div className="text-3xl mb-2">📖</div>
                  <div className="font-bold text-lg mb-1 text-amber-700">Book Club Special</div>
                  <div className="text-2xl font-bold text-amber-600 mb-2">10% OFF</div>
                  <div className="text-sm text-slate-600 mb-2">5+ items</div>
                  <div className="bg-amber-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">Use code: </span>
                    <span className="font-mono font-bold text-amber-800">BOOK10</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow border-2 border-emerald-200">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-bold text-lg mb-1 text-emerald-700">Small Bulk Order</div>
                  <div className="text-2xl font-bold text-emerald-600 mb-2">15% OFF</div>
                  <div className="text-sm text-slate-600 mb-2">10+ items</div>
                  <div className="bg-emerald-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">Use code: </span>
                    <span className="font-mono font-bold text-emerald-800">BULK15</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow border-2 border-purple-300">
                  <Badge className="bg-purple-600 text-white mb-2">Best Value!</Badge>
                  <div className="text-3xl mb-2">🏢</div>
                  <div className="font-bold text-lg mb-1 text-purple-700">Mega Bulk Order</div>
                  <div className="text-2xl font-bold text-purple-600 mb-2">30% OFF</div>
                  <div className="text-sm text-slate-600 mb-2">25+ items</div>
                  <div className="bg-purple-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">Use code: </span>
                    <span className="font-mono font-bold text-purple-800">MEGA30</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-slate-500">
                💡 Perfect for churches, study groups, homeschool co-ops, and ministries!
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default QuickOrder;
