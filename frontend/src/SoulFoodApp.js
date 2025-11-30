import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShoppingCart from './ShoppingCart';
import { useCart } from './CartContext';

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
    unlockDate: "Q1 2026",
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
          { number: 5, title: "Bonus Lesson - The Names of God", description: "Discovering God's character through His names" },
          { number: 6, title: "Bonus Lesson - Times & Seasons", description: "God's perfect timing in our lives" }
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

const SoulFoodLanding = () => {
  const [series, setSeries] = useState(SOUL_FOOD_SERIES);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-5">
              <img 
                src="/soul-food-logo.png" 
                alt="Soul Food Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                  Soul Food
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium">Kingdom Living Project</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-full p-1">
                <ShoppingCart />
              </div>
              <Button
                onClick={handleLogin}
                data-testid="login-button"
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-40"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1759127481171-30a27de310ad?w=1200&h=800&fit=crop&crop=center')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-purple-900/60" />
        </div>
        
        <div className="relative z-10 container mx-auto text-center max-w-5xl">
          {/* Beta Badge */}
          <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-2 text-sm font-bold animate-pulse shadow-xl">
            🚀 BETA ACCESS - Launch Special
          </Badge>
          
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
              Soul Food
            </span>
            <br />
            <span className="text-white text-3xl sm:text-4xl lg:text-5xl drop-shadow-lg">
              Spiritual Nourishment for Every Season
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            A year-long journey through Scripture designed to strengthen your foundation, 
            deepen relationships, discover purpose, and mature in faith - one meal at a time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => document.getElementById('series')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-orange-300 transform hover:scale-105 transition-all"
            >
              Explore Series
            </Button>
            <Button
              onClick={() => document.getElementById('free-sample')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="w-full sm:w-auto border-2 border-white/80 text-white hover:bg-white/10 px-10 py-4 rounded-xl text-lg font-semibold shadow-lg backdrop-blur-sm"
            >
              Try Free Sample
            </Button>
          </div>

          {/* Black Friday Launch Badge */}
          <div className="mt-8 inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-2xl border border-purple-200">
            <span className="text-2xl">🎉</span>
            <span className="text-slate-800 font-semibold">
              Launching Black Friday 2025 - Be among the first!
            </span>
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
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {series.map((s, idx) => (
              <Card 
                key={s.id} 
                className={`relative overflow-hidden border-2 ${s.available ? 'border-purple-200' : 'border-slate-300'} ${s.available ? 'shadow-xl hover:shadow-2xl' : 'shadow-md'} transition-all duration-300 ${s.available ? 'hover:scale-[1.02]' : ''} bg-white`}
              >
                {!s.available && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-slate-700 text-white px-4 py-2 text-sm font-bold shadow-lg">
                      🔒 Coming {s.unlockDate}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="relative p-0">
                  {/* Background Image */}
                  <div 
                    className={`w-full h-40 bg-cover bg-center ${!s.available ? 'opacity-50 grayscale' : ''}`}
                    style={{
                      backgroundImage: `url('${s.bgImage}')`
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-40`} />
                  </div>
                  
                  {/* Title Overlay */}
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
                
                <CardContent className="relative space-y-4 p-6">
                  <p className="text-slate-700 leading-relaxed">{s.description}</p>
                  
                  <div className="flex items-center justify-between pt-4">
                    {s.available ? (
                      <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                        ✅ Available Now
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500 text-white px-3 py-1 text-sm font-semibold">
                        🔒 Unlocks {s.unlockDate}
                      </Badge>
                    )}
                    
                    {s.available && s.id === 'breakfast' && (
                      <Button
                        onClick={() => {
                          setSelectedSeries(s);
                          setShowPreview(true);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg"
                      >
                        View Lessons 📖
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => {
                      setSelectedSeries(s);
                      setShowPreview(true);
                    }}
                    className={`w-full bg-gradient-to-r ${s.gradient} hover:opacity-90 shadow-lg text-white font-semibold py-3 rounded-xl transition-all`}
                  >
                    {s.available ? `Explore Full Series 📚` : `Preview Coming Lessons 📖`}
                  </Button>
                  
                  {/* Add to Cart Button for Pre-Orders */}
                  <Button
                    onClick={() => addToCart('mealtime_bundle', 1, { series: s.id, seriesName: s.name })}
                    variant="outline"
                    className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-all"
                  >
                    🛒 Pre-Order Physical Book
                  </Button>
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
              <div className="flex gap-4 justify-end mt-6">
                <Button
                  onClick={() => addToCart('mealtime_bundle', 1, { series: 'holiday', seriesName: 'Holiday Series' })}
                  variant="outline"
                  className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-6 py-2.5 rounded-lg font-semibold shadow-lg"
                >
                  🛒 Pre-Order Book
                </Button>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Free Sample Section */}
      <section id="free-sample" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2 text-sm font-bold">
              FREE SAMPLE
            </Badge>
            <h3 className="text-4xl font-bold mb-4 text-slate-800">
              Try Leap of Faith - Free Mini-Series
            </h3>
            <p className="text-xl text-slate-600">
              Experience our teaching style with this platform-exclusive sample lesson
            </p>
          </div>

          <Card className="shadow-2xl border-2 border-amber-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 text-center p-8">
              <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                My Brother's Keeper & Consistency Pays
              </CardTitle>
              <p className="text-slate-600 italic">
                "Now faith is the substance of things hoped for, the evidence of things not seen." - Hebrews 11:1
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg mb-3 text-slate-800">What You'll Learn:</h4>
                  <ul className="space-y-2">
                    {[
                      "Abel's faithful sacrifice and what it teaches us",
                      "Enoch's remarkable consistency with God",
                      "The meaning of being your brother's keeper",
                      "How faith pleases God and brings rewards"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          ✓
                        </span>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                  <p className="text-sm text-amber-900">
                    <strong>Bonus:</strong> Includes interactive crossword puzzle and reflection questions!
                  </p>
                </div>

                <Button
                  onClick={() => window.location.href = '/lesson/free-sample'}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Start Free Lesson Now →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gaming Central Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
              <h4 className="text-3xl font-bold text-white mb-2">Games for Young Believers</h4>
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
                  <div className="h-48 bg-white/90 flex items-center justify-center p-4">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/4jh8a4ad_Soul%20Food%20Trivia%20Mix-up%20Logo.png"
                      alt="Trivia Mix-up Youth"
                      className="max-h-44 w-auto object-contain"
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
                  <div className="flex flex-col gap-2 mb-4">
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Practice Mode</Badge>
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Youth Challenge</Badge>
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Fun Mode</Badge>
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
                  <div className="h-48 bg-white/90 flex items-center justify-center p-4">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/dgncbaxl_Soul%20Food%27s%20Tricky%20Testaments%20-%20Bold%20Modern%20%281%29.png"
                      alt="Tricky Testaments Youth"
                      className="max-h-44 w-auto object-contain"
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
                <div className="h-48 bg-white/90 flex items-center justify-center p-4">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/bovn8pyf_Soul%20Food%20Trivia%20Logo%20-%20Vintage%20Style%20%282%29.png"
                    alt="Trivia Mix-up"
                    className="max-h-44 w-auto object-contain"
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
                <div className="h-48 bg-white/90 flex items-center justify-center p-4">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/29d8ivo6_Soul%20Food%27s%20Tricky%20Testaments%20Logo%20%281%29.png"
                    alt="Tricky Testaments Adult"
                    className="max-h-44 w-auto object-contain"
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
                  onClick={() => window.location.href = '/gaming-central'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-xl text-base sm:text-lg shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto max-w-md"
                >
                  Enter Gaming Central →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Holiday Box Set Pre-Order Section */}
      {/* Holiday Box Set Pre-Order Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-red-50 via-green-50 to-emerald-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-gradient-to-r from-red-600 to-green-600 text-white px-8 py-3 text-base font-bold animate-pulse shadow-2xl">
              🎁 PRE-ORDER NOW - Ships Mid-December!
            </Badge>
            <h3 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
              Holiday Box Set Pre-Order
            </h3>
            <p className="text-xl text-slate-700">
              Physical books delivered in time for Christmas + Instant Digital Access!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Adult/Youth Box Set */}
            <Card className="border-4 border-red-300 shadow-2xl overflow-hidden hover:scale-105 transition-all">
              <CardHeader className="bg-gradient-to-br from-red-100 to-green-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Holiday + Break*fast Box Set
                  </CardTitle>
                  <span className="text-4xl">🎁</span>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Adult or Youth Edition</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4">
                  <h5 className="font-bold text-emerald-800 mb-2">✨ Pre-Order Bonuses:</h5>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Instant eBook Access</strong> - Start reading today!</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Printable Gift Certificate</strong> - Beautiful "IOU" to give on Christmas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Physical Books</strong> - Shipped mid-December</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>2 Complete Series: Holiday (4 C's) + Break*fast</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <p className="text-lg text-slate-500 line-through mb-1">Reg. $49.99</p>
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    $39.99
                  </div>
                  <Badge className="bg-amber-500 text-white text-xs px-3 py-1 mt-2">
                    Save $10 - Physical + Digital Bundle!
                  </Badge>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-slate-700">
                  <p className="font-semibold">📦 Estimated Delivery: December 15-20, 2025</p>
                  <p className="text-xs mt-1">Order by Dec 10 to guarantee Christmas delivery</p>
                </div>

                <Button 
                  onClick={() => toast.success("Pre-order page opening soon!")}
                  className="w-full bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all"
                >
                  Pre-Order Holiday Box Set →
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Box Set */}
            <Card className="border-4 border-orange-300 shadow-2xl overflow-hidden hover:scale-105 transition-all relative">
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 text-sm font-bold z-10 shadow-xl rotate-12">
                For Teachers!
              </Badge>
              <CardHeader className="bg-gradient-to-br from-orange-100 to-amber-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Instructor Box Set
                  </CardTitle>
                  <span className="text-4xl">📚</span>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Complete Teaching Edition</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4">
                  <h5 className="font-bold text-emerald-800 mb-2">✨ Pre-Order Bonuses:</h5>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Instant eBook Access</strong> - Start teaching today!</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Printable Gift Certificate</strong> - Perfect for gifting</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Physical Books</strong> - Premium instructor edition</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Teaching guides, dual scripture, historical notes</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <p className="text-lg text-slate-500 line-through mb-1">Reg. $99.99</p>
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    $79.99
                  </div>
                  <Badge className="bg-amber-500 text-white text-xs px-3 py-1 mt-2">
                    Save $20 - Best Value for Educators!
                  </Badge>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-slate-700">
                  <p className="font-semibold">📦 Estimated Delivery: December 15-20, 2025</p>
                  <p className="text-xs mt-1">Perfect for January class start!</p>
                </div>

                <Button 
                  onClick={() => toast.success("Pre-order page opening soon!")}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all"
                >
                  Pre-Order Instructor Set →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Purchase Tiers */}
          <Card className="border-4 border-purple-300 shadow-2xl bg-gradient-to-br from-purple-50 to-indigo-50">
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
            
            {/* Pricing Clarity Notice */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">ℹ️</span>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 mb-2">📅 Content Releases Quarterly Throughout 2026</h4>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Subscription ($9.99 or $14.99/month):</strong> Get immediate access to Break*fast & Holiday Series, PLUS automatic access to new series as they unlock quarterly (Lunch Q1, Dinner Q2, Supper Q3).</p>
                    <p><strong>eBook ($31.99 or $68.99 one-time):</strong> Purchase includes ONLY currently available content at time of purchase. New quarterly releases require separate purchase or subscription upgrade.</p>
                    <p><strong>Physical Books ($39.99 or $79.99):</strong> Pre-order Holiday/Breakfast Box Set - Ships mid-December! Includes FREE instant eBook access + printable gift certificate.</p>
                    <p className="font-semibold text-blue-700 bg-blue-100 px-3 py-2 rounded-lg mt-3">💡 Best Value: Subscribe to get all content as it releases throughout the year!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Adult Edition */}
            <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all">
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
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-4 italic">
                  Core lessons using WEB Bible for clarity and modern understanding
                </p>
                <ul className="space-y-3 mb-6">
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
                <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Youth Edition */}
            <Card className="border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all">
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
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-4 italic">
                  Age-appropriate content with WEB Bible, designed for young believers
                </p>
                <ul className="space-y-3 mb-6">
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
                <Button onClick={handleLogin} className="w-full bg-purple-600 hover:bg-purple-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Edition */}
            <Card className="border-2 border-orange-300 shadow-xl hover:shadow-2xl transition-all relative">
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
                <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 mb-2">All quarterly releases included</Badge>
                <p className="text-sm text-slate-600">eBook: $68.99 (current content only)</p>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-4 italic font-semibold">
                  Complete teaching toolkit for facilitating Adult or Youth classes
                </p>
                <ul className="space-y-3 mb-6">
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
                    <span className="text-slate-700 text-sm">All multimedia content (audio & video)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">Downloadable teaching materials</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Subscription vs eBook Comparison */}
          <div className="mt-12 bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-lg">
            <h4 className="text-2xl font-bold text-center mb-6 text-slate-800">
              💰 Subscription vs. eBook - What's the Difference?
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
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span><strong>Break*fast</strong> available immediately</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span><strong>Lunch</strong> unlocks automatically Q1 2026</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span><strong>Dinner</strong> unlocks automatically Q2 2026</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span><strong>Supper</strong> unlocks automatically Q3 2026</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span>All multimedia (audio, video) as released</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span>Cancel anytime, no commitment</span>
                  </li>
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
                  <li className="flex items-start space-x-2">
                    <span className="text-slate-600 font-bold mt-0.5">✓</span>
                    <span><strong>Break*fast</strong> included (currently available)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
                    <span><strong>Lunch</strong> requires separate purchase in Q1</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
                    <span><strong>Dinner</strong> requires separate purchase in Q2</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
                    <span><strong>Supper</strong> requires separate purchase in Q3</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-slate-600 font-bold mt-0.5">✓</span>
                    <span>Downloadable PDF, keep forever</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-slate-600 font-bold mt-0.5">✓</span>
                    <span>Print at home or read offline</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <p className="text-xs font-semibold text-amber-800">Best for: Single quarter study or gift giving</p>
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

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/soul-food-logo.png" 
              alt="Soul Food Logo" 
              className="w-12 h-12 object-contain"
            />
            <div className="text-left">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Soul Food
              </h3>
              <p className="text-sm text-slate-400">Kingdom Living Project</p>
            </div>
          </div>
          <p className="text-slate-400 mb-6 text-lg">
            Spiritual nourishment for every season of life - one meal at a time
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-slate-500 text-sm">
              © 2025 Kingdom Living Project. All rights reserved. | Launching Black Friday 2025
            </p>
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
                {selectedSeries.themes && selectedSeries.themes.map((theme, themeIndex) => (
                  <div key={themeIndex} className="space-y-3">
                    {/* Theme Header */}
                    <div className={`bg-gradient-to-r ${selectedSeries.gradient} p-4 rounded-xl shadow-lg`}>
                      <h4 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2">✨</span>
                        Theme: {theme.themeName}
                      </h4>
                    </div>

                    {/* Lessons for this theme */}
                    <div className="space-y-3 pl-2">
                      {theme.lessons.map((lesson) => (
                        <div
                          key={`${themeIndex}-${lesson.number}`}
                          className={`bg-gradient-to-r ${selectedSeries.bgColor} border-2 border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${selectedSeries.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                              {lesson.number}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-slate-800 mb-1">
                                Lesson {lesson.number}: {lesson.title}
                              </h5>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {lesson.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                    : `Pre-Order ${selectedSeries.name} Now 🎯`}
                </Button>
                <p className="text-center text-sm text-slate-500 mt-3">
                  {selectedSeries.available 
                    ? 'Choose your preferred access option below'
                    : `Available ${selectedSeries.unlockDate} - Reserve your spot today!`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoulFoodLanding;
