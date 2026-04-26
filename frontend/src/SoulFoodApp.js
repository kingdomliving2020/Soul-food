import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import ShoppingCart from './ShoppingCart';
import ExitIntentPopup from './ExitIntentPopup';
import { useCart } from './CartContext';
import ProductSelectionModal from './ProductSelectionModal';
import ChatbotWidget from './ChatbotWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Soul Food Series Definitions
const SOUL_FOOD_SERIES = [
  {
    id: "breakfast",
    name: "Break*fast",
    theme: "Foundation in Christ",
    icon: "☀️",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    bgImage: "https://images.unsplash.com/photo-1756367260219-b60e3cb90fa5?w=800&h=400&fit=crop&crop=center",
    available: true,
    description: "Begin your spiritual journey with a rock-solid foundation in Christ. Perfect for new believers and those seeking renewal.",
    themes: [
      {
        themeName: "Prayer, the First Resort",
        lessons: [
          { number: 1, title: "Esther", description: "Prayer as a weapon in spiritual warfare" },
          { number: 2, title: "Solomon", description: "Wisdom through prayer and divine guidance" },
          { number: 3, title: "Jesus in the Garden", description: "Submission and intimacy with God" },
          { number: 4, title: "Paul & Silas", description: "Praise and prayer in persecution" }
        ]
      },
      {
        themeName: "The Art of Through",
        lessons: [
          { number: 1, title: "Joseph", description: "Young Dreamer" },
          { number: 2, title: "Hannah", description: "Barren but Not Lifeless" },
          { number: 3, title: "Abram", description: "No Heir, Wait Here" },
          { number: 4, title: "Victory Through the Blood", description: "Overcoming by the blood of the Lamb" }
        ]
      },
      {
        themeName: "Faith & Foresight",
        lessons: [
          { number: 1, title: "Rahab", description: "Bold faith in uncertain times" },
          { number: 2, title: "Abigail", description: "Wisdom and discernment in action" },
          { number: 3, title: "The Centurion", description: "Authority and humble faith" },
          { number: 4, title: "Joseph of Arimathea", description: "Courage to stand for Christ" }
        ]
      }
    ]
  },
  {
    id: "lunch",
    name: "Lunch",
    theme: "Kingdom Relationships",
    icon: "🌤️",
    gradient: "from-blue-400 via-cyan-500 to-teal-500",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    bgImage: "https://images.pexels.com/photos/8513088/pexels-photo-8513088.jpeg?w=800&h=400&fit=crop&crop=center",
    available: false,
    unlockDate: "Pre-Order — $3 Off (Ships May-Jun 2026)",
    description: "Learn to build authentic, Christ-centered relationships that reflect God's love and unity.",
    themes: [
      {
        themeName: "Friends & Friction is OK",
        lessons: [
          { number: 1, title: "Ruth & Naomi", description: "Loyalty through seasons of loss and hope" },
          { number: 2, title: "David & Jonathan", description: "Friendship that transcends rivalry" },
          { number: 3, title: "Jesus & Lazarus", description: "Love that weeps and resurrects" },
          { number: 4, title: "Jesus & Peter", description: "Restoration after betrayal" }
        ]
      },
      {
        themeName: "Relation-ship",
        lessons: [
          { number: 1, title: "Mary & Jesus - 1st Miracle", description: "Trusting in divine timing" },
          { number: 2, title: "Jesus & Followers", description: "Navigating discipleship together" },
          { number: 3, title: "Ananias & Sapphira", description: "The cost of deception in community" },
          { number: 4, title: "Samaritan Woman at The Well", description: "Breaking barriers through grace" }
        ]
      },
      {
        themeName: "Alone is Not Lonely",
        lessons: [
          { number: 1, title: "Elijah flees From Jezebel", description: "Finding God in the wilderness" },
          { number: 2, title: "David Family Captured", description: "Strengthening yourself in the Lord" },
          { number: 3, title: "Paul on Singleness", description: "Contentment in every season" },
          { number: 4, title: "Jesus on Oneness in God", description: "Complete in divine relationship" }
        ]
      }
    ]
  },
  {
    id: "dinner",
    name: "Dinner",
    theme: "Finding Your Purpose",
    icon: "🌆",
    gradient: "from-purple-400 via-pink-500 to-rose-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
    bgImage: "https://img.freepik.com/free-photo/high-angle-catholic-young-men-women-holding-each-other-hands-while-praying-together-around-table-with-christian-cross_662251-1120.jpg?w=800&h=400&fit=crop&crop=center",
    available: false,
    unlockDate: "Q2 2026",
    description: "Discover your unique calling and walk confidently in the purpose God has designed for you.",
    themes: [
      {
        themeName: "ID in Christ - Talents vs Gifts",
        lessons: [
          { number: 1, title: "Young and Gifted", description: "Recognizing God-given abilities early" },
          { number: 2, title: "Saul/Paul Admin Influence", description: "From persecutor to apostle - transformation of gifts" },
          { number: 3, title: "Callings in the Faith", description: "Discovering your unique kingdom purpose" },
          { number: 4, title: "Time to Represent", description: "Living out your calling boldly" }
        ]
      },
      {
        themeName: "Good Leaders Are Great Followers",
        lessons: [
          { number: 1, title: "The Great Commission", description: "Following Christ's final instructions" },
          { number: 2, title: "Fishers' of Men", description: "Answering the call to discipleship" },
          { number: 3, title: "Follow Me", description: "The cost and reward of following Jesus" },
          { number: 4, title: "Servitude", description: "Leadership through humble service" }
        ]
      },
      {
        themeName: "Sowing & Reaping",
        lessons: [
          { number: 1, title: "Deut 28", description: "Blessings and consequences of obedience" },
          { number: 2, title: "Joel 2", description: "Restoration and abundant harvest" },
          { number: 3, title: "Matt 25:14-30; Matt 20:1-16", description: "Faithful stewardship and kingdom rewards" },
          { number: 4, title: "2 Cor 9:6-8", description: "Generous giving and cheerful hearts" }
        ]
      }
    ]
  },
  {
    id: "supper",
    name: "Supper",
    theme: "Maturity in the Faith",
    icon: "🌙",
    gradient: "from-indigo-500 via-purple-600 to-blue-700",
    bgColor: "bg-gradient-to-br from-indigo-50 to-purple-50",
    bgImage: "https://img.freepik.com/free-photo/side-view-people-reading-together_23-2150062161.jpg?w=800&h=400&fit=crop&crop=center",
    available: false,
    unlockDate: "Q3 2026",
    description: "Grow into spiritual maturity, developing wisdom and character that honors Christ.",
    themes: [
      {
        themeName: "Persistent Pursuit",
        lessons: [
          { number: 1, title: "Timeless Love - Jacob's Story", description: "Unwavering dedication through years of service" },
          { number: 2, title: "Hosea's Hardship", description: "Loving faithfully despite betrayal" },
          { number: 3, title: "Daniel's Commitment", description: "Steadfast devotion in adversity" },
          { number: 4, title: "Job's Journey", description: "Enduring faith through suffering" }
        ]
      },
      {
        themeName: "Poisoned Pursuit",
        lessons: [
          { number: 1, title: "Fleeing Forward", description: "Running from God's calling" },
          { number: 2, title: "The Running Man", description: "Escaping consequences and truth" },
          { number: 3, title: "Nineveh", description: "Jonah's reluctant obedience" },
          { number: 4, title: "Double Standards", description: "Hypocrisy and misguided motives" }
        ]
      },
      {
        themeName: "There's No \"Right Way\" to Grieve",
        lessons: [
          { number: 1, title: "The First Family - Abel", description: "Cain and Eve's loss and sorrow" },
          { number: 2, title: "David (Bathsheba's First Son)", description: "A king's repentance and grief" },
          { number: 3, title: "Shunammite Woman's Son", description: "Faith in the face of death" },
          { number: 4, title: "Mary, Mother of Christ", description: "A mother's pain at the cross" }
        ]
      }
    ]
  },
  {
    id: "holiday",
    name: "Holiday Series",
    theme: "4 C's of Christianity",
    icon: "✡️",
    gradient: "from-emerald-400 via-green-500 to-lime-500",
    bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
    bgImage: "https://images.pexels.com/photos/8815225/pexels-photo-8815225.jpeg?w=800&h=400&fit=crop&crop=center",
    available: true,
    description: "The Covenant, The Cradle, The Cross, and The Comforter - celebrating faith through the seasons, plus bonus lessons.",
    themes: [
      {
        themeName: "The 4 C's of Christianity + Bonus Lessons",
        lessons: [
          { number: 1, title: "The Covenant", description: "God's eternal promise to His people" },
          { number: 2, title: "The Cradle", description: "The birth of our Savior and King" },
          { number: 3, title: "The Cross", description: "The ultimate sacrifice for our redemption" },
          { number: 4, title: "The Comforter", description: "The gift of the Holy Spirit to believers" },
          { number: 5, title: "Bonus Lesson - The Names of God", description: "Discovering God's character through His names", icon: "✝️" },
          { number: 6, title: "Bonus Lesson - Times & Seasons", description: "God's perfect timing in our lives", icon: "⏳" }
        ]
      }
    ]
  }
];

// Helper component for Add to Cart button
const GameAddToCartButton = () => {
  const { addToCart } = useCart();
  
  return (
    <Button
      onClick={() => addToCart('gaming_day_pass', 1)}
      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold"
    >
      🛒 Add to Cart
    </Button>
  );
};

// Pentecost Sale Countdown Component
const ResurrectionCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    // Pentecost 2026 is May 24, 2026 — sale/promo end date
    const pentecostDate = new Date('2026-05-24T23:59:59');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = pentecostDate - now;
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex gap-2 sm:gap-3 justify-center lg:justify-end">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' }
      ].map((item, idx) => (
        <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[60px] border border-purple-400/30">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-300">{String(item.value).padStart(2, '0')}</div>
          <div className="text-[10px] sm:text-xs text-purple-300 uppercase tracking-wide">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

const SoulFoodLanding = () => {
  const [series, setSeries] = useState(SOUL_FOOD_SERIES);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showGamingModal, setShowGamingModal] = useState(false);
  const [previewEdition, setPreviewEdition] = useState('adult');
  const [products, setProducts] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bundleEdition, setBundleEdition] = useState(null);
  const [bundleInstructorUpgrade, setBundleInstructorUpgrade] = useState(false);
  const { addToCart } = useCart();
  const youtubeRef = useRef(null);
  const playerRef = useRef(null);
  
  // Fetch products from backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/payments/products`)
      .then(res => res.json())
      .then(data => setProducts(data.products))
      .catch(err => console.error('Failed to load products:', err));
  }, []);

  // YouTube API and Intersection Observer for auto-pause
  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        events: {
          'onReady': () => {}
        }
      });
    };

    // Intersection Observer to pause when scrolled past
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && playerRef.current && playerRef.current.pauseVideo) {
            playerRef.current.pauseVideo();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (youtubeRef.current) {
      observer.observe(youtubeRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  const handleLogin = () => {
    window.location.href = '/auth';
  };

  const handleLogout = () => {
    localStorage.removeItem('soul_food_token');
    localStorage.removeItem('soul_food_user');
    localStorage.removeItem('soul_food_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('soulFoodToken');
    localStorage.removeItem('soulFoodUser');
    setCurrentUser(null);
    toast.success('Signed out');
    window.location.href = '/';
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('soul_food_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const syncAuth = () => {
      try {
        const u = localStorage.getItem('soul_food_user');
        const parsed = u ? JSON.parse(u) : null;
        setCurrentUser(prev => {
          if ((!prev && !parsed) || (prev && parsed && prev.id === parsed.id)) return prev;
          return parsed;
        });
      } catch { setCurrentUser(null); }
    };
    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    const interval = setInterval(syncAuth, 1000);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
      clearInterval(interval);
    };
  }, []);
  
  const openProductModal = (seriesData) => {
    setSelectedSeries(seriesData);
    setShowProductModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-2 sm:space-x-5">
              <img 
                src="/soul-food-logo.png" 
                alt="Soul Food Logo" 
                className="w-14 h-14 sm:w-28 sm:h-28 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                  Soul Food
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium">Kingdom Living Project</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <Button
                onClick={() => window.location.href = '/quick-order'}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl font-semibold text-sm transition-all border-2 border-slate-800 shadow-md hover:shadow-lg"
                title="Truth, Served Daily - Quick order here!"
              >
                <img 
                  src="/quick-order-rounded-60.png" 
                  alt="Quick Order" 
                  className="h-7 w-7 object-contain"
                />
                <span className="text-slate-700 font-bold">Quick Order</span>
              </Button>
              
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-full p-1">
                <ShoppingCart />
              </div>

              {currentUser ? (
                <>
                  <Button
                    onClick={() => window.location.href = '/my-library'}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-orange-300 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                    data-testid="my-library-btn"
                  >
                    My Library
                  </Button>
                  {(currentUser.role === 'admin' || currentUser.role === 'instructor') && (
                    <Button
                      onClick={() => window.location.href = currentUser.role === 'admin' ? '/admin' : '/instructor-toolbox'}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-xl font-semibold text-sm transition-all"
                      data-testid="admin-btn"
                    >
                      {currentUser.role === 'admin' ? 'Admin' : 'Toolbox'}
                    </Button>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="text-slate-500 hover:text-red-600 text-sm"
                    data-testid="logout-btn"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  data-testid="login-button"
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-3 sm:px-7 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              {/* Quick Order Button - Compact for mobile with icon INSIDE */}
              <Button
                onClick={() => window.location.href = '/quick-order'}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all border-2 border-slate-800 shadow-sm"
              >
                <img src="/quick-order-rounded-60.png" alt="Order" className="h-6 w-6 object-contain" />
                <span className="text-slate-700 font-bold">Order</span>
              </Button>
              
              {/* Shopping Cart - Better spacing for mobile */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-full p-0.5">
                <ShoppingCart />
              </div>
              
              {/* Hamburger Menu Button */}
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                className="p-2"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-orange-200 py-4 px-3 bg-white/95">
              <nav className="flex flex-col space-y-3">
                <a href="#series" className="text-slate-700 hover:text-orange-600 font-medium py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Explore Series
                </a>
                <a href="#series" className="text-slate-700 hover:text-orange-600 font-medium py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Free Sample
                </a>
                <a href="/gift-certificates" className="text-slate-700 hover:text-orange-600 font-medium py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors">
                  Gift Certificates
                </a>
                <a href="/quick-order" className="text-slate-700 hover:text-orange-600 font-medium py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors">
                  Quick Order
                </a>
                {currentUser && (
                  <>
                    <a href="/my-library" className="text-orange-700 hover:text-orange-800 font-medium py-2 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                      My Library
                    </a>
                    {(currentUser.role === 'admin' || currentUser.role === 'instructor') && (
                      <a href={currentUser.role === 'admin' ? '/admin' : '/instructor-toolbox'} className="text-purple-700 hover:text-purple-800 font-medium py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                        {currentUser.role === 'admin' ? 'Admin Console' : 'Instructor Toolbox'}
                      </a>
                    )}
                  </>
                )}
                <hr className="border-orange-200" />
                {currentUser ? (
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-600 py-3 rounded-xl font-semibold"
                    data-testid="mobile-logout-btn"
                  >
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-3 rounded-xl font-semibold shadow-lg"
                  >
                    Sign In
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Jump-to Navigation Bar */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-b border-purple-700/50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center gap-1 sm:gap-4 py-2 overflow-x-auto text-xs sm:text-sm text-white">
            <a href="#bundle-offer" className="px-3 py-1.5 hover:bg-white/10 rounded-lg whitespace-nowrap transition-colors">Bundle Deal</a>
            <span className="text-purple-400 hidden sm:inline">|</span>
            <a href="#series" className="px-3 py-1.5 hover:bg-white/10 rounded-lg whitespace-nowrap transition-colors">Holiday Series</a>
            <span className="text-purple-400 hidden sm:inline">|</span>
            <a href="#breakfast-series" className="px-3 py-1.5 hover:bg-white/10 rounded-lg whitespace-nowrap transition-colors">Breakfast</a>
            <span className="text-purple-400 hidden sm:inline">|</span>
            <a href="#gaming" className="px-3 py-1.5 hover:bg-white/10 rounded-lg whitespace-nowrap transition-colors">Games</a>
            <span className="text-purple-400 hidden sm:inline">|</span>
            <a href="#about-us" className="px-3 py-1.5 hover:bg-white/10 rounded-lg whitespace-nowrap transition-colors">About</a>
          </nav>
        </div>
      </div>

      {/* Hero Section — Conversion-Focused Above the Fold */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-30"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1759127481171-30a27de310ad?w=1200&h=800&fit=crop&crop=center')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />
        </div>
        
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            {/* Left — Message */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight text-white" data-testid="hero-headline">
                Bible Study That Sticks —<br />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  For Groups, Families & Solo Learners
                </span>
              </h1>
              
              <ul className="space-y-3 mb-6 text-base sm:text-lg text-purple-100 max-w-lg mx-auto lg:mx-0" data-testid="hero-benefits">
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">1</span>
                  <span>Interactive workbooks with built-in discussion guides</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">2</span>
                  <span>Online trivia games that reinforce every lesson</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">3</span>
                  <span>Printable cards, maps & trackers for group sessions</span>
                </li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5" data-testid="hero-ctas">
                <Button
                  onClick={() => document.getElementById('bundle-offer')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-orange-400/30 transform hover:scale-105 transition-all"
                  data-testid="hero-get-bundle-btn"
                >
                  Get the Bundle
                </Button>
                <Button
                  onClick={() => window.location.href = '/lesson/free-sample'}
                  variant="outline"
                  className="border-2 border-white/70 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm"
                  data-testid="hero-free-lesson-btn"
                >
                  Start Free Lesson
                </Button>
              </div>
              
              <p className="text-purple-300/90 text-sm italic" data-testid="hero-denomination-note">
                Non-denominational and designed for all Christian backgrounds
              </p>
              
              {/* Sale Countdown */}
              <div className="mt-5 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-amber-400 text-xs font-semibold">Early Bird Sale ends Pentecost</span>
                <ResurrectionCountdown />
              </div>
            </div>
            
            {/* Right — Book Cover + Social Proof */}
            <div className="flex-shrink-0 text-center">
              <img 
                src="/images/holiday-cover-ae.png" 
                alt="Soul Food Holiday Series" 
                className="w-44 sm:w-56 lg:w-64 rounded-xl shadow-2xl border-4 border-white/20 mx-auto"
              />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge className="bg-white/15 text-white/90 border border-white/20 text-xs px-3 py-1">Digital Instant Access</Badge>
                <Badge className="bg-white/15 text-white/90 border border-white/20 text-xs px-3 py-1">Print + Ship</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Soul Food Series Section */}
      <section id="series" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              The Soul Food Series
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Four transformative courses designed to nourish your spirit throughout the year
            </p>
            
            {/* Why Soul Food - Audio Intro */}
            <div id="about-us" className="mt-6 flex justify-center scroll-mt-32" ref={youtubeRef}>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 max-w-lg w-full border border-purple-200">
                {/* Founder Photo & Bio */}
                <div className="text-center mb-4">
                  {/* Photo - uses original image for thumbnail */}
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-purple-300 shadow-lg mb-3">
                    <img 
                      src="/images/dr-shefa-brown.png" 
                      alt="Dr. Shefa D. Brown"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center"><span class="text-4xl">🍽️</span></div>';
                      }}
                    />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Dr. Shefa D. Brown</h4>
                  <p className="text-sm text-purple-600 font-medium">Creator, Soul Food Series</p>
                </div>
                
                {/* Why Soul Food Question & Audio */}
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h5 className="font-bold text-slate-800 text-center mb-3">Why Soul Food?</h5>
                  <audio 
                    controls 
                    className="w-full"
                    style={{ filter: 'sepia(20%) saturate(70%) grayscale(0) brightness(100%) contrast(100%)' }}
                  >
                    <source src="/audio/why-soul-food.m4a" type="audio/mp4" />
                    <source src="/audio/why-soul-food.m4a" type="audio/x-m4a" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>

            {/* Multimedia Section Link */}
            <div className="mt-4 text-center">
              <a 
                href="/multimedia" 
                className="text-purple-600 hover:text-purple-800 text-sm font-medium inline-flex items-center gap-1"
              >
                <span>🎬</span> View more videos and audio content
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>
          </div>

          {/* Series Grid - Free Lesson + Holiday first, then Breakfast + Lunch, then Dinner + Supper */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-stretch">
            {/* Free Lesson Card */}
            <Card className="relative overflow-hidden border-2 border-amber-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-white flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-amber-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                  🤲 FREE
                </Badge>
              </div>
              
              <CardHeader className="relative p-0">
                <div 
                  className="w-full h-40 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=400&fit=crop&crop=center')"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 opacity-40" />
                </div>
                
                <div className="relative p-6 flex items-center space-x-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    🤲
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 mb-1">
                      Free Sample
                    </CardTitle>
                    <p className="text-sm font-semibold text-slate-600">Leap of Faith Mini-Series</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative p-6 flex flex-col flex-1">
                <p className="text-slate-700 leading-relaxed">Experience our teaching style with this platform-exclusive sample. Learn about Abel's faithful sacrifice and Enoch's consistency with God.</p>
                
                <div className="pt-4">
                  <Badge className="bg-amber-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                    🫴🏽 Try Before You Buy
                  </Badge>
                </div>
                
                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>
                
                <div className="space-y-2 pt-4 mt-auto">
                  <Button
                    onClick={() => window.location.href = '/lesson/free-sample'}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:opacity-90 shadow-lg text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    Start Free Lesson Now →
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/lesson/free-sample'}
                    variant="outline"
                    className="w-full border-2 border-amber-400 hover:border-amber-600 text-amber-700 hover:bg-amber-50 font-semibold py-2.5 rounded-lg transition-all"
                  >
                    🤲 Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Holiday Series Card */}
            {series.filter(s => s.id === 'holiday').map((s) => (
              <Card 
                key={s.id} 
                className={`relative overflow-hidden border-2 ${s.available ? 'border-purple-200' : 'border-slate-300'} ${s.available ? 'shadow-xl hover:shadow-2xl' : 'shadow-md'} transition-all duration-300 ${s.available ? 'hover:scale-[1.02]' : ''} bg-white flex flex-col`}
              >
                {!s.available && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-slate-700 text-white px-4 py-2 text-sm font-bold shadow-lg">
                      🔒 Coming {s.unlockDate}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="relative p-0">
                  <div 
                    className={`w-full h-40 bg-cover bg-center ${!s.available ? 'opacity-50 grayscale' : ''}`}
                    style={{
                      backgroundImage: `url('${s.bgImage}')`
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-40`} />
                  </div>
                  
                  <div className="relative p-6 flex items-center space-x-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm">
                    <div className={`w-16 h-16 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                      {s.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-800 mb-1">
                        {s.name}
                      </CardTitle>
                      <p className="text-sm font-semibold text-slate-600">{s.theme}</p>
                    </div>
                  </div>
                </CardHeader>
                
              <CardContent className="relative p-6 flex flex-col flex-1">
                <p className="text-slate-700 leading-relaxed">{s.description}</p>
                
                {/* Status Badge */}
                <div className="pt-2">
                  {s.available ? (
                    <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                      ✅ Available Now
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-500 text-white px-3 py-1 text-sm font-semibold">
                      🔒 Unlocks {s.unlockDate}
                    </Badge>
                  )}
                </div>
                
                {/* Audio Format Option for Holiday */}
                <div className="pt-3">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                      🎧 Audio Teachings by Pastor Mike Edwards
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-white px-2 py-1 rounded border border-purple-200 text-purple-700">1 lesson: $2.49</span>
                      <span className="bg-purple-600 text-white px-2 py-1 rounded font-semibold">All 4: $7.99 (Save 20%!)</span>
                    </div>
                    <p className="text-xs text-purple-500 mt-2 italic">📦 Physical books include audio access code!</p>
                    <p className="text-xs text-purple-400 mt-1 italic">IE includes audio at no extra cost</p>
                  </div>
                </div>
                
                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>
                
                {/* Action Buttons - Stacked like Amazon */}
                <div className="space-y-2 pt-4 mt-auto">
                  <Button
                    onClick={() => openProductModal(s)}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md"
                  >
                    🛒 Add to Cart
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/multimedia'}
                    variant="outline"
                    className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold py-2 rounded-lg"
                  >
                    🎧 Preview Audio
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setSelectedSeries(s);
                      setShowPreview(true);
                    }}
                    variant="outline"
                    className={`w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-all`}
                  >
                    {s.available ? `Explore Full Series 📚` : `Preview Coming Lessons 📖`}
                  </Button>
                </div>
              </CardContent>
              </Card>
            ))}

            {/* Breakfast and Lunch */}
            {series.filter(s => s.id === 'breakfast' || s.id === 'lunch').map((s) => (
              <Card 
                key={s.id}
                id={s.id === 'breakfast' ? 'breakfast-series' : undefined}
                className={`relative overflow-hidden border-2 ${s.available ? 'border-purple-200' : 'border-slate-300'} ${s.available ? 'shadow-xl hover:shadow-2xl' : 'shadow-md'} transition-all duration-300 ${s.available ? 'hover:scale-[1.02]' : ''} bg-white scroll-mt-32 flex flex-col`}
              >
                {!s.available && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-slate-700 text-white px-4 py-2 text-sm font-bold shadow-lg">
                      🔒 Coming {s.unlockDate}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="relative p-0">
                  <div 
                    className={`w-full h-40 bg-cover bg-center ${!s.available ? 'opacity-50 grayscale' : ''}`}
                    style={{
                      backgroundImage: `url('${s.bgImage}')`
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-40`} />
                  </div>
                  
                  <div className="relative p-6 flex items-center space-x-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm">
                    <div className={`w-16 h-16 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                      {s.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-800 mb-1">
                        {s.name}
                      </CardTitle>
                      <p className="text-sm font-semibold text-slate-600">{s.theme}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative p-6 flex flex-col flex-1">
                  <p className="text-slate-700 leading-relaxed">{s.description}</p>
                  
                  {/* Status Badge */}
                  <div className="pt-2">
                    {s.available ? (
                      <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                        ✅ Available Now
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500 text-white px-3 py-1 text-sm font-semibold">
                        🔒 Unlocks {s.unlockDate}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-grow"></div>
                  
                  {/* Action Buttons - Stacked like Amazon */}
                  <div className="space-y-2 pt-4 mt-auto">
                    <Button
                      onClick={() => openProductModal(s)}
                      className={`w-full ${s.available 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'} text-white font-semibold py-3 rounded-lg transition-all shadow-md`}
                    >
                      🛒 {(s.id === 'breakfast' || s.id === 'holiday') ? 'Add to Cart' : 'Order Book'}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setSelectedSeries(s);
                        setShowPreview(true);
                      }}
                      variant="outline"
                      className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-all"
                    >
                      {s.available ? `Explore Full Series 📚` : `Preview Coming Lessons 📖`}
                    </Button>
                    
                    {/* Interactive Lessons Link - Only for available series */}
                    {s.available && (
                      <Button
                        onClick={() => window.location.href = '/snack-packs'}
                        variant="outline"
                        className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold py-2 rounded-lg"
                      >
                        ✨ Try Interactive Lessons
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Dinner and Supper */}
            {series.filter(s => s.id === 'dinner' || s.id === 'supper').map((s) => (
              <Card 
                key={s.id} 
                className={`relative overflow-hidden border-2 ${s.available ? 'border-purple-200' : 'border-slate-300'} ${s.available ? 'shadow-xl hover:shadow-2xl' : 'shadow-md'} transition-all duration-300 ${s.available ? 'hover:scale-[1.02]' : ''} bg-white flex flex-col`}
              >
                {!s.available && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-slate-700 text-white px-4 py-2 text-sm font-bold shadow-lg">
                      🔒 Coming {s.unlockDate}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="relative p-0">
                  <div 
                    className={`w-full h-40 bg-cover bg-center ${!s.available ? 'opacity-50 grayscale' : ''}`}
                    style={{
                      backgroundImage: `url('${s.bgImage}')`
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-40`} />
                  </div>
                  
                  <div className="relative p-6 flex items-center space-x-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm">
                    <div className={`w-16 h-16 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                      {s.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-800 mb-1">
                        {s.name}
                      </CardTitle>
                      <p className="text-sm font-semibold text-slate-600">{s.theme}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative p-6 flex flex-col flex-1">
                  <p className="text-slate-700 leading-relaxed">{s.description}</p>
                  
                  {/* Status Badge */}
                  <div className="pt-2">
                    {s.available ? (
                      <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                        ✅ Available Now
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500 text-white px-3 py-1 text-sm font-semibold">
                        🔒 Unlocks {s.unlockDate}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-grow"></div>
                  
                  {/* Action Buttons - Stacked like Amazon */}
                  <div className="space-y-2 pt-4 mt-auto">
                    <Button
                      onClick={() => openProductModal(s)}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md"
                    >
                      🛒 Order Book
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setSelectedSeries(s);
                        setShowPreview(true);
                      }}
                      variant="outline"
                      className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-all"
                    >
                      {s.available ? `Explore Full Series 📚` : `Preview Coming Lessons 📖`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Holiday Series Highlight */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    ✡️
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-800">Holiday Series</h4>
                    <p className="text-slate-600">The 4 C's of Christianity</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white px-6 py-3 text-base font-bold">
                  ✨ Available Now!
                </Badge>
              </div>
              <p className="mt-4 text-slate-700">
                Celebrate your faith through the seasons with special lessons on <strong>The Covenant</strong>, <strong>The Cradle</strong>, <strong>The Cross</strong>, and <strong>The Comforter</strong>.
              </p>
              <div className="mt-4 space-y-3">
                {/* Game Pass Certificate */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <p className="text-amber-900 font-semibold flex items-center">
                    <span className="text-2xl mr-2">🎮</span>
                    <span>Includes Gift Certificate for 8-Hour Game Pass!</span>
                  </p>
                  <p className="text-sm text-amber-700 mt-1 ml-9">
                    Perfect for testing your knowledge while celebrating the season
                  </p>
                </div>
                
                {/* Delivery Notice */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <p className="text-blue-900 font-semibold flex items-center">
                    <span className="text-xl mr-2">📦</span>
                    <span>Paperback Delivery: Ships in 2-3 weeks</span>
                  </p>
                  <p className="text-sm text-blue-700 mt-1 ml-8">
                    US delivery typically 2-3 weeks from order (timing depends on shipping option selected)
                  </p>
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <Button
                  onClick={() => {
                    const holidaySeries = SOUL_FOOD_SERIES.find(s => s.id === 'holiday');
                    if (holidaySeries) {
                      setSelectedSeries(holidaySeries);
                      setShowPreview(true);
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg"
                >
                  View Lessons 📖
                </Button>
                <Button
                  onClick={() => {
                    const holidaySeries = SOUL_FOOD_SERIES.find(s => s.id === 'holiday');
                    if (holidaySeries) openProductModal(holidaySeries);
                  }}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg"
                >
                  🛒 Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* === BUNDLE OFFER SECTION === */}
      <section id="bundle-offer" className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 scroll-mt-24" data-testid="bundle-offer-section">
        <div className="container mx-auto max-w-4xl">
          <div className="relative bg-white rounded-2xl border-2 border-amber-300 shadow-2xl overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-0 right-0 z-10">
              <div className="bg-gradient-to-l from-red-600 to-orange-600 text-white px-6 py-2 text-sm font-bold rounded-bl-xl shadow-lg" data-testid="best-value-badge">
                Best Value
              </div>
            </div>
            
            <div className="p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left — Bundle Details */}
                <div className="flex-1">
                  <Badge className="bg-amber-100 text-amber-800 mb-3 text-xs font-semibold">Starter Bundle</Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2" data-testid="bundle-title">
                    4C's + Break*fast Starter Bundle
                  </h3>
                  <p className="text-slate-500 mb-5 text-sm sm:text-base">Everything you need to launch your first two Soul Food study seasons.</p>
                  
                  {/* What's Included */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Holiday 4C's — Full Digital Workbook</p>
                        <p className="text-xs text-slate-500">Covenant, Cradle, Cross, Comforter — 12 interactive lessons</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Break*fast Series — Month 1 Snack Pack (SP1)</p>
                        <p className="text-xs text-slate-500">Prayer Is the First Resort — 4-week SP1 module</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">1-Hour Online Game Pass</p>
                        <p className="text-xs text-slate-500">Jeopardy and Millionaire-styled games for both series</p>
                      </div>
                    </div>
                    {bundleInstructorUpgrade && (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-indigo-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-indigo-800 text-sm">Upgraded to 3-Hour Online Game Pass</p>
                            <p className="text-xs text-slate-500">Extended session time for group and classroom play</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-indigo-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-indigo-800 text-sm">Offline Game Pack</p>
                            <p className="text-xs text-slate-500">Printable questions & answers for group facilitation</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Edition Selector */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Select Edition <span className="text-red-500">*</span>
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBundleEdition('ae')}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          bundleEdition === 'ae'
                            ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm ring-2 ring-purple-200'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                        data-testid="bundle-edition-ae"
                      >
                        Adult Edition (AE)
                      </button>
                      <button
                        onClick={() => setBundleEdition('ye')}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          bundleEdition === 'ye'
                            ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm ring-2 ring-purple-200'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                        data-testid="bundle-edition-ye"
                      >
                        Youth Edition (YE)
                      </button>
                    </div>
                    {!bundleEdition && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1" data-testid="bundle-edition-hint">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Please select Adult Edition or Youth Edition above
                      </p>
                    )}
                  </div>

                  {/* Instructor Upgrade */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-5 ${
                      bundleInstructorUpgrade
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    data-testid="instructor-upgrade-label"
                  >
                    <input
                      type="checkbox"
                      checked={bundleInstructorUpgrade}
                      onChange={(e) => setBundleInstructorUpgrade(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      data-testid="instructor-upgrade-checkbox"
                    />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        Upgrade to Instructor Bundle
                        <span className="ml-1.5 text-indigo-600 font-bold">(+$7)</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Includes IE content, 3-hour online game pass, and offline game pack for teaching and group facilitation.</p>
                    </div>
                  </label>

                  {/* Order Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200" data-testid="bundle-order-summary">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Order Summary</p>
                    <div className="space-y-1.5 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>Holiday Bundle – {bundleEdition ? (bundleEdition === 'ae' ? 'Adult Edition (AE)' : 'Youth Edition (YE)') : <span className="text-amber-600 italic">Select edition above</span>} – ePub</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Break*fast Bundle – {bundleEdition ? (bundleEdition === 'ae' ? 'Adult Edition (AE)' : 'Youth Edition (YE)') : <span className="text-amber-600 italic">Select edition above</span>} – ePub</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-xs pt-1 border-t border-slate-200 mt-1">
                        <span>{bundleInstructorUpgrade ? '3-Hour Online Game Pass' : '1-Hour Online Game Pass'}</span>
                        <span className="text-green-600 font-medium">Included</span>
                      </div>
                      {bundleInstructorUpgrade && (
                        <>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Offline Game Pack (Q&A for group facilitation)</span>
                            <span className="text-green-600 font-medium">Included</span>
                          </div>
                          <div className="flex justify-between text-indigo-700 font-medium text-sm pt-1 border-t border-slate-200 mt-1">
                            <span>Upgraded to Instructor Bundle (Includes IE)</span>
                            <span>+$7.00</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right — Price + CTA */}
                <div className="w-full lg:w-72 flex-shrink-0 text-center lg:text-left lg:sticky lg:top-28">
                  <div className="bg-gradient-to-br from-purple-50 to-amber-50 rounded-xl p-6 border border-purple-200">
                    <p className="text-sm text-slate-500 line-through mb-1">{bundleInstructorUpgrade ? '$33.98' : '$26.98'} if bought separately</p>
                    <div className="flex items-baseline justify-center lg:justify-start gap-1.5 mb-1">
                      <span className="text-4xl font-bold text-slate-900" data-testid="bundle-price">${bundleInstructorUpgrade ? '28.99' : '21.99'}</span>
                      <span className="text-sm text-slate-500">USD</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs mb-4">{bundleInstructorUpgrade ? 'Save $4.99 + IE included' : 'Save $4.99'}</Badge>
                    
                    <Button
                      onClick={() => {
                        if (!bundleEdition) {
                          toast.error('Please select Adult Edition or Youth Edition before adding this bundle.');
                          return;
                        }
                        const price = bundleInstructorUpgrade ? 28.99 : 21.99;
                        const edLabel = bundleEdition === 'ae' ? 'Adult' : 'Youth';
                        const name = bundleInstructorUpgrade
                          ? `4C's + Break*fast Starter Bundle (${edLabel} + Instructor)`
                          : `4C's + Break*fast Starter Bundle (${edLabel})`;
                        addToCart({
                          id: `starter-bundle-4cs-bkft-${bundleEdition}${bundleInstructorUpgrade ? '-ie' : ''}`,
                          name,
                          price,
                          quantity: 1,
                          isBundle: true,
                          edition: bundleEdition,
                          editionLabel: edLabel,
                        });
                        toast.success('Bundle added to cart!');
                      }}
                      disabled={!bundleEdition}
                      className={`w-full py-4 rounded-xl text-base font-bold shadow-xl transition-all mb-3 ${
                        bundleEdition
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-orange-300/40 transform hover:scale-[1.03]'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      }`}
                      data-testid="bundle-buy-btn"
                    >
                      {bundleEdition ? `Buy Now — $${bundleInstructorUpgrade ? '28.99' : '21.99'}` : 'Select Edition to Continue'}
                    </Button>
                    {!bundleEdition && (
                      <p className="text-xs text-red-500 text-center font-medium" data-testid="bundle-no-edition-error">
                        Please select Adult Edition or Youth Edition before adding this bundle.
                      </p>
                    )}
                    {bundleEdition && <p className="text-xs text-slate-400 text-center">Instant digital delivery</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gaming Central Section */}
      <section id="gaming" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 scroll-mt-32">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <img 
              src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/k75fu34t_Gaming%20Central%20Test%20Your%20Knowledge%20Logo.png"
              alt="Gaming Central"
              className="h-24 mx-auto mb-6"
            />
            <h3 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Gaming Central
            </h3>
            <p className="text-xl text-purple-300 max-w-3xl mx-auto mb-4">
              Test your Soul Food knowledge with three epic Bible trivia games!
            </p>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 text-base font-bold">
              🎮 Mid-Year Review Games
            </Badge>
          </div>

          {/* Youth Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 text-lg font-bold shadow-lg mb-4">
                🎮 Youth Edition (Ages 12-20)
              </Badge>
              <h4 className="text-3xl font-bold text-white mb-2">🧢✨ Games for Young Believers</h4>
              <p className="text-purple-300">Engage your youth group with fun, age-appropriate Bible trivia!</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trivia Mix-up Youth */}
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-4 border-cyan-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold shadow-lg">
                    DEMO
                  </Badge>
                </div>
                <CardHeader className="p-0">
                  <div className="h-44 bg-white/90 flex items-center justify-center p-4">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/4jh8a4ad_Soul%20Food%20Trivia%20Mix-up%20Logo.png"
                      alt="Trivia Mix-up Youth"
                      className="h-32 w-auto object-contain"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-2xl font-bold text-slate-800">Trivia Mix-up</h4>
                    <span className="text-3xl">🎮</span>
                  </div>
                  <p className="text-sm font-semibold text-cyan-600 mb-3">Youth Edition - Millionaire Style</p>
                  <p className="text-slate-700 mb-4">
                    15-question progressive climb designed for ages 12-20! Test your Soul Food knowledge with lifelines and fun.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs">Practice Mode</Badge>
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs">Youth Challenge</Badge>
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs">Fun Mode</Badge>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/game/mixup?edition=youth'}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl"
                  >
                    Play Now →
                  </Button>
                </CardContent>
              </Card>

              {/* Tricky Testaments Youth */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-purple-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-yellow-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                    DEMO
                  </Badge>
                </div>
                <CardHeader className="p-0">
                  <div className="h-44 bg-white/90 flex items-center justify-center p-4">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/dgncbaxl_Soul%20Food%27s%20Tricky%20Testaments%20-%20Bold%20Modern%20%281%29.png"
                      alt="Tricky Testaments Youth"
                      className="h-36 w-auto object-contain"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-2xl font-bold text-slate-800">Tricky Testaments</h4>
                    <span className="text-3xl">🎮</span>
                  </div>
                  <p className="text-sm font-semibold text-purple-600 mb-3">Youth Edition - Jeopardy Style</p>
                  <p className="text-slate-700 mb-4">
                    Pick categories, answer in question form, and climb the board! Jeopardy-style fun for ages 12-20.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Single Player</Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Challenge Mode</Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Class Mode</Badge>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/game/tricky-testament?edition=youth'}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl"
                  >
                    Play Now →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Adult Section */}
          <div className="mb-10">
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 text-lg font-bold shadow-lg mb-4">
                📚 Adult Edition (Ages 21+)
              </Badge>
              <h4 className="text-3xl font-bold text-white mb-2">Games for Mature Believers</h4>
              <p className="text-purple-300">Challenge yourself with deeper theological questions and serious Bible scholarship!</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trivia Mix-up Adult */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-orange-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold shadow-lg">
                  DEMO
                </Badge>
              </div>
              <CardHeader className="p-0">
                <div className="h-44 bg-white/90 flex items-center justify-center p-4">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/bovn8pyf_Soul%20Food%20Trivia%20Logo%20-%20Vintage%20Style%20%282%29.png"
                    alt="Trivia Mix-up"
                    className="h-32 w-auto object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-2xl font-bold text-slate-800">Trivia Mix-up</h4>
                  <span className="text-3xl">🎯</span>
                </div>
                <p className="text-sm font-semibold text-orange-600 mb-3">Adult Edition - Millionaire Style</p>
                <p className="text-slate-700 mb-4">
                  15-question progressive climb with lifelines! Test your Soul Food knowledge like "Who Wants to Be a Millionaire."
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Practice Mode</Badge>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Quarter Challenge</Badge>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Millionaire Mode</Badge>
                </div>
                <Button
                  onClick={() => window.location.href = '/game/mixup?edition=adult'}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 rounded-xl"
                >
                  Play Now →
                </Button>
              </CardContent>
            </Card>

            {/* Tricky Testaments Adult */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-amber-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-yellow-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                  DEMO
                </Badge>
              </div>
              <CardHeader className="p-0">
                <div className="h-44 bg-white/90 flex items-center justify-center p-4">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/29d8ivo6_Soul%20Food%27s%20Tricky%20Testaments%20Logo%20%281%29.png"
                    alt="Tricky Testaments Adult"
                    className="h-36 w-auto object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-2xl font-bold text-slate-800">Tricky Testaments</h4>
                  <span className="text-3xl">📚</span>
                </div>
                <p className="text-sm font-semibold text-amber-700 mb-3">Adult Edition - Jeopardy Style</p>
                <p className="text-slate-700 mb-4">
                  Classic Jeopardy with deeper theological questions and higher stakes! For serious Bible scholars.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Single Player</Badge>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Daily Double</Badge>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Final Jeopardy</Badge>
                </div>
                <Button
                  onClick={() => window.location.href = '/game/tricky-testament?edition=adult'}
                  className="w-full bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-800 hover:to-yellow-800 text-white font-bold py-3 rounded-xl"
                >
                  Play Now →
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Gaming Access Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-400">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-white mb-4">🎯 Game Access Options</h4>
              <div className="grid md:grid-cols-3 gap-6 text-white">
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-4xl mb-2">👀</div>
                  <div className="font-bold text-lg mb-1">Free Preview</div>
                  <div className="text-sm text-purple-200 mb-4">5 questions • 1 game</div>
                  <Button
                    onClick={() => window.location.href = '/game/mixup?edition=youth'}
                    className="w-full bg-white/20 hover:bg-white/30 text-white"
                  >
                    Try Now
                  </Button>
                </div>
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border-2 border-yellow-400">
                  <div className="text-4xl mb-2">🎟️</div>
                  <div className="font-bold text-lg mb-1">Gaming Day Pass</div>
                  <div className="text-xs line-through text-purple-200">$40.00</div>
                  <div className="text-2xl font-bold text-yellow-400 mb-2">$29.99</div>
                  <div className="text-sm text-purple-200 mb-4">24 hours • All games • Unlimited</div>
                  <GameAddToCartButton />
                </div>
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-4xl mb-2">👑</div>
                  <div className="font-bold text-lg mb-1">Coming Soon</div>
                  <div className="text-sm text-purple-200 mb-4">Full access • Leaderboards • Badges</div>
                  <Button
                    disabled
                    className="w-full bg-white/10 text-white opacity-50 cursor-not-allowed"
                  >
                    Notify Me
                  </Button>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => setShowGamingModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-xl text-base sm:text-lg shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto max-w-md"
                >
                  Enter Gaming Central →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gaming Edition Selection Modal */}
      {showGamingModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowGamingModal(false)}>
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border-2 border-purple-400" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="text-center mb-8">
              <img 
                src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/k75fu34t_Gaming%20Central%20Test%20Your%20Knowledge%20Logo.png"
                alt="Gaming Central"
                className="w-24 h-24 mx-auto mb-4 rounded-2xl"
              />
              <h3 className="text-3xl font-bold text-white mb-2">Choose Your Edition</h3>
              <p className="text-purple-200">Select the age-appropriate game experience</p>
            </div>
            
            {/* Edition Buttons */}
            <div className="space-y-4">
              {/* Youth Edition */}
              <button
                onClick={() => {
                  setShowGamingModal(false);
                  window.location.href = '/gaming-central?edition=youth';
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl p-6 flex items-center gap-4 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <div className="text-5xl">🧢✨</div>
                <div className="text-left flex-1">
                  <div className="text-2xl font-bold">Youth Edition</div>
                  <div className="text-cyan-100 text-sm">Ages 12-20 • Family-friendly content</div>
                </div>
                <div className="text-3xl">→</div>
              </button>
              
              {/* Adult Edition */}
              <button
                onClick={() => {
                  setShowGamingModal(false);
                  window.location.href = '/gaming-central?edition=adult';
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl p-6 flex items-center gap-4 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <div className="text-5xl">👨</div>
                <div className="text-left flex-1">
                  <div className="text-2xl font-bold">Adult Edition</div>
                  <div className="text-orange-100 text-sm">Ages 18+ • Deeper theological content</div>
                </div>
                <div className="text-3xl">→</div>
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowGamingModal(false)}
              className="mt-6 w-full text-purple-300 hover:text-white py-3 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Holiday Box Set Section */}
      {/* Holiday Box Set Section - Available Now */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 text-base font-bold shadow-2xl">
              ✨ NOW AVAILABLE
            </Badge>
            <h3 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Start Your Journey Today
            </h3>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Interactive lessons, eBooks & digital downloads available now. Print workbooks ship within 2-3 weeks!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Digital Access - Available Now */}
            <Card className="border-4 border-emerald-300 shadow-2xl overflow-hidden hover:scale-105 transition-all">
              <CardHeader className="bg-gradient-to-br from-emerald-100 to-teal-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Interactive Digital Bundle
                  </CardTitle>
                  <span className="text-4xl">✨</span>
                </div>
                <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs">Available Now</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4">
                  <h5 className="font-bold text-emerald-800 mb-2">🎯 What's Included:</h5>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Interactive Lessons</strong> - Engaging online experience</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Progress Tracking</strong> - Games, quizzes & achievements</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>Downloadable eBooks</strong> - PDF workbooks included</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>Community Access</strong> - Discussion forums & support</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase">ePub</p>
                      <div className="text-2xl font-bold text-indigo-600">${selectedSeries?.available ? '14.99' : '24.99'}</div>
                    </div>
                    <div className="text-slate-400">or</div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase">Physical</p>
                      <div className="text-2xl font-bold text-purple-600">${selectedSeries?.available ? '16.99' : '27.99'}</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mt-2">
                    {selectedSeries?.available ? 'Instant Download Available' : 'Pre-Order — $3 Off'}
                  </Badge>
                </div>

                <Button 
                  onClick={() => window.location.href = '/quick-order'}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all"
                >
                  Get Digital Access Now →
                </Button>
              </CardContent>
            </Card>

            {/* Print - Ships Easter to Resurrection Sunday */}
            <Card className="border-4 border-amber-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-sm font-bold z-10 shadow-xl rotate-12">
                Ships by Resurrection Sunday
              </Badge>
              <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Print Workbook Bundle
                  </CardTitle>
                  <span className="text-4xl">📚</span>
                </div>
                <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs">Order Now</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <h5 className="font-bold text-amber-800 mb-2">📦 Bundle Includes:</h5>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span><strong>Physical Workbooks</strong> - High-quality spiral-bound</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span><strong>FREE Instant eBook</strong> - Start reading immediately!</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span><strong>All 48 Lessons</strong> - Complete Break*fast + Holiday series</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Adult, Youth, or Instructor editions available</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <p className="text-lg text-slate-500 line-through mb-1">Reg. $49.99</p>
                  <div className="text-4xl font-bold text-amber-600 mb-2">
                    $39.99
                  </div>
                  <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mt-2">
                    Save $10 - Physical + Digital Bundle!
                  </Badge>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-slate-700">
                  <p className="font-semibold">📦 Ships Easter - Resurrection Sunday</p>
                  <p className="text-xs mt-1">Perfect for personal or group Bible study!</p>
                  <p className="text-xs mt-1 text-purple-600 font-medium">🎧 Instructor Edition bundles available by Tuesday</p>
                </div>

                <Button 
                  onClick={() => window.location.href = '/quick-order'}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all"
                >
                  Order Print Workbook →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Purchase Tiers */}
          <Card id="bulk-orders" className="border-4 border-purple-300 shadow-2xl bg-gradient-to-br from-purple-50 to-indigo-50 scroll-mt-32">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h4 className="text-3xl font-bold text-slate-800 mb-2">
                  🎯 Bulk Purchase Discounts
                </h4>
                <p className="text-slate-600">Perfect for book clubs, churches, schools, or corporate gifts</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Book Club Special */}
                <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-2xl">
                      📖
                    </div>
                    <h5 className="text-xl font-bold text-slate-800 mb-1">Book Club Special</h5>
                    <p className="text-sm text-slate-600">5-9 Sets</p>
                  </div>
                  <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
                    <div className="text-3xl font-bold text-blue-600">10% OFF</div>
                    <p className="text-sm text-slate-600 mt-1">$35.99 per set</p>
                  </div>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500">✓</span>
                      <span>Perfect for small groups</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500">✓</span>
                      <span>All pre-order bonuses</span>
                    </li>
                  </ul>
                </div>

                {/* Small Bulk Order */}
                <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg relative">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 text-xs font-bold">
                    Most Popular
                  </Badge>
                  <div className="text-center mb-4 mt-2">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-2xl">
                      📚
                    </div>
                    <h5 className="text-xl font-bold text-slate-800 mb-1">Small Bulk Order</h5>
                    <p className="text-sm text-slate-600">10-24 Sets</p>
                  </div>
                  <div className="text-center py-4 bg-purple-50 rounded-lg mb-4">
                    <div className="text-3xl font-bold text-purple-600">15% OFF</div>
                    <p className="text-sm text-slate-600 mt-1">$33.99 per set</p>
                  </div>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-center space-x-2">
                      <span className="text-purple-500">✓</span>
                      <span>Great for churches</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-purple-500">✓</span>
                      <span>All pre-order bonuses</span>
                    </li>
                  </ul>
                </div>

                {/* Mega Bulk Order */}
                <div className="bg-white rounded-xl p-6 border-2 border-orange-300 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-2xl">
                      🏢
                    </div>
                    <h5 className="text-xl font-bold text-slate-800 mb-1">Mega Bulk Order</h5>
                    <p className="text-sm text-slate-600">25+ Sets</p>
                  </div>
                  <div className="text-center py-4 bg-orange-50 rounded-lg mb-4">
                    <div className="text-3xl font-bold text-orange-600">20% OFF</div>
                    <p className="text-sm text-slate-600 mt-1">$31.99 per set</p>
                  </div>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-center space-x-2">
                      <span className="text-orange-500">✓</span>
                      <span>Schools & organizations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-orange-500">✓</span>
                      <span><strong>FREE SHIPPING!</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <Button 
                  onClick={() => toast.success("Bulk order form opening soon!")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold px-6 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-xl text-base sm:text-lg shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto max-w-md"
                >
                  Request Bulk Quote →
                </Button>
                <p className="text-sm text-slate-600 mt-3 text-center">
                  Need more than 25 sets? <a href="#" className="text-purple-600 font-semibold hover:underline">Contact us for custom pricing</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Editions Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Three-Track Learning System
            </h3>
            <p className="text-xl text-slate-600 mb-4">
              Choose the path that fits your spiritual journey
            </p>
            <p className="text-sm text-slate-500 max-w-3xl mx-auto mb-6">
              All lessons use the WEB (World English Bible) version for clarity and accessibility, 
              helping you focus on core principles without navigating Old English.
            </p>
            
            {/* Pricing Clarity Notice - Available Now */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✨</span>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 mb-2">✝️ Soul Food Is LIVE!</h4>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Holiday Series:</strong> All editions available now — digital downloads + physical books (ships 2-3 weeks).</p>
                    <p><strong>Break*fast Pre-Order ($3 off full workbooks):</strong> Month 1 "Prayer the First Resort" nibbles & snack packs available now. Full workbooks ship soon!</p>
                    <p><strong>Lunch Pre-Order ($3 off until Pentecost):</strong> Ships May-June 2026.</p>
                    <p><strong>🎮 Game Passes 20% Off — No Coupon Needed!</strong> Through Pentecost (May 24, 2026).</p>
                    <p className="font-semibold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg mt-3">Get started today — Holiday digital downloads available instantly!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Adult Edition */}
            <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all flex flex-col">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 text-center p-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  👤
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  Adult Edition (AE)
                </CardTitle>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  $9.99<span className="text-lg text-slate-600">/mo</span>
                </div>
                <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mb-2">All quarterly releases included</Badge>
                <p className="text-sm text-slate-600">eBook: $31.99 (current content only)</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <p className="text-sm text-slate-600 mb-4 italic">
                  Core lessons using WEB Bible for clarity and modern understanding
                </p>
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">All Soul Food series lessons</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Interactive workbook format</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Monthly audible prayers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Theme-based videos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">General audio files per meal series</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Community discussion access</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Youth Edition */}
            <Card className="border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all flex flex-col">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 text-center p-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  🎓
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  Youth Edition (YE)
                </CardTitle>
                <p className="text-sm text-purple-600 font-semibold mb-2">Ages 12-20</p>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  $9.99<span className="text-lg text-slate-600">/mo</span>
                </div>
                <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mb-2">All quarterly releases included</Badge>
                <p className="text-sm text-slate-600">eBook: $31.99 (current content only)</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <p className="text-sm text-slate-600 mb-4 italic">
                  Age-appropriate content with WEB Bible, designed for young believers
                </p>
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Youth-focused Soul Food lessons</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Engaging interactive activities</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Monthly youth-targeted prayers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Youth-specific videos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Audio content for each meal theme</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Peer community & parent resources</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Edition */}
            <Card className="border-2 border-orange-300 shadow-xl hover:shadow-2xl transition-all relative flex flex-col">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-1 font-bold text-sm">
                For Teachers & Leaders
              </Badge>
              <CardHeader className="bg-gradient-to-br from-orange-50 to-amber-50 text-center p-6 pt-8">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  📖
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  Instructor Edition (IE)
                </CardTitle>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  $14.99<span className="text-lg text-slate-600">/mo</span>
                </div>
                <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mb-2">All released quarterly content included.</Badge>
                <p className="text-sm text-slate-600">eBook: $68.99 (current content only)</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <p className="text-sm text-slate-600 mb-4 italic font-semibold">
                  Complete teaching toolkit for facilitating Adult or Youth classes
                </p>
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">All AE & YE content included</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm"><strong>Math connections</strong> to biblical concepts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm"><strong>Dual scripture view</strong> for comparison</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm"><strong>Historical references</strong> for rich context</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Teaching guides & answer keys</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Discussion prompts & facilitation tips</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">All available multimedia content (audio; video as released).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Downloadable teaching materials</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 mt-auto">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Subscription vs eBook Comparison — COMING SOON */}
          <div className="mt-12 relative">
            {/* "Construction Fence" overlay */}
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
              <div className="text-center px-8 py-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-2xl shadow-2xl border-4 border-amber-600 transform -rotate-1">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl">🚧</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase" style={{textShadow: '2px 2px 0 rgba(0,0,0,0.2)'}}>Coming Soon!</h3>
                  <span className="text-3xl">🚧</span>
                </div>
                <p className="text-amber-900 font-semibold text-sm sm:text-base">Monthly & Annual Subscription Plans</p>
                <p className="text-amber-800 text-xs mt-1">Unlimited access to all content, games, and new releases</p>
              </div>
            </div>
            
            {/* Blurred content behind the fence */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-lg opacity-50 pointer-events-none select-none">
              <h4 className="text-2xl font-bold text-center mb-6 text-slate-800">
                Subscription vs. eBook - What's the Difference?
              </h4>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border-2 border-emerald-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">✓</span>
                    </div>
                    <h5 className="text-xl font-bold text-slate-800">Monthly Subscription</h5>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start space-x-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>All series unlocked automatically</span></li>
                    <li className="flex items-start space-x-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>Games, multimedia & new content included</span></li>
                    <li className="flex items-start space-x-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>Cancel anytime, no commitment</span></li>
                  </ul>
                  <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-800">Best for: Year-long journey with all updates</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border-2 border-slate-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">📕</span>
                    </div>
                    <h5 className="text-xl font-bold text-slate-800">One-Time eBook</h5>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start space-x-2"><span className="text-slate-600 font-bold mt-0.5">✓</span><span>Downloadable PDF, keep forever</span></li>
                    <li className="flex items-start space-x-2"><span className="text-slate-600 font-bold mt-0.5">✓</span><span>Print at home or read offline</span></li>
                    <li className="flex items-start space-x-2"><span className="text-amber-600 font-bold mt-0.5">⚠️</span><span>Each series purchased separately</span></li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800">Best for: Single quarter study or gift giving</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multimedia Content Explanation */}
          <div className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-orange-200">
            <h4 className="text-2xl font-bold text-center mb-6 text-slate-800">
              📱 Rich Multimedia Learning Experience
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎧
                </div>
                <h5 className="font-bold text-slate-800 mb-2">Audible Prayers</h5>
                <p className="text-sm text-slate-600">
                  Monthly prayers tailored to your target group (Adult or Youth) to enhance your devotional time
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎵
                </div>
                <h5 className="font-bold text-slate-800 mb-2">Meal Theme Audio</h5>
                <p className="text-sm text-slate-600">
                  General audio files for each Soul Food series (Break*fast, Lunch, Dinner, Supper) plus bonus content
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎥
                </div>
                <h5 className="font-bold text-slate-800 mb-2">Teaching Videos</h5>
                <p className="text-sm text-slate-600">
                  Separate videos for Adult and Youth editions that complement each month's theme with visual teaching
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
              👥 Our Family
            </Badge>
            <h3 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Meet the Kingdom Soul Team
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Four ordained ministers dedicated to spiritual nourishment
            </p>
          </div>

          {/* Dr. Shefa D. Brown - Featured at top center */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-purple-300 max-w-sm">
              <div className="h-72 overflow-hidden">
                <img 
                  src="/images/dr-shefa-brown-smile.png" 
                  alt="Dr. Shefa D. Brown"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 text-center bg-gradient-to-br from-purple-50 to-indigo-50">
                <h4 className="text-xl font-bold text-slate-800 mb-1">Dr. Shefa D. Brown</h4>
                <p className="text-sm text-slate-500 font-medium">Kingdom Soul Team</p>
              </div>
            </div>
          </div>

          {/* Rose, Temia, Mike - in a row */}
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {/* Evangelist Rose Doctor - Left */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100">
              <div className="h-64 overflow-hidden">
                <img 
                  src="/images/team/evang-rose-doctor.jpg" 
                  alt="Evangelist Rose Doctor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 text-center">
                <h4 className="text-xl font-bold text-slate-800 mb-1">Evangelist Rose Doctor</h4>
                <p className="text-sm text-slate-500 font-medium">Kingdom Soul Team</p>
              </div>
            </div>

            {/* Pastor Temia Julius - Center */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100">
              <div className="h-64 overflow-hidden">
                <img 
                  src="/images/team/dr-temia-julius.jpg" 
                  alt="Pastor Temia Julius, Ph.D."
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 text-center">
                <h4 className="text-xl font-bold text-slate-800 mb-1">Pastor Temia Julius, Ph.D.</h4>
                <p className="text-sm text-slate-500 font-medium">Kingdom Soul Team</p>
              </div>
            </div>

            {/* Pastor Mike Edwards - Right */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100">
              <div className="h-64 overflow-hidden">
                <img 
                  src="/images/team/pastor-mike-edwards.jpg" 
                  alt="Pastor Mike Edwards"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 text-center">
                <h4 className="text-xl font-bold text-slate-800 mb-1">Pastor Mike Edwards</h4>
                <p className="text-sm text-slate-500 font-medium">Kingdom Soul Team</p>
              </div>
            </div>
          </div>

          {/* Link to About Us page */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-purple-100 rounded-2xl p-8 max-w-3xl mx-auto border border-purple-200">
              <p className="text-lg text-slate-700 italic mb-4">
                "Together, we're committed to nourishing souls with God's Word—one lesson, one family, one community at a time."
              </p>
              <p className="text-purple-600 font-semibold mb-6">— The Kingdom Soul Team</p>
              <Button
                onClick={() => window.location.href = '/about-us'}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Learn More About Us →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/soul-food-logo.png" 
              alt="Soul Food Logo" 
              className="w-14 h-14 object-contain"
            />
            <div className="text-left">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Soul Food
              </h3>
              <p className="text-sm text-slate-400">Kingdom Living Project</p>
            </div>
          </div>
          <p className="text-slate-400 mb-2 text-lg">
            Spiritual nourishment for every season of life - one meal at a time
          </p>
          <p className="text-amber-400 font-semibold text-sm mb-6">
            Start now. Grow with us. Full releases coming soon.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-slate-500 text-sm">
              © 2025 Kingdom Living Project. All rights reserved.
            </p>
          </div>
          
          {/* Emergent Badge */}
          <div className="mt-6 flex justify-center">
            <a
              href="https://app.emergent.sh/?utm_source=emergent-badge"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-300 transition-colors duration-200 text-xs"
            >
              <img
                src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4"
                alt="Emergent"
                className="w-4 h-4 rounded"
              />
              <span>Made with Emergent</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Series Preview Modal */}
      {showPreview && selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header with Gradient */}
            <div className={`relative bg-gradient-to-br ${selectedSeries.gradient} p-8 text-white`}>
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm transition-all hover:scale-110"
              >
                ×
              </button>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                  {selectedSeries.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedSeries.name}</h2>
                  <p className="text-white/90 text-lg font-medium">{selectedSeries.theme}</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-sm font-semibold text-white/80 mb-1">📖 Series Overview</p>
                <p className="text-lg">{selectedSeries.description}</p>
              </div>
            </div>

            {/* Content - Multiple Themes */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-280px)]">
              {/* Edition Toggle */}
              {selectedSeries.available && (
                <div className="mb-6 flex justify-center">
                  <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1">
                    <button
                      onClick={() => setPreviewEdition && setPreviewEdition('adult')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        (!previewEdition || previewEdition === 'adult')
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      👨 Adult Edition
                    </button>
                    <button
                      onClick={() => setPreviewEdition && setPreviewEdition('youth')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        previewEdition === 'youth'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🧢✨ Youth Edition
                    </button>
                  </div>
                </div>
              )}
              
              {/* Coming Soon Badge for Locked Series */}
              {!selectedSeries.available && (
                <div className="mb-6 bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-400 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🔒</span>
                    <div>
                      <h4 className="text-lg font-bold text-amber-900">Coming {selectedSeries.unlockDate}</h4>
                      <p className="text-sm text-amber-800">Get excited! This incredible series will be available soon.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-3 flex items-center">
                  <span className="mr-2">📚</span>
                  {selectedSeries.themes?.length > 1 ? 'Themes & Lessons' : 'Lesson Overview'}
                </h3>
                {selectedSeries.themes?.length > 1 && (
                  <p className="text-slate-600 mb-4">
                    This series includes {selectedSeries.themes.length} powerful themes with {selectedSeries.themes.reduce((acc, theme) => acc + theme.lessons.length, 0)} total lessons.
                  </p>
                )}
              </div>

              {/* Themes and Lessons */}
              <div className="space-y-8">
                {selectedSeries.themes && selectedSeries.themes.map((theme, themeIndex) => {
                  // Breakfast: only Month 1 (Prayer) is available, Months 2 & 3 are coming soon
                  const isComingSoon = selectedSeries.id === 'breakfast' && themeIndex > 0;
                  
                  return (
                  <div key={themeIndex} className={`space-y-3 ${isComingSoon ? 'opacity-60' : ''}`}>
                    {/* Theme Header */}
                    <div className={`bg-gradient-to-r ${selectedSeries.gradient} p-4 rounded-xl shadow-lg flex items-center justify-between`}>
                      <h4 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2">✨</span>
                        Theme: {theme.themeName}
                      </h4>
                      {isComingSoon && (
                        <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
                      )}
                    </div>

                    {/* Lessons for this theme */}
                    <div className="space-y-3 pl-2">
                      {theme.lessons.map((lesson, lessonIndex) => {
                        // Build the lesson ID for linking - first lesson of each theme can be explored
                        const isFirstLessonOfTheme = lessonIndex === 0;
                        
                        // Map lesson titles to actual backend lesson IDs based on edition
                        const editionSuffix = previewEdition === 'youth' ? 'ye' : 'ae';
                        const lessonIdMap = {
                          // Holiday Series
                          'The Covenant': 'holiday-ae-covenant',
                          'The Cradle': 'holiday-ae-cradle',
                          'The Cross': 'holiday-ae-cross',
                          'The Comforter': 'holiday-ae-comforter',
                          'Bonus Lesson - The Names of God': 'holiday-ae-bonus-names',
                          'Bonus Lesson - Times & Seasons': 'holiday-ae-bonus-times',
                          // In His Image (Free)
                          'Made in His Image': 'in-his-image-1',
                          'Accepted and Loved': 'in-his-image-2',
                          'Chosen of God': 'in-his-image-3',
                          // Breakfast - dynamically use edition
                          'Esther': `breakfast-${editionSuffix}-esther`,
                          'Joseph': `breakfast-${editionSuffix}-joseph`,
                          'Rahab': `breakfast-${editionSuffix}-rahab`,
                        };
                        
                        const lessonId = lessonIdMap[lesson.title];
                        const interactiveLessonUrl = lessonId ? `/interactive-lesson/${lessonId}` : null;
                        const canPreview = isFirstLessonOfTheme && selectedSeries.available && lessonId;
                        
                        return (
                          <div
                            key={`${themeIndex}-${lesson.number}`}
                            onClick={() => {
                              if (canPreview) {
                                window.location.href = interactiveLessonUrl;
                              }
                            }}
                            className={`bg-gradient-to-r ${selectedSeries.bgColor} border-2 border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all ${
                              canPreview 
                                ? 'hover:scale-[1.02] cursor-pointer hover:border-purple-300' 
                                : 'opacity-90'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${selectedSeries.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                {lesson.number}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="text-lg font-bold text-slate-800">
                                    Lesson {lesson.number}: {lesson.title}
                                  </h5>
                                  {canPreview && (
                                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                      👁️ PREVIEW
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {lesson.description}
                                </p>
                                {canPreview && (
                                  <p className="text-xs text-purple-600 mt-2 font-semibold">
                                    Click to explore this lesson (preview includes Appetizer section)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Call to Action */}
              <div className="mt-8 pt-6 border-t-2 border-slate-200">
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full bg-gradient-to-r ${selectedSeries.gradient} hover:opacity-90 text-white font-bold py-4 rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all`}
                >
                  {selectedSeries.available 
                    ? `Get Started with ${selectedSeries.name} 🚀` 
                    : `Order ${selectedSeries.name} Now 🎯`}
                </Button>
                <p className="text-center text-sm text-slate-500 mt-3">
                  {selectedSeries.available 
                    ? 'Choose your preferred access option below'
                    : `Available ${selectedSeries.unlockDate} - Order yours today!`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Selection Modal */}
      <ProductSelectionModal 
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        seriesData={selectedSeries}
        products={products}
        onAddToCart={(item) => {
          addToCart({
            id: item.product_id,
            name: item.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            series: item.series,
            seriesName: item.series_name,
            edition: item.edition,
            medium: item.medium,
          });
          toast.success(`Added ${item.product_name} to cart!`);
        }}
      />
      
      {/* Chatbot Support Widget */}
      <ChatbotWidget />
      
      {/* Exit-Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
};

export default SoulFoodLanding;
