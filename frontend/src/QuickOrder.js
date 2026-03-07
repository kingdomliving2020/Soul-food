import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from './CartContext';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ShoppingCart, X, Trash2 } from 'lucide-react';

// Countdown Timer Hook for Palm Sunday deadline
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// Palm Sunday Promo Banner with Countdown
const PalmSundayBanner = () => {
  // March 15, 2026 at 11:59 PM (expedited shipping deadline)
  const expeditedDeadline = useCountdown('2026-03-15T23:59:59');
  // March 10, 2026 at 11:59 PM (standard shipping deadline)
  const standardDeadline = useCountdown('2026-03-10T23:59:59');

  // Don't show banner after both deadlines pass
  if (expeditedDeadline.expired && standardDeadline.expired) {
    return null;
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">✝️</span>
            <h3 className="text-xl md:text-2xl font-bold">Get Ready for Resurrection Sunday!</h3>
            <span className="text-3xl">🌿</span>
          </div>
          <p className="text-purple-100 text-sm md:text-base">
            Order your <strong>Break*fast</strong> or <strong>Holiday Series</strong> workbooks in time for Palm Sunday studies!
          </p>
        </div>

        {/* Countdown & Deadlines */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          
          {/* Standard Shipping - Show if not expired */}
          {!standardDeadline.expired ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-4 text-center min-w-[200px]">
              <p className="text-xs text-purple-200 uppercase tracking-wide mb-2">📦 Standard Shipping</p>
              <p className="font-semibold text-sm mb-2">Order by March 10</p>
              <div className="flex justify-center gap-2">
                <div className="bg-white/30 rounded-lg px-3 py-2">
                  <span className="text-2xl font-bold">{standardDeadline.days}</span>
                  <p className="text-xs text-purple-200">days</p>
                </div>
                <div className="bg-white/30 rounded-lg px-3 py-2">
                  <span className="text-2xl font-bold">{standardDeadline.hours}</span>
                  <p className="text-xs text-purple-200">hrs</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-500/30 backdrop-blur-sm rounded-xl px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wide mb-1">📦 Standard Shipping</p>
              <p className="font-semibold">Deadline Passed</p>
            </div>
          )}

          {/* Divider */}
          <div className="hidden lg:block h-20 w-px bg-white/30"></div>
          <div className="lg:hidden w-full h-px bg-white/30"></div>

          {/* Expedited Shipping - Primary focus */}
          {!expeditedDeadline.expired ? (
            <div className="bg-amber-400 text-purple-900 rounded-xl px-5 py-4 text-center min-w-[220px] shadow-lg transform hover:scale-105 transition-transform">
              <p className="text-xs uppercase tracking-wide font-medium mb-2">⚡ Expedited Shipping</p>
              <p className="font-semibold text-sm mb-2">Order by March 15</p>
              <div className="flex justify-center gap-2">
                <div className="bg-amber-300 rounded-lg px-3 py-2">
                  <span className="text-3xl font-bold">{expeditedDeadline.days}</span>
                  <p className="text-xs text-purple-800">days</p>
                </div>
                <div className="bg-amber-300 rounded-lg px-3 py-2">
                  <span className="text-3xl font-bold">{expeditedDeadline.hours}</span>
                  <p className="text-xs text-purple-800">hrs</p>
                </div>
                <div className="bg-amber-300 rounded-lg px-3 py-2">
                  <span className="text-3xl font-bold">{expeditedDeadline.minutes}</span>
                  <p className="text-xs text-purple-800">min</p>
                </div>
              </div>
              {expeditedDeadline.days <= 3 && (
                <p className="mt-2 text-xs font-bold animate-pulse">🔥 Last chance for on-time delivery!</p>
              )}
            </div>
          ) : (
            <div className="bg-red-500 text-white rounded-xl px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wide mb-1">⚡ Expedited Shipping</p>
              <p className="font-semibold">Deadline Passed</p>
              <p className="text-xs mt-1">Digital downloads still available!</p>
            </div>
          )}
        </div>

        {/* CTA */}
        {!expeditedDeadline.expired && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-green-300 font-medium text-sm">⚡ Digital: Available Instantly</span>
              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
              <span className="text-purple-200 text-sm">📦 Physical: Order by deadlines above</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        physical: { front: '/covers/holiday-ae-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-ae-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ae-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ae-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      },
      youth: {
        physical: { front: '/covers/holiday-ye-front.jpg', back: '/covers/holiday-youth-back.jpg' },
        ebook: { front: '/covers/holiday-ye-front.jpg', back: '/covers/holiday-youth-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ye-front.jpg', back: '/covers/holiday-youth-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ye-front.jpg', back: '/covers/holiday-youth-back.jpg' }
      },
      instructor: {
        physical: { front: '/covers/holiday-ie-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        ebook: { front: '/covers/holiday-ie-front.jpg', back: '/covers/holiday-instructor-ebook-back.jpg' },
        subscription_monthly: { front: '/covers/holiday-ie-front.jpg', back: '/covers/holiday-adult-back.jpg' },
        subscription_annual: { front: '/covers/holiday-ie-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      },
      bundle: {
        physical: { front: '/covers/holiday-ae-front.jpg', back: '/covers/holiday-adult-back.jpg' }
      }
    }
  };

  // Product catalog - Holiday first, then Breakfast, then Nibbles/Snack Packs, then Box Set, then Coming Soon
  // Products now available - show sale prices where applicable
  const SALE_END_DATE = new Date('2026-01-15');
  const isSaleActive = new Date() < SALE_END_DATE;
  
  // Breakfast Series monthly topics for Snack Pack selection
  const breakfastMonths = [
    { id: 'month-1', name: 'Month 1: Prayer, the First Resort', lessons: 4, available: true },
    { id: 'month-2', name: 'Month 2: The Art of Through', lessons: 4, available: true },
    { id: 'month-3', name: 'Month 3: Faith & Foresight', lessons: 4, available: true }
  ];

  // Breakfast individual lessons for Nibble selection (organized by month)
  // IDs must match backend BREAKFAST_AE_NIBBLES / BREAKFAST_YE_NIBBLES
  // Format: breakfast-{ae|ye}-{theme}-{lesson#}
  const breakfastLessons = [
    // Month 1 - Prayer, the First Resort
    { id: 'prayer-1', name: 'Esther: Second Is the Best', available: true, month: 1 },
    { id: 'prayer-2', name: 'Solomon: The Question That Unlocked a Legacy', available: true, month: 1 },
    { id: 'prayer-3', name: 'Jesus: Prayer the First Resort', available: true, month: 1 },
    { id: 'prayer-4', name: 'Paul & Silas: Faith in the Dark', available: true, month: 1 },
    // Month 2 - The Art of Through
    { id: 'through-1', name: 'Joseph – The Young Dreamer', available: true, month: 2 },
    { id: 'through-2', name: 'Hannah – Barren but Not Lifeless', available: true, month: 2 },
    { id: 'through-3', name: 'Abram – No Heir, Wait Here', available: true, month: 2 },
    { id: 'through-4', name: 'Victory Through the Blood', available: true, month: 2 },
    // Month 3 - Faith & Foresight
    { id: 'faith-1', name: 'Rahab: Faith That Took Action', available: true, month: 3 },
    { id: 'faith-2', name: 'Abigail: Wisdom on the Move', available: true, month: 3 },
    { id: 'faith-3', name: 'The Centurion: Faith That Commands Results', available: true, month: 3 },
    { id: 'faith-4', name: 'Joseph of Arimathea: Trust the Process', available: true, month: 3 }
  ];

  // Holiday lessons for Nibble selection - IDs must match backend ALL_NIBBLES
  const holidayLessons = [
    { id: 'holiday-ae-covenant', name: 'The Covenant', available: true },
    { id: 'holiday-ae-cradle', name: 'The Cradle', available: true },
    { id: 'holiday-ae-cross', name: 'The Cross', available: true },
    { id: 'holiday-ae-comforter', name: 'The Comforter', available: true }
  ];

  // FREE LESSONS - Self-Worth series and Bonus lessons
  const freeLessons = [
    { id: 'in-his-image-1', name: 'Made in His Image', series: 'Self-Worth (5th Week)', description: 'Genesis 1:27 - You are created in God\'s image' },
    { id: 'in-his-image-2', name: 'Accepted and Loved', series: 'Self-Worth (5th Week)', description: 'Luke 5:31 - Jesus welcomes everyone' },
    { id: 'in-his-image-3', name: 'Chosen of God', series: 'Self-Worth (5th Week)', description: 'Luke 5:31-32 - You are chosen and valued' },
    { id: 'bonus-ae-holiday', name: 'Holiday Bonus (Adult)', series: 'Holiday Bonus', description: 'Names of God & Times and Seasons - Adult Edition', downloadId: 'bonus-ae-holiday' },
    { id: 'bonus-ye-holiday', name: 'Holiday Bonus (Youth)', series: 'Holiday Bonus', description: 'Names of God & Times and Seasons - Youth Edition', downloadId: 'bonus-ye-holiday' }
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
      editions: ['adult', 'youth', 'instructor'],
      formats: ['interactive', 'epub', 'physical'],
      packages: [
        { id: 'nibble', name: 'Nibble (1 Lesson)', lessons: 1, selectLesson: true, available: true },
        { id: 'full', name: 'Full Series (4 + 2 FREE)', lessons: 6, badge: '2 Bonus FREE!', available: true }
      ],
      pricing: {
        nibble: {
          listPrices: { adult: { interactive: 3.99, epub: 3.99 }, youth: { interactive: 3.99, epub: 3.99 }, instructor: { interactive: 3.99, epub: 3.99 } },
          prices: { adult: { interactive: 3.99, epub: 3.99 }, youth: { interactive: 3.99, epub: 3.99 }, instructor: { interactive: 3.99, epub: 3.99 } }
        },
        full: {
          listPrices: { 
            adult: { physical: 16.99, interactive: 14.99, epub: 14.99 }, 
            youth: { physical: 16.99, interactive: 14.99, epub: 14.99 },
            instructor: { physical: 19.99, interactive: 17.99, epub: 17.99 }
          },
          prices: { 
            adult: { physical: 16.99, interactive: 14.99, epub: 14.99 }, 
            youth: { physical: 16.99, interactive: 14.99, epub: 14.99 },
            instructor: { physical: 19.99, interactive: 17.99, epub: 17.99 }
          }
        }
      },
      lessonOptions: holidayLessons,
      salePercent: 0
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
          listPrices: { adult: { interactive: 3.99, epub: 3.99 }, youth: { interactive: 3.99, epub: 3.99 } },
          prices: { adult: { interactive: 3.99, epub: 3.99 }, youth: { interactive: 3.99, epub: 3.99 } }
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
      tagline: 'Kingdom Relationships',
      description: 'Deeper lessons exploring relationships through Scripture',
      available: true,
      preOrder: true,
      comingSoon: 'Q2 2026',
      editions: ['adult', 'youth', 'instructor'],
      formats: ['physical'],
      packages: [
        { id: 'workbook', name: 'Full Workbook', lessons: 12, available: true, preOrder: true, note: 'Pre-Order' }
      ],
      pricing: {
        workbook: {
          listPrices: { 
            adult: { physical: 27.99 }, 
            youth: { physical: 24.99 },
            instructor: { physical: 29.99 }
          },
          prices: { 
            adult: { physical: 27.99 }, 
            youth: { physical: 24.99 },
            instructor: { physical: 29.99 }
          }
        }
      },
      salePercent: 0
    },
    {
      id: 'instructor',
      name: 'Instructor Edition',
      tagline: 'Complete Teaching Resources',
      description: 'Full curriculum with teaching guides, answer keys, and group activities',
      available: true,
      preOrder: true,
      editions: ['instructor'],
      formats: ['digital', 'physical'],
      packages: [
        { id: 'breakfast-digital', name: 'Break*fast IE (Digital)', price: 19.99, format: 'digital', available: true, preOrder: true },
        { id: 'breakfast-paperback', name: 'Break*fast IE (Paperback)', price: 29.99, format: 'physical', available: true, preOrder: true },
        { id: 'holiday-ie', name: 'Holiday IE (Workbook)', price: 19.99, format: 'physical', available: true, preOrder: true },
        { id: 'lunch-ie-preorder', name: 'Lunch IE', price: 29.99, format: 'physical', available: true, preOrder: true }
      ],
      salePercent: 0
    },
    {
      id: 'workbooks',
      name: 'Full Workbooks',
      tagline: 'Complete Study Workbooks',
      description: 'Full-length digital workbooks available now! Paperbacks ship Easter to Resurrection Sunday.',
      available: true,
      editions: ['adult', 'youth'],
      formats: ['digital', 'physical'],
      packages: [
        { id: 'breakfast-ae-digital', name: 'Break*fast AE Digital', price: 14.99, edition: 'adult', format: 'digital', available: true },
        { id: 'breakfast-ae-paperback', name: 'Break*fast AE Paperback', price: 27.99, edition: 'adult', format: 'physical', available: true, note: '2-3 wk ship' },
        { id: 'breakfast-ye-digital', name: 'Break*fast YE Digital', price: 12.99, edition: 'youth', format: 'digital', available: true },
        { id: 'breakfast-ye-paperback', name: 'Break*fast YE Paperback', price: 24.99, edition: 'youth', format: 'physical', available: true, note: '2-3 wk ship' },
        { id: 'holiday-ae-digital', name: 'Holiday AE Digital', price: 14.99, edition: 'adult', format: 'digital', available: true },
        { id: 'holiday-ae-paperback', name: 'Holiday AE Paperback', price: 16.99, edition: 'adult', format: 'physical', available: true, note: '2-3 wk ship' },
        { id: 'holiday-ye-digital', name: 'Holiday YE Digital', price: 12.99, edition: 'youth', format: 'digital', available: true },
        { id: 'holiday-ye-paperback', name: 'Holiday YE Paperback', price: 16.99, edition: 'youth', format: 'physical', available: true, note: '2-3 wk ship' },
        { id: 'holiday-ie-digital', name: 'Holiday IE Digital', price: 19.99, edition: 'instructor', format: 'digital', available: true },
        { id: 'holiday-ie-paperback', name: 'Holiday IE Paperback', price: 24.99, edition: 'instructor', format: 'physical', available: true, note: '2-3 wk ship' }
      ],
      salePercent: 0
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      tagline: 'All-Access Plans',
      description: 'Unlimited access to interactive lessons, games, and new content',
      available: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription'],
      packages: [
        { id: 'monthly', name: 'Monthly Plan', price: 9.99, billing: 'month', available: true },
        { id: 'annual', name: 'Annual Plan (Save 17%)', price: 99.00, billing: 'year', available: true, badge: 'Best Value' },
        { id: 'ministry', name: 'Ministry/Small Group', price: 24.99, billing: 'month', available: true, note: 'For groups & leaders' }
      ],
      salePercent: 0
    },
    {
      id: 'bookclub',
      name: '📚 Book Club Bundles',
      tagline: 'Bulk Orders for Groups & Ministries',
      description: 'Save $15/set! A set = 1 Instructor + 2 Student books. Paperbacks ship Easter to Resurrection Sunday.',
      available: true,
      editions: ['bundle'],
      formats: ['physical'],
      packages: [
        { id: 'club-5', name: 'Book Club (5-9 sets)', price: 64.95, note: 'Save $15/set', available: true, minQty: 5, maxQty: 9 },
        { id: 'small-bulk', name: 'Small Bulk (10-24 sets)', price: 62.95, note: 'Save $17/set + 1st Quarter Gaming FREE ($75 value)', available: true, minQty: 10, maxQty: 24, freeGaming: true },
        { id: 'mega-bulk', name: 'Mega Bulk (25+ sets)', price: 60.95, note: 'Save $19/set + 1st Quarter Gaming FREE ($75 value)', available: true, minQty: 25, emailRequired: true, freeGaming: true }
      ],
      bundleOptions: [
        { id: 'ie-2ye', name: '1 Instructor + 2 Youth Edition', description: 'Best for youth groups' },
        { id: 'ie-2ae', name: '1 Instructor + 2 Adult Edition', description: 'Best for adult studies' },
        { id: 'ie-1ae-1ye', name: '1 Instructor + 1 Adult + 1 Youth', description: 'Mixed group' }
      ],
      contactEmail: 'kingdomlivingproject2020@gmail.com',
      salePercent: 0
    },
    {
      id: 'medallions',
      name: '🏅 Achievement Medallions',
      tagline: 'Excellence Recognition Awards',
      description: 'Metal medallions for game champions and outstanding teachers. Iron sharpens iron.',
      available: true,
      editions: ['adult', 'youth', 'instructor'],
      formats: ['physical'],
      packages: [
        // Individual Medallions - $9.99 each
        { id: 'medallion-grinch-ae', name: 'GRinCH Champion (Adult)', price: 9.99, edition: 'adult', game: 'grinch', image: '/medallions/grinch-ae.png', available: true, note: 'Ships 2-3 wks' },
        { id: 'medallion-grinch-ye', name: 'GRinCH Champion (Youth)', price: 9.99, edition: 'youth', game: 'grinch', image: '/medallions/grinch-ye.png', available: true, note: 'Ships 2-3 wks' },
        { id: 'medallion-grinch-ie', name: 'GRinCH Iron vs Iron (Instructor)', price: 9.99, edition: 'instructor', game: 'grinch', image: '/medallions/grinch-ie.png', available: true, note: 'Ships 2-3 wks' },
        { id: 'medallion-passport-ae', name: 'Passport Trek (Adult)', price: 9.99, edition: 'adult', game: 'passport', image: '/medallions/passport-ae.png', available: true, note: 'Ships 2-3 wks' },
        { id: 'medallion-passport-ye', name: 'Passport Trek (Youth)', price: 9.99, edition: 'youth', game: 'passport', image: '/medallions/passport-ye.png', available: true, note: 'Ships 2-3 wks' },
        { id: 'medallion-passport-ie', name: 'Passport Trek (Instructor)', price: 9.99, edition: 'instructor', game: 'passport', image: '/medallions/passport-ie.png', available: true, note: 'Ships 2-3 wks' },
        // Bulk Packs
        { id: 'medallion-teacher-pack', name: 'Teacher Pack (3 Medallions)', price: 24.99, note: 'Any 3 - Save $5', available: true, bulk: 3 },
        { id: 'medallion-ministry-pack', name: 'Ministry Pack (10 Medallions)', price: 69.99, note: 'Any 10 - Save $30', available: true, bulk: 10 },
        { id: 'medallion-church-bundle', name: 'Church Bundle (25 Medallions)', price: 149.99, note: 'Any 25 - Save $100', available: true, bulk: 25 }
      ],
      salePercent: 0
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

  // Gaming passes - prices from Stripe catalog
  const gamingPasses = [
    {
      id: 'gaming-pass-30',
      name: 'Game Pass (30-Day)',
      subtitle: '30-Day Access (Adult/Youth)',
      description: '30-day access to Soul Food game content for study groups and family nights',
      restrictions: '4 hrs/day limit • 20 min idle timeout',
      image: '/images/bounty-stack-token.png',
      listPrice: 7.99,
      price: 7.99,
      editions: ['adult', 'youth']
    },
    {
      id: 'gaming-pass-90',
      name: 'Game Pass (90-Day)',
      subtitle: '90-Day Access - Best Value!',
      description: '90-day access to all game modes for churches, small groups, and quarterly study cycles',
      restrictions: '5 hrs/day limit • 30 min idle timeout',
      image: '/images/bounty-stack-token.png',
      listPrice: 24.99,
      price: 24.99,
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
      id: 'bonus-ie-holiday',
      name: 'Holiday Bonus Lessons (Instructor)',
      subtitle: 'Names of God & Times and Seasons with Games',
      image: '/covers/holiday-instructor-front.jpg',
      price: 9.99,
      isDigital: true,
      description: 'Instructor edition with game content for group activities'
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
      subtitle: 'Branded lighted journal pen with stylus',
      image: '/covers/soul-food-pen.png',
      price: 9.99
    },
    {
      id: 'pen-standard',
      name: 'SOFU Journal Pen',
      subtitle: 'Branded journal pen',
      image: '/covers/soul-food-pen.png',
      price: 7.99
    },
    {
      id: 'bookmarks-set',
      name: 'Magnetic Bookmarks (Set of 3)',
      subtitle: 'Decorative magnetic bookmarks',
      image: '/covers/magnetic-bookmark-1.png',
      price: 6.99
    },
    {
      id: 'bookmark-leather',
      name: 'Magnetic Leather Bookmark',
      subtitle: 'Premium magnetic leather bookmark',
      image: '/covers/leather-bookmark-1.png',
      price: 4.99
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
                                    onClick={() => {
                                      const key = item.uniqueKey || item.productId || item.id;
                                      console.log('[Cart] Decreasing quantity for:', key);
                                      updateQuantity(key, item.quantity - 1);
                                    }}
                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-sm min-w-[24px] text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => {
                                      const key = item.uniqueKey || item.productId || item.id;
                                      console.log('[Cart] Increasing quantity for:', key);
                                      updateQuantity(key, item.quantity + 1);
                                    }}
                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
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

        {/* 🌿 PALM SUNDAY / RESURRECTION SUNDAY PROMO BANNER WITH COUNTDOWN */}
        <PalmSundayBanner />

        {/* FREE LESSONS CARD - Same style as Holiday/Breakfast cards */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🤲 Free Lessons</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Lessons Card - PINNED LAYOUT: Do not modify structure */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-2 border-green-200">
              <CardContent className="p-0">
                {/* Desktop: Horizontal with image | Mobile: Simple list, no image */}
                <div className="flex flex-row">
                  {/* Cover Image - HIDDEN on mobile, shown on sm+ */}
                  <div className="hidden sm:block w-32 flex-shrink-0 bg-green-50">
                    <img 
                      src="/images/free-lessons-card.png" 
                      alt="Free Lessons"
                      className="w-full h-full object-cover"
                      style={{ minHeight: '280px' }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl sm:hidden">📖</span>
                      <h4 className="font-bold text-lg text-slate-800">Free Lesson Collection</h4>
                      <Badge className="bg-green-500 text-white text-xs flex-shrink-0">FREE</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Self-Worth Series + Holiday Bonus Lessons</p>
                    
                    {/* Lesson List - Compact on mobile */}
                    <div className="space-y-1.5 sm:space-y-2 mb-3 flex-1">
                      {freeLessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-100">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-medium text-slate-800 leading-tight">{lesson.name}</p>
                            <p className="text-xs text-green-600 hidden sm:block">{lesson.series}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
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
                    <div className="text-center py-2 bg-green-100 rounded-lg flex-shrink-0 mt-auto">
                      <span className="text-xl sm:text-2xl font-bold text-green-700">$0.00</span>
                      <span className="text-xs sm:text-sm text-green-600 ml-2">All FREE!</span>
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
              // Get the default format based on what's available for the selected package
              const defaultFormat = selectedPkg === 'subscription' 
                ? 'subscription_monthly' 
                : (meal.formats?.[0] || 'interactive');
              const selectedFormat = sel.format || defaultFormat;
              const selectedMonth = sel.month || (meal.monthOptions?.[0]?.id || 'month-1');
              const selectedLesson = sel.lesson || (meal.lessonOptions?.[0]?.id || 'holiday-ae-covenant');
              
              const pkgData = meal.packages?.find(p => p.id === selectedPkg) || meal.packages?.[0];
              const pricingData = meal.pricing?.[selectedPkg] || {};
              
              // Get price based on selections - supports both complex pricing and simple package pricing
              const getPackagePrice = () => {
                // If package has direct price, use it
                if (pkgData?.price !== undefined) return pkgData.price;
                // Otherwise use complex pricing structure
                if (!pricingData?.prices?.[selectedEdition]) return 0;
                return pricingData.prices[selectedEdition][selectedFormat] || 0;
              };
              const getPackageListPrice = () => {
                // If package has direct price, no list price needed
                if (pkgData?.price !== undefined) return null;
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
                          src={meal.id === 'holiday' ? '/covers/holiday-ae-front-new.png' : 
                               meal.id === 'lunch' ? '/soul-food-logo.png' :
                               meal.id === 'instructor' ? '/covers/breakfast-instructor-front.jpg' :
                               meal.id === 'workbooks' ? '/covers/breakfast-adult-front.jpg' :
                               meal.id === 'subscriptions' ? '/soul-food-logo.png' :
                               meal.id === 'medallions' ? '/soul-food-logo.png' :
                               '/covers/breakfast-adult-front.jpg'} 
                          alt={meal.name}
                          className={`w-24 h-32 object-contain rounded-lg border border-slate-200 shadow-sm bg-white ${meal.preOrder ? 'opacity-80' : ''}`}
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
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-bold text-lg text-slate-800 leading-tight">{meal.name}</h4>
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{meal.tagline}</p>
                        
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
                                {pkg.name} {pkg.note ? `(${pkg.note})` : ''}
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

                        {/* Bundle Option Selector - for Book Club */}
                        {meal.bundleOptions && (
                          <div className="mb-3">
                            <label className="block text-xs font-semibold mb-1 text-purple-700">📦 Select Bundle Type:</label>
                            <div className="space-y-2">
                              {meal.bundleOptions.map(opt => (
                                <label key={opt.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100">
                                  <input
                                    type="radio"
                                    name={`bundle-${meal.id}`}
                                    value={opt.id}
                                    checked={(selections[meal.id]?.bundleType || meal.bundleOptions[0].id) === opt.id}
                                    onChange={() => updateSelection(meal.id, 'bundleType', opt.id)}
                                    className="text-purple-600"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{opt.name}</p>
                                    <p className="text-xs text-slate-500">{opt.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                            {pkgData?.emailRequired && (
                              <p className="text-xs text-amber-600 mt-2">📧 Email {meal.contactEmail} for invoice & custom ratios</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {/* Edition Selector - only show if multiple editions */}
                          {meal.editions.length > 1 && (
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
                          )}

                          {/* Format Selector - only show if package doesn't have direct price and has formats */}
                          {!pkgData?.price && availableFormats.length > 0 && (
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
                                     fmt === 'digital' ? 'Digital' :
                                     fmt === 'subscription_monthly' ? 'Monthly' :
                                     fmt === 'subscription_annual' ? 'Annual' : fmt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Price & Action Buttons - Amazon style stacked layout */}
                        <div className="pt-3 border-t border-slate-100 mt-auto">
                          {/* Price */}
                          <div className="mb-2">
                            {isSaleActive && listPrice && listPrice !== price && (
                              <span className="text-xs text-slate-400 line-through mr-1">${listPrice.toFixed(2)}</span>
                            )}
                            <span className="text-xl font-bold text-purple-600">
                              ${price.toFixed(2)}
                              {(pkgData?.billing || selectedFormat.includes('subscription')) && (
                                <span className="text-xs text-slate-500 font-normal">
                                  /{pkgData?.billing || (selectedFormat === 'subscription_monthly' ? 'mo' : 'yr')}
                                </span>
                              )}
                            </span>
                            {pkgData?.note && (
                              <span className="text-xs text-slate-500 ml-2">({pkgData.note})</span>
                            )}
                          </div>
                          
                          {/* Action Buttons - equal width, stacked */}
                          <div className="flex gap-2">
                            {(meal.comingSoon && !meal.available) || pkgData?.comingSoon ? (
                              <Button
                                size="sm"
                                disabled
                                className="flex-1 text-xs py-2 bg-slate-400 cursor-not-allowed"
                              >
                                🔒 Coming Soon
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const itemName = pkgData?.selectMonth 
                                    ? `${meal.name} - ${meal.monthOptions.find(m => m.id === selectedMonth)?.name}`
                                    : pkgData?.selectLesson
                                    ? `${meal.name} - ${meal.lessonOptions.find(l => l.id === selectedLesson)?.name}`
                                    : `${meal.name} - ${pkgData?.name}`;
                                  
                                  const isPreOrder = meal.preOrder || pkgData?.preOrder;
                                  const shipNote = pkgData?.note ? ` (${pkgData.note})` : '';
                                  
                                  addToCart({
                                    id: `${meal.id}-${selectedPkg}${pkgData?.selectMonth ? `-${selectedMonth}` : ''}${pkgData?.selectLesson ? `-${selectedLesson}` : ''}-${selectedEdition}-${selectedFormat}`,
                                    name: isPreOrder ? `[PRE-ORDER] ${itemName} - ${selectedEdition.toUpperCase()}${shipNote}` : `${itemName} - ${selectedEdition.toUpperCase()}${shipNote}`,
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
                                className={`flex-1 text-xs py-2 ${meal.preOrder || pkgData?.preOrder 
                                  ? "bg-amber-500 hover:bg-amber-600" 
                                  : "bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700"}`}
                              >
                                {meal.preOrder || pkgData?.preOrder ? '🛒 Pre-Order' : '🛒 Add to Cart'}
                              </Button>
                            )}
                          </div>
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

        {/* Gaming Passes Section */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🎮 Gaming Access</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {gamingPasses.map(pass => (
              <Card key={pass.id} className="shadow-lg hover:shadow-xl transition-shadow border-2 border-purple-200">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Game Token Image */}
                    <div className="flex-shrink-0 relative">
                      <img 
                        src={pass.image} 
                        alt={pass.name}
                        className="w-20 h-20 object-contain rounded-lg"
                      />
                      {pass.badge && (
                        <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-xs">
                          {pass.badge}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-slate-800">{pass.name}</h4>
                      <p className="text-sm text-slate-600 mb-2">{pass.description}</p>
                      
                      {/* RESTRICTION DISCLOSURE - Required notice */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{pass.restrictions}</span>
                        </p>
                      </div>
                      
                      {/* Editions */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pass.editions.map(ed => (
                          <Badge key={ed} variant="outline" className="text-xs capitalize">
                            {ed === 'adult' ? 'Adult' : ed === 'youth' ? 'Youth' : 'Instructor'}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Price & Add to Cart */}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-purple-600">${pass.price.toFixed(2)}</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            addToCart({
                              id: pass.id,
                              name: pass.name,
                              price: pass.price,
                              quantity: 1,
                              image: pass.image
                            });
                            toast.success(`Added ${pass.name} to cart!`);
                          }}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          🛒 Add to Cart
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
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🎁 Extras & Merchandise</h3>
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
