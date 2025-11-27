import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    months: [
      { num: 1, title: "Names of God" },
      { num: 2, title: "Books of the Bible" },
      { num: 3, title: "Hebrews 11 (Faith Heroes)" }
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
    months: [
      { num: 4, title: "Body of Christ" },
      { num: 5, title: "Marriage & Family" },
      { num: 6, title: "Church Leadership" }
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
    months: [
      { num: 7, title: "Spiritual Gifts" },
      { num: 8, title: "Ministry & Service" },
      { num: 9, title: "Evangelism" }
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
    months: [
      { num: 10, title: "Prophecy" },
      { num: 11, title: "Book of Revelation" },
      { num: 12, title: "Judgment & Rewards" }
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
    description: "The Covenant, The Cradle, The Cross, and The Comforter - celebrating faith through the seasons."
  }
];

const SoulFoodLanding = () => {
  const [series, setSeries] = useState(SOUL_FOOD_SERIES);
  
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/1e0m8jm2_Soul%20Food%20-%20Truth%20Served%20Daily%20-%20Fun%20Purple%20Sacred.png"
                alt="Soul Food Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                  Soul Food : Truth Served Daily
                </h1>
                <p className="text-xs text-slate-700 font-bold">Kingdom Living Project</p>
              </div>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="login-button"
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Sign In
            </Button>
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
                  
                  {/* Monthly Topics */}
                  {s.months && (
                    <div className="bg-amber-50 border-l-4 border-amber-600 rounded p-4">
                      <h5 className="font-bold text-slate-800 mb-2 text-sm">📚 Monthly Topics:</h5>
                      <ul className="space-y-1">
                        {s.months.map((month) => (
                          <li key={month.num} className="text-sm text-slate-700">
                            <span className="font-semibold text-amber-800">Month {month.num}:</span> {month.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {s.available ? (
                    <div className="pt-4">
                      <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                        ✅ Available Now
                      </Badge>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <Badge className="bg-slate-500 text-white px-3 py-1 text-sm font-semibold">
                        🔒 Unlocks {s.unlockDate}
                      </Badge>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => s.available ? toast.success(`${s.name} series is available!`) : toast.info(`${s.name} unlocks ${s.unlockDate}`)}
                    disabled={!s.available}
                    className={`w-full ${s.available ? `bg-gradient-to-r ${s.gradient} hover:opacity-90 shadow-lg` : 'bg-slate-400 cursor-not-allowed'} text-white font-semibold py-3 rounded-xl transition-all`}
                  >
                    {s.available ? `Explore ${s.name}` : `Locked Until ${s.unlockDate}`}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Trivia Mix-up */}
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
                <p className="text-sm font-semibold text-orange-600 mb-3">Millionaire Style</p>
                <p className="text-slate-700 mb-4">
                  15-question progressive climb with lifelines! Test your Soul Food knowledge like "Who Wants to Be a Millionaire."
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Practice Mode</Badge>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Quarter Challenge</Badge>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Millionaire Mode</Badge>
                </div>
                <Button
                  onClick={() => window.location.href = '/gaming-central'}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 rounded-xl"
                >
                  Play Now →
                </Button>
              </CardContent>
            </Card>

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
                <p className="text-sm font-semibold text-cyan-600 mb-3">Youth Edition</p>
                <p className="text-slate-700 mb-4">
                  15-question progressive climb designed for ages 12-20! Test your Soul Food knowledge with lifelines and fun.
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Practice Mode</Badge>
                  <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Youth Challenge</Badge>
                  <Badge className="bg-cyan-100 text-cyan-700 text-xs w-fit">Fun Mode</Badge>
                </div>
                <Button
                  onClick={() => window.location.href = '/gaming-central'}
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
                  onClick={() => window.location.href = '/gaming-central'}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl"
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
                  onClick={() => window.location.href = '/gaming-central'}
                  className="w-full bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-800 hover:to-yellow-800 text-white font-bold py-3 rounded-xl"
                >
                  Play Now →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Gaming Access Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-400">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-white mb-4">🎯 Game Access Options</h4>
              <div className="grid md:grid-cols-3 gap-6 text-white">
                <div>
                  <div className="text-4xl mb-2">👀</div>
                  <div className="font-bold text-lg mb-1">Free Preview</div>
                  <div className="text-sm text-purple-300">5 questions • 1 game</div>
                </div>
                <div>
                  <div className="text-4xl mb-2">🎟️</div>
                  <div className="font-bold text-lg mb-1">Day Pass - $40</div>
                  <div className="text-sm text-purple-300">24 hours • All games • Unlimited</div>
                </div>
                <div>
                  <div className="text-4xl mb-2">👑</div>
                  <div className="font-bold text-lg mb-1">Subscription</div>
                  <div className="text-sm text-purple-300">Full access • Leaderboards • Badges</div>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/gaming-central'}
                className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-4 rounded-xl text-lg shadow-2xl"
              >
                Enter Gaming Central →
              </Button>
            </div>
          </div>
        </div>
      </section>

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

              <div className="mt-8 text-center">
                <Button 
                  onClick={() => toast.success("Bulk order form opening soon!")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold px-12 py-4 rounded-xl text-lg shadow-2xl"
                >
                  Request Bulk Quote →
                </Button>
                <p className="text-sm text-slate-600 mt-3">
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
          <div className="mt-12 bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50 rounded-2xl p-8 border-2 border-blue-300 shadow-xl">
            <div className="text-center mb-6">
              <Badge className="bg-blue-600 text-white px-6 py-2 text-lg font-bold mb-4 inline-block">
                🎓 Adult Edition Featured Content
              </Badge>
              <h4 className="text-3xl font-bold text-slate-800 mb-3">
                Talent vs Gift Teaching
              </h4>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Understanding the difference between God-given talents and spiritual gifts
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/l6a0CqmTEgQ"
                  title="Talent vs Gift Teaching"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-700 mb-4">
                  This powerful teaching explores the biblical distinction between natural talents and spiritual gifts, helping believers understand their unique calling.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 px-4 py-2">Doctrinal Teaching</Badge>
                  <Badge className="bg-cyan-100 text-cyan-700 px-4 py-2">Adult Focused</Badge>
                  <Badge className="bg-slate-100 text-slate-700 px-4 py-2">Spiritual Growth</Badge>
                </div>
              </div>
            </div>
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
            <Card className="border-2 border-amber-400 shadow-xl hover:shadow-2xl transition-all relative">
          <div className="mt-12 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-300 shadow-xl">
            <div className="text-center mb-6">
              <Badge className="bg-purple-600 text-white px-6 py-2 text-lg font-bold mb-4 inline-block">
                🎵 Youth Edition Featured Content
              </Badge>
              <h4 className="text-3xl font-bold text-slate-800 mb-3">
                Inspirational Youth Music & Media
              </h4>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Experience uplifting content designed specifically for young believers ages 12-20
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/l14zW1FsFsQ"
                  title="Youth Inspirational Song"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-700 mb-4">
                  This powerful song embodies the spirit of Soul Food's Youth Edition - encouraging young believers to stay strong in their faith journey.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-700 px-4 py-2">Faith Building</Badge>
                  <Badge className="bg-pink-100 text-pink-700 px-4 py-2">Youth Focused</Badge>
                  <Badge className="bg-blue-100 text-blue-700 px-4 py-2">Inspirational</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Youth Relationships Multimedia */}
          <div className="mt-12 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 rounded-2xl p-8 border-2 border-pink-300 shadow-xl">
            <div className="text-center mb-6">
              <Badge className="bg-pink-600 text-white px-6 py-2 text-lg font-bold mb-4 inline-block">
                💕 Youth Relationships Content
              </Badge>
              <h4 className="text-3xl font-bold text-slate-800 mb-3">
                Building Healthy Relationships
              </h4>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Biblical guidance for youth navigating friendships, family, and relationships
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/caDGKe4VpyA"
                  title="Youth Relationships Teaching"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-700 mb-4">
                  Learn biblical principles for building strong, godly relationships as a young believer navigating today's world.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge className="bg-pink-100 text-pink-700 px-4 py-2">Relationships</Badge>
                  <Badge className="bg-rose-100 text-rose-700 px-4 py-2">Youth Guidance</Badge>
                  <Badge className="bg-purple-100 text-purple-700 px-4 py-2">Biblical Wisdom</Badge>
                </div>
              </div>
            </div>
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-700 to-amber-800 text-white px-4 py-1 font-bold text-sm">
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

          {/* Adult Multimedia Showcase */}
          <div className="mt-12 bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50 rounded-2xl p-8 border-2 border-blue-300 shadow-xl">
            <div className="text-center mb-6">
              <Badge className="bg-blue-600 text-white px-6 py-2 text-lg font-bold mb-4 inline-block">
                🎓 Adult Edition Featured Content
              </Badge>
              <h4 className="text-3xl font-bold text-slate-800 mb-3">
                Talent vs Gift Teaching
              </h4>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Understanding the difference between God-given talents and spiritual gifts
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/l6a0CqmTEgQ"
                  title="Talent vs Gift Teaching"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-700 mb-4">
                  This powerful teaching explores the biblical distinction between natural talents and spiritual gifts, helping believers understand their unique calling.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 px-4 py-2">Doctrinal Teaching</Badge>
                  <Badge className="bg-cyan-100 text-cyan-700 px-4 py-2">Adult Focused</Badge>
                  <Badge className="bg-slate-100 text-slate-700 px-4 py-2">Spiritual Growth</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Youth Multimedia Showcase */}
          <div className="mt-12 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-300 shadow-xl">
            <div className="text-center mb-6">
              <Badge className="bg-purple-600 text-white px-6 py-2 text-lg font-bold mb-4 inline-block">
                🎵 Youth Edition Featured Content
              </Badge>
              <h4 className="text-3xl font-bold text-slate-800 mb-3">
                Inspirational Youth Music & Media
              </h4>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Experience uplifting content designed specifically for young believers ages 12-20
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/l14zW1FsFsQ"
                  title="Youth Inspirational Song"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-700 mb-4">
                  This powerful song embodies the spirit of Soul Food's Youth Edition - encouraging young believers to stay strong in their faith journey.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-700 px-4 py-2">Faith Building</Badge>
                  <Badge className="bg-pink-100 text-pink-700 px-4 py-2">Youth Focused</Badge>
                  <Badge className="bg-blue-100 text-blue-700 px-4 py-2">Inspirational</Badge>
                </div>
              </div>
            </div>
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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
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

            {/* Featured Multimedia Videos */}
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Youth Featured Song */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center justify-center mb-3">
                  <Badge className="bg-purple-600 text-white px-3 py-1 text-xs font-bold">
                    🎵 Youth Music
                  </Badge>
                </div>
                <h5 className="text-lg font-bold text-center mb-3 text-slate-800">
                  Inspirational Music
                </h5>
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/l14zW1FsFsQ"
                    title="Youth Inspirational Song"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-center text-xs text-slate-600 mt-3">
                  Uplifting music for young believers
                </p>
              </div>

              {/* Youth Relationships */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-200">
                <div className="flex items-center justify-center mb-3">
                  <Badge className="bg-pink-600 text-white px-3 py-1 text-xs font-bold">
                    💕 Youth Relationships
                  </Badge>
                </div>
                <h5 className="text-lg font-bold text-center mb-3 text-slate-800">
                  Healthy Relationships
                </h5>
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/caDGKe4VpyA"
                    title="Youth Relationships Teaching"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-center text-xs text-slate-600 mt-3">
                  Biblical guidance for relationships
                </p>
              </div>

              {/* Sowing & Reaping Teaching */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-center justify-center mb-3">
                  <Badge className="bg-orange-600 text-white px-3 py-1 text-xs font-bold">
                    📚 Youth & Instructor
                  </Badge>
                </div>
                <h5 className="text-lg font-bold text-center mb-3 text-slate-800">
                  Sowing & Reaping
                </h5>
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/CFjtY-qtpd0?start=55"
                    title="Sowing and Reaping Teaching"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-center text-xs text-slate-600 mt-3">
                  Biblical teaching principles
                </p>
              </div>

              {/* Talent vs Gift Teaching */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-center mb-3">
                  <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold">
                    🎓 Adult Teaching
                  </Badge>
                </div>
                <h5 className="text-lg font-bold text-center mb-3 text-slate-800">
                  Talent vs Gift
                </h5>
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/l6a0CqmTEgQ"
                    title="Talent vs Gift Teaching"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-center text-xs text-slate-600 mt-3">
                  Understanding talents and gifts
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
              src="https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/1e0m8jm2_Soul%20Food%20-%20Truth%20Served%20Daily%20-%20Fun%20Purple%20Sacred.png"
              alt="Soul Food Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="text-left">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                Soul Food : Truth Served Daily
              </h3>
              <p className="text-sm text-slate-400 font-bold">Kingdom Living Project</p>
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
    </div>
  );
};

export default SoulFoodLanding;
