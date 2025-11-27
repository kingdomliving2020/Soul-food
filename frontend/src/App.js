import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Soul Food Series Data
const SOUL_FOOD_SERIES = {
  breakfast: {
    name: "Break*fast",
    theme: "Foundation in Christ",
    icon: "☀️",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    available: true,
    description: "Start your spiritual journey with a strong foundation"
  },
  lunch: {
    name: "Lunch", 
    theme: "Kingdom Relationships",
    icon: "🌤️",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    available: false,
    unlockDate: "Q1 2026",
    description: "Build meaningful relationships in God's Kingdom"
  },
  dinner: {
    name: "Dinner",
    theme: "Finding Your Purpose", 
    icon: "🌆",
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    available: false,
    unlockDate: "Q1 2026",
    description: "Discover your calling and divine purpose"
  },
  supper: {
    name: "Supper",
    theme: "Maturity in the Faith",
    icon: "🌙",
    color: "from-indigo-600 to-purple-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    available: false,
    unlockDate: "Q1 2026",
    description: "Grow into spiritual maturity and wisdom"
  },
  holiday: {
    name: "Holiday Series",
    theme: "4 C's of Christianity",
    icon: "🎄",
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    available: true,
    description: "Celebrate faith through the seasons"
  }
};

// Landing Page Component
const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Kingdom Living Project</h1>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="login-button"
              className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="hidden sm:inline">Sign In with Google</span>
              <span className="sm:hidden">Sign In</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Multicultural Background */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-30"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1759127481171-30a27de310ad?w=1200&h=800&fit=crop&crop=center')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-purple-900/40" />
        </div>
        
        <div className="relative z-10 container mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-800 via-purple-700 to-indigo-900 bg-clip-text text-transparent leading-tight">
            Put On The Whole
            <br />
            Armor of God
          </h2>
          <p className="text-lg sm:text-xl text-slate-700 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Renew your mind and strengthen your faith through our year-long journey of spiritual growth, 
            interactive Bible study lessons, and supportive Christian community for ALL nations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button
              onClick={() => setShowAuth(true)}
              data-testid="get-started-btn"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Start Your Journey
            </Button>
            <Button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Free Sample Section with Multicultural Image */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-800">
            Try Our Free Sample Lesson
          </h3>
          <p className="text-center text-slate-600 mb-8 sm:mb-12 text-lg">
            Experience the "Leap of Faith" bonus lesson - completely free!
          </p>
          
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-indigo-200 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-indigo-50 to-purple-50">
                <div 
                  className="w-full h-32 sm:h-48 bg-cover bg-center rounded-xl mb-4 shadow-inner"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1756367260219-b60e3cb90fa5?w=800&h=400&fit=crop&crop=center')"
                  }}
                />
                <CardTitle className="text-xl sm:text-2xl text-indigo-800">Leap of Faith - My Brother's Keeper & Consistency Pays</CardTitle>
                <p className="text-slate-600 px-4">Hebrews 11:1 - "Now faith is the substance of things hoped for, the evidence of things not seen."</p>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-slate-800">What You'll Learn:</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Abel's faithful sacrifice
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Enoch's consistency with God
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Faith beyond natural abilities
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Interactive crossword puzzle
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-slate-800">Lesson Features:</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        Scripture study (Genesis 4:1-11)
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 3.5a1 1 0 112 0V4c.416.013.825.067 1.22.15A1 1 0 0111.78 6.1 6.01 6.01 0 0010 6c-.664 0-1.297.115-1.89.32A1 1 0 017.11 4.37c.395-.083.804-.137 1.22-.15V3.5zM6 7a1 1 0 012 0v3a1 1 0 11-2 0V7zm8 0a1 1 0 012 0v3a1 1 0 11-2 0V7z" clipRule="evenodd" />
                        </svg>
                        Reflection questions
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Interactive activities
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Fill-in workbook format
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center pt-6 border-t">
                  <Button
                    onClick={() => window.location.href = '/lesson/free-sample'}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-8 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Start Free Sample Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section with Multicultural Images */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-slate-800">
            Everything You Need for Spiritual Growth
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-indigo-100 rounded-2xl overflow-hidden group">
              <CardHeader className="text-center p-4 sm:p-6">
                <div 
                  className="w-full h-24 sm:h-32 bg-cover bg-center rounded-xl mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://img.freepik.com/free-photo/side-view-people-reading-together_23-2150062161.jpg?w=400&h=300&fit=crop&crop=center')"
                  }}
                />
                <CardTitle className="text-lg sm:text-xl text-indigo-700">Interactive Workbook</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Fill out lessons online with engaging activities, word searches, and crossword puzzles 
                  that make learning fun and memorable. Track your progress as you grow.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-indigo-100 rounded-2xl overflow-hidden group">
              <CardHeader className="text-center p-4 sm:p-6">
                <div 
                  className="w-full h-24 sm:h-32 bg-cover bg-center rounded-xl mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://images.pexels.com/photos/8513088/pexels-photo-8513088.jpeg?w=400&h=300&fit=crop&crop=center')"
                  }}
                />
                <CardTitle className="text-lg sm:text-xl text-purple-700">Community & Support</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Join a supportive community of believers from all nations with group discussions, prayer support, 
                  and wholesome fellowship activities that strengthen your faith journey.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-indigo-100 rounded-2xl overflow-hidden group sm:col-span-2 lg:col-span-1">
              <CardHeader className="text-center p-4 sm:p-6">
                <div 
                  className="w-full h-24 sm:h-32 bg-cover bg-center rounded-xl mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://img.freepik.com/free-photo/high-angle-catholic-young-men-women-holding-each-other-hands-while-praying-together-around-table-with-christian-cross_662251-1120.jpg?w=400&h=300&fit=crop&crop=center')"
                  }}
                />
                <CardTitle className="text-lg sm:text-xl text-emerald-700">Gamified Learning</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Enjoy mid-year Jeopardy reviews and Family Feud style games that make reviewing 
                  concepts exciting, competitive, and memorable for the whole family.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Curriculum Overview with Bonus & Seasonal Content */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white/80">
        <div className="container mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-slate-800">
            Year-Long Curriculum Overview
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Quarter 1 */}
            <Card className="border border-indigo-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4">
                <CardTitle className="text-lg text-indigo-800">Quarter 1: Foundation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=1&month=1'}
                    className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline text-left w-full"
                  >
                    Month 1: Prayer, the first resort →
                  </button>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=1&month=2'}
                    className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline text-left w-full"
                  >
                    Month 2: The Art of Through →
                  </button>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=1&month=3'}
                    className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline text-left w-full"
                  >
                    Month 3: Faith & Foresight →
                  </button>
                </div>
                <p className="text-xs text-slate-600">Establish communication with God and learn perseverance through challenges</p>
              </CardContent>
            </Card>

            {/* Quarter 2 */}
            <Card className="border border-purple-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 p-4">
                <CardTitle className="text-lg text-purple-800">Quarter 2: Relationships</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=2&month=4'}
                    className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline text-left w-full"
                  >
                    Month 4: Friends & Friction is OK →
                  </button>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=2&month=5'}
                    className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline text-left w-full"
                  >
                    Month 5: Relation-ship →
                  </button>
                  <div className="text-sm font-medium text-slate-700">Month 6: Alone is not Lonely</div>
                </div>
                <p className="text-xs text-slate-600">Build healthy relationships and find strength in community</p>
              </CardContent>
            </Card>

            {/* Quarter 3 */}
            <Card className="border border-emerald-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 p-4">
                <CardTitle className="text-lg text-emerald-800">Quarter 3: Purpose</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Month 7: Identity in Christ</div>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=3&month=8'}
                    className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline text-left w-full"
                  >
                    Month 8: Good Leaders are Great Followers →
                  </button>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=3&month=9'}
                    className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline text-left w-full"
                  >
                    Month 9: Sowing & Reaping →
                  </button>
                </div>
                <p className="text-xs text-slate-600">Walk in your calling and discover your spiritual gifts</p>
              </CardContent>
            </Card>

            {/* Quarter 4 */}
            <Card className="border border-amber-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 p-4">
                <CardTitle className="text-lg text-amber-800">Quarter 4: Maturity</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=4&month=10'}
                    className="text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline text-left w-full"
                  >
                    Month 10: Persistent pursuit →
                  </button>
                  <button 
                    onClick={() => window.location.href = '/lessons?quarter=4&month=11'}
                    className="text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline text-left w-full"
                  >
                    Month 11: Poisoned pursuit →
                  </button>
                  <div className="text-sm font-medium text-slate-700">Month 12: Grieving with Grace</div>
                </div>
                <p className="text-xs text-slate-600">Develop mature faith and handle life's hardships</p>
              </CardContent>
            </Card>
          </div>

          {/* Bonus & Extended Study Section */}
          <div className="mt-8">
            <h4 className="text-2xl font-bold text-center mb-6 text-slate-800">Bonus & Extended Study</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border border-emerald-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 p-4">
                  <CardTitle className="text-lg text-emerald-800">Bonus Content</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-slate-600 mb-3 text-sm">Featured free lessons and special content</p>
                  <Button
                    onClick={() => window.location.href = '/lessons?type=bonus'}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                  >
                    View Bonus Lessons →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-purple-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 p-4">
                  <CardTitle className="text-lg text-purple-800">Extended Study - 5th Week Series</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-slate-600 mb-3 text-sm">Deep-dive series for months with 5 weeks</p>
                  <Button
                    onClick={() => window.location.href = '/lessons?type=extended'}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
                  >
                    View Extended Study →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Old Bonus Section Removed */}
          <div className="mt-8 hidden">
            <h4 className="text-2xl font-bold text-center mb-6 text-slate-800">Bonus & Seasonal Content</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-green-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 p-3">
                  <CardTitle className="text-base text-green-800">Holiday Specials</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li>• Christmas: The Gift of Hope</li>
                    <li>• Easter: Victory Through Blood</li>
                    <li>• Thanksgiving: Gratitude & Growth</li>
                    <li>• New Year: Fresh Starts</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3">
                  <CardTitle className="text-base text-blue-800">5th Week Lessons</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li>• Extended Study Sessions</li>
                    <li>• Deep Dive Reflections</li>
                    <li>• Community Testimonies</li>
                    <li>• Interactive Challenges</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border border-rose-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 p-3">
                  <CardTitle className="text-base text-rose-800">Special Events</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li>• Mid-Year Jeopardy Review</li>
                    <li>• Family Feud Bible Edition</li>
                    <li>• Memory Verse Challenges</li>
                    <li>• Group Activities & Games</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border border-teal-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 p-3">
                  <CardTitle className="text-base text-teal-800">Bonus Materials</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li>• Leap of Faith (Featured)</li>
                    <li>• Solomon: Young & Wise</li>
                    <li>• Kingdom Leadership</li>
                    <li>• Advanced Study Guides</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Updated Pricing Section with Corrected Subscription Prices */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-slate-800">
            Choose Your Learning Path
          </h3>
          
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Print Version */}
            <Card className="shadow-2xl border border-slate-200 relative rounded-2xl overflow-hidden">
              <CardHeader className="text-center p-6 bg-gradient-to-r from-slate-50 to-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 715.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-slate-800">Print Workbook</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold mb-6 text-slate-700">$39.99<span className="text-lg text-slate-600"></span></div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Physical spiral-bound workbook
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All 48 lessons + bonus content
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    High-quality paper & binding
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Perfect for offline study
                  </li>
                </ul>
                <Button
                  onClick={() => alert('Print orders coming soon! Please use the digital options for now.')}
                  data-testid="print-plan-btn"
                  className="w-full bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 py-3 rounded-xl font-semibold"
                >
                  Order Print Version
                </Button>
              </CardContent>
            </Card>

            {/* eBook Download */}
            <Card className="shadow-2xl border border-indigo-200 relative rounded-2xl overflow-hidden">
              <CardHeader className="text-center p-6 bg-gradient-to-r from-indigo-50 to-blue-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-slate-800">Digital eBook</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold mb-6 text-indigo-600">$24.99<span className="text-lg text-slate-600"></span></div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Downloadable PDF workbook
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Offline access forever
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Print at home option
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Instant download
                  </li>
                </ul>
                <Button
                  onClick={handleLogin}
                  data-testid="ebook-plan-btn"
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 py-3 rounded-xl font-semibold"
                >
                  Buy Digital eBook
                </Button>
              </CardContent>
            </Card>

            {/* Online Subscription with Corrected Pricing */}
            <Card className="shadow-2xl border-2 border-purple-400 relative rounded-2xl overflow-hidden">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-2 text-sm font-semibold">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center p-6 sm:p-8 pt-10 bg-gradient-to-r from-purple-50 to-indigo-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-slate-800">Online Community</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold mb-2 text-purple-600">$7.99<span className="text-lg text-slate-600">/month</span></div>
                <div className="text-sm text-slate-600 mb-4">Instructor: $11.99/month</div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Interactive online lessons
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Community discussion forums
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Video insights & discussions
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Progress tracking & games
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All seasonal & bonus content
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Cancel anytime
                  </li>
                </ul>
                <Button
                  onClick={handleLogin}
                  data-testid="subscription-plan-btn"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 py-3 rounded-xl font-semibold"
                >
                  Start Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Kingdom Living Project</h3>
          <p className="text-slate-400 mb-6">
            Putting on the whole armor of God and transforming lives through Kingdom principles for ALL nations
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Free Sample Lesson Component (keeping existing structure)
const FreeSampleLesson = () => {
  const [answers, setAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    crossword_2: '',
    crossword_3: '',
    crossword_4: '',
    crossword_6: '',
    crossword_7: '',
    crossword_1: '',
    crossword_5: '',
    crossword_8: '',
    reflection: ''
  });
  
  const [completed, setCompleted] = useState(false);
  const [crosswordChecked, setCrosswordChecked] = useState(false);
  const [crosswordResults, setCrosswordResults] = useState({});

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Reset crossword check when user changes answers
    if (questionId.startsWith('crossword')) {
      setCrosswordChecked(false);
    }
  };

  const correctCrosswordAnswers = {
    crossword_3: 'EXCELLENT',
    crossword_4: 'SACRIFICE',
    crossword_6: 'KEEPER',
    crossword_7: 'WALKED',
    crossword_1: 'FAITH',
    crossword_2: 'CAIN',
    crossword_5: 'TRANSLATED',
    crossword_8: 'ABEL'
  };

  const handleCheckCrossword = () => {
    const results = {};
    Object.keys(correctCrosswordAnswers).forEach(key => {
      const userAnswer = answers[key].trim().toUpperCase();
      const correctAnswer = correctCrosswordAnswers[key];
      results[key] = userAnswer === correctAnswer;
    });
    setCrosswordResults(results);
    setCrosswordChecked(true);
    
    const correctCount = Object.values(results).filter(r => r).length;
    if (correctCount === 8) {
      toast.success('Perfect! All answers are correct! 🎉');
    } else if (correctCount >= 5) {
      toast.success(`Great job! ${correctCount} out of 8 correct!`);
    } else {
      toast.info(`${correctCount} out of 8 correct. Keep trying!`);
    }
  };

  const handleSubmit = () => {
    const mainQuestions = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const answeredQuestions = mainQuestions.filter(q => answers[q].trim() !== '');
    
    if (answeredQuestions.length >= 3) {
      setCompleted(true);
      toast.success('Great work! You\'ve completed the sample lesson.');
    } else {
      toast.error('Please answer at least 3 questions to complete the lesson.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 p-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Free Sample Lesson</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Lesson Header with Multicultural Featured Image */}
        <div className="text-center mb-6 sm:mb-8">
          <div 
            className="w-full h-48 sm:h-64 bg-cover bg-center rounded-2xl mb-6 shadow-lg"
            style={{
              backgroundImage: "url('https://images.pexels.com/photos/8815225/pexels-photo-8815225.jpeg?w=800&h=400&fit=crop&crop=center')"
            }}
          />
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-800">My Brother's Keeper & Consistency Pays</h2>
          <Card className="bg-indigo-50 border-indigo-200 mb-6">
            <CardContent className="p-4 sm:p-6">
              <p className="text-base sm:text-lg font-semibold text-indigo-800 mb-2">Key Verse:</p>
              <p className="text-indigo-700 italic text-sm sm:text-base">"Now faith is the substance of things hoped for, the evidence of things not seen." - Hebrews 11:1</p>
            </CardContent>
          </Card>
          <p className="text-slate-600 text-sm sm:text-base"><strong>Background Scriptures:</strong> Genesis 4:1-11; Genesis 5:21-24; Hebrews 11</p>
        </div>

        {/* Lesson Teaching Content */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Lesson Overview</h3>
              <div className="space-y-4 text-slate-700">
                <p>In this lesson, we explore two powerful biblical narratives that teach us about faith, responsibility, and consistency in our walk with God.</p>
                
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
                  <p className="font-semibold text-amber-900">Key Themes:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Abel's faithful sacrifice and what it teaches us</li>
                    <li>Enoch's remarkable walk with God</li>
                    <li>The importance of being our brother's keeper</li>
                    <li>Faith that pleases God and brings rewards</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-lg mt-6">Abel's Example: Faith Through Sacrifice</h4>
                <p>Abel brought God the best of his flock - a "more excellent sacrifice" than Cain's offering. This wasn't just about what he gave, but the heart behind it. Abel gave with faith, believing that God was worthy of his best.</p>
                
                <p className="italic bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">"By faith Abel offered unto God a more excellent sacrifice than Cain, by which he obtained witness that he was righteous, God testifying of his gifts: and by it he being dead yet speaketh." - Hebrews 11:4</p>

                <h4 className="font-semibold text-lg mt-6">Enoch's Example: Consistent Walk</h4>
                <p>Enoch walked with God for 300 years! This wasn't a one-time event or occasional visit - it was a daily, consistent relationship. His faith was so pleasing to God that he was translated to heaven without seeing death.</p>
                
                <p className="italic bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">"By faith Enoch was translated that he should not see death; and was not found, because God had translated him: for before his translation he had this testimony, that he pleased God." - Hebrews 11:5</p>

                <h4 className="font-semibold text-lg mt-6">Being Your Brother's Keeper</h4>
                <p>When God asked Cain about Abel, Cain responded with the famous question, "Am I my brother's keeper?" The answer is YES! We are called to care for, support, and encourage our brothers and sisters in Christ. This is part of living out our faith in community.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Questions Section */}
        <div className="space-y-6 mb-8">
          <h3 className="text-2xl font-bold text-slate-800">Reflection Questions</h3>
          
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">1. What made Abel's sacrifice "more excellent" than Cain's?</label>
                <textarea
                  value={answers.q1}
                  onChange={(e) => handleAnswerChange('q1', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Share your thoughts..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">2. How can we apply Abel's example of giving our "best" to God in our daily lives?</label>
                <textarea
                  value={answers.q2}
                  onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Share your thoughts..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">3. What does it mean to "walk with God" like Enoch did?</label>
                <textarea
                  value={answers.q3}
                  onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Share your thoughts..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">4. In what practical ways can you be "your brother's keeper" this week?</label>
                <textarea
                  value={answers.q4}
                  onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Share your thoughts..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">5. How does consistency in our faith walk please God, according to Enoch's example?</label>
                <textarea
                  value={answers.q5}
                  onChange={(e) => handleAnswerChange('q5', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Share your thoughts..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Crossword Puzzle */}
        <div className="space-y-6 mb-8">
          <h3 className="text-2xl font-bold text-slate-800">Interactive Crossword Puzzle</h3>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-slate-600 mb-4">Fill in the crossword puzzle based on today's lesson. Use the clues below!</p>
              
              {/* Visual Crossword Grid */}
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200 mb-6 overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid grid-cols-10 gap-1" style={{width: 'fit-content'}}>
                    {/* Row 1 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700"><span className="absolute text-[8px] top-0 left-0 ml-0.5">1</span>F</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 2 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 3 - EXCELLENT */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">2</span>C</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">3</span>E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">X</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">C</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 border-amber-400 bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center text-xs font-bold">I</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">L</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    
                    {/* Row 4 - SACRIFICE */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">4</span>S</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">C</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">R</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 border-amber-400 bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center text-xs font-bold">T</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">F</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">I</div>
                    
                    {/* Row 5 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">I</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">H</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">C</div>
                    
                    {/* Row 6 - KEEPER */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">N</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">6</span>K</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">P</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    
                    {/* Row 7 - WALKED and TRANSLATED (crossing) */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 border-amber-400 bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">7</span>W</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">L</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">K</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-xs font-bold">D</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    
                    {/* Row 8 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">5</span>T</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 9 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 relative"><span className="absolute text-[8px] top-0 left-0 ml-0.5">8</span>A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">R</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 10 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">B</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 11 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">N</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 12 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">L</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">S</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 13 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">L</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 14 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 15 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">T</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 16 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    
                    {/* Row 17 */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center text-xs font-bold">D</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900"></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-indigo-900 mb-3">Across:</h4>
                <ul className="space-y-1 text-sm text-indigo-800 ml-4">
                  <li><strong>3.</strong> Abel's offering was more _______ than Cain's</li>
                  <li><strong>4.</strong> What Abel gave to God from his flock</li>
                  <li><strong>6.</strong> "Am I my brother's _______?"</li>
                  <li><strong>7.</strong> Enoch _______ with God for 300 years</li>
                </ul>
                
                <h4 className="font-semibold text-indigo-900 mb-3 mt-4">Down:</h4>
                <ul className="space-y-1 text-sm text-indigo-800 ml-4">
                  <li><strong>1.</strong> What we need to please God</li>
                  <li><strong>2.</strong> Abel's brother who killed him</li>
                  <li><strong>5.</strong> Enoch was _______ to heaven without dying</li>
                  <li><strong>8.</strong> The man who offered a more excellent sacrifice</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">3 Across</label>
                  <input
                    type="text"
                    value={answers.crossword_3}
                    onChange={(e) => handleAnswerChange('crossword_3', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_3 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">4 Across</label>
                  <input
                    type="text"
                    value={answers.crossword_4}
                    onChange={(e) => handleAnswerChange('crossword_4', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_4 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">6 Across</label>
                  <input
                    type="text"
                    value={answers.crossword_6}
                    onChange={(e) => handleAnswerChange('crossword_6', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_6 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">7 Across</label>
                  <input
                    type="text"
                    value={answers.crossword_7}
                    onChange={(e) => handleAnswerChange('crossword_7', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_7 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">1 Down</label>
                  <input
                    type="text"
                    value={answers.crossword_1}
                    onChange={(e) => handleAnswerChange('crossword_1', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_1 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">2 Down</label>
                  <input
                    type="text"
                    value={answers.crossword_2}
                    onChange={(e) => handleAnswerChange('crossword_2', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_2 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">5 Down</label>
                  <input
                    type="text"
                    value={answers.crossword_5}
                    onChange={(e) => handleAnswerChange('crossword_5', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_5 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">8 Down</label>
                  <input
                    type="text"
                    value={answers.crossword_8}
                    onChange={(e) => handleAnswerChange('crossword_8', e.target.value.toUpperCase())}
                    className={`w-full p-2 border-2 rounded focus:ring-2 focus:ring-indigo-500 ${
                      crosswordChecked 
                        ? crosswordResults.crossword_8 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Type answer..."
                    maxLength="15"
                  />
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button
                  onClick={handleCheckCrossword}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 px-6 py-2 rounded-xl"
                >
                  Check My Answers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Reflection */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Personal Application</h3>
              <label className="block font-semibold text-slate-700 mb-2">
                What is one specific way you will apply this lesson to your life this week? Write your commitment below:
              </label>
              <textarea
                value={answers.reflection}
                onChange={(e) => handleAnswerChange('reflection', e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="4"
                placeholder="My personal commitment..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Completion Button */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-8 py-3 rounded-xl font-semibold"
            disabled={completed}
          >
            {completed ? 'Lesson Completed! ✓' : 'Complete Sample Lesson'}
          </Button>
          
          {completed && (
            <div className="space-y-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 sm:p-6">
                  <p className="font-semibold text-emerald-800 mb-2">Congratulations!</p>
                  <p className="text-emerald-700">You've completed the sample lesson. Ready to unlock the full Kingdom Living Project experience with all nations represented?</p>
                </CardContent>
              </Card>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = '/#pricing'}
                  className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 rounded-xl"
                >
                  Choose Your Option - From $7.99/month
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-indigo-500 text-indigo-700 hover:bg-indigo-50 rounded-xl"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Lessons Listing Page
const LessonsListPage = () => {
  const location = useLocation();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(location.search);
  const quarter = queryParams.get('quarter');
  const month = queryParams.get('month');

  useEffect(() => {
    fetchLessons();
  }, [quarter, month]);

  const fetchLessons = async () => {
    try {
      let url = `${API}/lessons`;
      const params = [];
      if (quarter) params.push(`quarter=${quarter}`);
      if (month) params.push(`month=${month}`);
      
      // Check for bonus or extended type
      const lessonType = queryParams.get('type');
      if (lessonType) params.push(`type=${lessonType}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url);
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const getQuarterName = (q) => {
    const names = {
      1: 'Foundation',
      2: 'Relationships',
      3: 'Purpose',
      4: 'Maturity'
    };
    return names[q] || `Quarter ${q}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 p-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Home</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              {quarter && `Quarter ${quarter}: ${getQuarterName(parseInt(quarter))}`}
              {month && ` - Month ${month}`}
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No lessons available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="border border-indigo-200 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                  <CardTitle className="text-lg text-indigo-900">{lesson.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Q{lesson.quarter} M{lesson.month}</Badge>
                    {lesson.lesson_type === 'free' && <Badge className="text-xs bg-green-500">FREE</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600 mb-4">{lesson.description}</p>
                  <Button
                    onClick={() => window.location.href = `/lesson/${lesson.id}`}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
                  >
                    View Lesson
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Generic Lesson Viewer
const LessonViewer = () => {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchLesson();
    // Load saved answers from localStorage
    const savedAnswers = localStorage.getItem(`lesson_${lessonId}_answers`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await axios.get(`${API}/lessons/${lessonId}`);
      setLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (question, value) => {
    const newAnswers = { ...answers, [question]: value };
    setAnswers(newAnswers);
    // Auto-save to localStorage
    localStorage.setItem(`lesson_${lessonId}_answers`, JSON.stringify(newAnswers));
  };

  const renderContent = (content) => {
    if (!content) return null;
    
    // Replace textarea placeholders with actual React components
    const parts = content.split(/<textarea class="fillable-answer"[^>]*><\/textarea>/g);
    const textareas = content.match(/<textarea class="fillable-answer"[^>]*><\/textarea>/g) || [];
    
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        <div dangerouslySetInnerHTML={{ 
          __html: part
            .replace(/\n/g, '<br />')
            .replace(/### /g, '<h3>')
            .replace(/<h3>(.*?)<br \/>/g, '<h3>$1</h3>')
            .replace(/## /g, '<h2>')
            .replace(/<h2>(.*?)<br \/>/g, '<h2>$1</h2>')
            .replace(/# /g, '<h1>')
            .replace(/<h1>(.*?)<br \/>/g, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/---<br \/>/g, '<hr />')
        }} />
        {textareas[index] && (
          <textarea
            className="w-full p-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent my-4"
            rows="4"
            placeholder="Type your answer here..."
            value={answers[`q${index}`] || ''}
            onChange={(e) => handleAnswerChange(`q${index}`, e.target.value)}
          />
        )}
      </React.Fragment>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <p className="text-slate-600">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Lesson not found</p>
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 p-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Home</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">{lesson.section_theme}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Lesson Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-800">{lesson.title}</h2>
          <div className="flex justify-center gap-3 mb-4">
            <Badge variant="outline">Quarter {lesson.quarter}</Badge>
            <Badge variant="outline">Month {lesson.month}</Badge>
            <Badge className={lesson.lesson_type === 'free' ? 'bg-green-500' : 'bg-indigo-500'}>
              {lesson.lesson_type === 'free' ? 'FREE' : lesson.tier_access}
            </Badge>
          </div>
          <p className="text-slate-600">{lesson.description}</p>
        </div>

        {/* Lesson Content */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-slate max-w-none
              prose-headings:text-slate-800 
              prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:border-b prose-h1:pb-3
              prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-8
              prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-6
              prose-h4:text-lg prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4
              prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4
              prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4
              prose-li:text-slate-700 prose-li:mb-2
              prose-hr:my-8 prose-hr:border-slate-300
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 
              prose-blockquote:bg-indigo-50 prose-blockquote:p-4 
              prose-blockquote:italic prose-blockquote:text-indigo-900
              prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              {renderContent(lesson.content)}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => window.location.href = `/lessons?quarter=${lesson.quarter}&month=${lesson.month}`}
            variant="outline"
            className="mr-4"
          >
            Back to Lessons
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

// Dashboard component remains mostly the same
const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8 text-slate-800">Dashboard Coming Soon</h2>
        <p className="text-slate-600">The dashboard will be updated to support the new pricing tiers, multicultural community features, and bonus/seasonal content.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-4">
          Back to Home
        </Button>
      </div>
    </div>
  );
};

// Main App Component
// Import the new Soul Food landing page
import SoulFoodLanding from "./SoulFoodApp";
import GamingCentral from "./GamingCentral";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SoulFoodLanding />} />
          <Route path="/lesson/free-sample" element={<FreeSampleLesson />} />
          <Route path="/lesson/:id" element={<div>Lesson viewer coming soon</div>} />
          <Route path="/gaming-central" element={<GamingCentral />} />
          <Route path="/dashboard" element={<div>Dashboard coming soon</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;