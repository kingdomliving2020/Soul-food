import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, AlertTriangle, Zap, Timer, TrendingUp, Shield, Lock, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Format minutes to hours:minutes display
const formatTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '∞';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

// Progress bar component
const TimeProgressBar = ({ used, total, label }) => {
  const percentage = total ? Math.min((used / total) * 100, 100) : 0;
  const isWarning = percentage > 75;
  const isCritical = percentage > 90;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-purple-300">{label}</span>
        <span className={`font-medium ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`}>
          {formatTime(used)} / {formatTime(total)}
        </span>
      </div>
      <div className="h-3 bg-black/30 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' :
            isWarning ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
            'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const GamingCentral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [edition, setEdition] = useState(searchParams.get('edition') || 'youth');
  
  // Session management state
  const [sessionStatus, setSessionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [entitlements, setEntitlements] = useState(null);
  
  // Get user ID (from localStorage or generate guest ID)
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      // Check if logged in
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id || userData._id || userData.email;
        } catch (e) {}
      }
      if (!userId) {
        // Generate guest ID
        userId = `guest_${Date.now().toString(36)}`;
        localStorage.setItem('userId', userId);
      }
    }
    return userId;
  };

  // Heartbeat interval ref
  const heartbeatInterval = useRef(null);

  // Fetch session status
  const fetchSessionStatus = useCallback(async () => {
    try {
      const userId = getUserId();
      const token = localStorage.getItem('token');
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/gaming/status?user_id=${userId}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data);
        
        // Show upgrade prompt if near limit
        if (data.remaining_minutes !== null && data.remaining_minutes < 30) {
          setShowUpgradePrompt(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch session status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start gaming session
  const startSession = async (gameType = 'jeopardy') => {
    setStartingSession(true);
    setError(null);
    
    try {
      const userId = getUserId();
      const token = localStorage.getItem('token');
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/gaming/start?user_id=${userId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ game_type: gameType })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store session ID
        localStorage.setItem('gamingSessionId', data.session_id);
        
        // Start heartbeat
        startHeartbeat(data.session_id);
        
        // Refresh status
        await fetchSessionStatus();
        
        return true;
      } else {
        setError(data.detail || 'Could not start session');
        return false;
      }
    } catch (err) {
      setError('Failed to start gaming session');
      return false;
    } finally {
      setStartingSession(false);
    }
  };

  // Send heartbeat
  const sendHeartbeat = async (sessionId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/gaming/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      const data = await response.json();
      
      if (!data.active) {
        // Session ended (timeout or limit reached)
        stopHeartbeat();
        localStorage.removeItem('gamingSessionId');
        await fetchSessionStatus();
        
        if (data.message?.includes('limit')) {
          setError('Daily time limit reached. Come back tomorrow!');
        } else if (data.message?.includes('idle')) {
          setError('Session ended due to inactivity');
        }
      } else {
        // Update remaining time
        setSessionStatus(prev => ({
          ...prev,
          remaining_minutes: data.remaining_minutes,
          session_remaining_minutes: data.session_remaining_minutes
        }));
      }
    } catch (err) {
      console.error('Heartbeat failed:', err);
    }
  };

  // Start heartbeat interval
  const startHeartbeat = (sessionId) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    
    // Send heartbeat every 60 seconds
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat(sessionId);
    }, 60000);
    
    // Send first heartbeat immediately
    sendHeartbeat(sessionId);
  };

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  // End session
  const endSession = async () => {
    const sessionId = localStorage.getItem('gamingSessionId');
    if (!sessionId) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/gaming/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, reason: 'user_ended' })
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    } finally {
      stopHeartbeat();
      localStorage.removeItem('gamingSessionId');
      await fetchSessionStatus();
    }
  };

  // Handle game launch
  const handlePlayGame = async (game) => {
    if (!game.available) return;
    
    // Check if we have an active session or need to start one
    const existingSessionId = localStorage.getItem('gamingSessionId');
    
    if (!existingSessionId && sessionStatus?.active_session === null) {
      // Need to start a session first
      const started = await startSession(game.id);
      if (!started) return;
    }
    
    // Navigate to game
    navigate(game.route);
  };

  // Initialize
  useEffect(() => {
    fetchSessionStatus();

    // Fetch entitlements
    (async () => {
      try {
        const token = localStorage.getItem('soul_food_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${BACKEND_URL}/api/trivia/entitlements/me`, { headers });
        if (res.ok) {
          const data = await res.json();
          setEntitlements(data);
        }
      } catch {}
    })();
    
    // Check for existing session
    const existingSessionId = localStorage.getItem('gamingSessionId');
    if (existingSessionId) {
      startHeartbeat(existingSessionId);
    }
    
    // Cleanup on unmount
    return () => {
      stopHeartbeat();
    };
  }, [fetchSessionStatus]);

  // Game data for each edition
  const games = {
    youth: [
      {
        id: 'mixup',
        name: 'Bible Mix-Up',
        description: 'Unscramble the letters to reveal Bible words and verses!',
        icon: '📝',
        difficulty: 'Easy',
        route: '/game/mixup?edition=youth',
        available: true
      },
      {
        id: 'tricky-testament',
        name: 'Tricky Testament',
        description: 'Test your Bible knowledge with fun true/false questions!',
        icon: '❓',
        difficulty: 'Medium',
        route: '/game/tricky-testament?edition=youth',
        available: true
      },
      {
        id: 'word-search',
        name: 'Word Search',
        description: 'Find hidden Bible words in the puzzle grid!',
        icon: '🔍',
        difficulty: 'Easy',
        route: '/game/word-search?edition=youth',
        available: false,
        comingSoon: true
      },
      {
        id: 'memory-match',
        name: 'Memory Match',
        description: 'Match Bible verses with their references!',
        icon: '🃏',
        difficulty: 'Medium',
        route: '/game/memory-match?edition=youth',
        available: false,
        comingSoon: true
      }
    ],
    adult: [
      {
        id: 'mixup',
        name: 'Bible Mix-Up',
        description: 'Unscramble theological terms and deeper Bible concepts!',
        icon: '📝',
        difficulty: 'Medium',
        route: '/game/mixup?edition=adult',
        available: true
      },
      {
        id: 'tricky-testament',
        name: 'Tricky Testament',
        description: 'Challenge your Bible knowledge with advanced questions!',
        icon: '❓',
        difficulty: 'Hard',
        route: '/game/tricky-testament?edition=adult',
        available: true
      },
      {
        id: 'millionaire-presenter',
        name: 'Millionaire — Presenter Mode',
        description: 'Instructor-led elimination round. Multiple teams. Last team standing wins.',
        icon: '🏆',
        difficulty: 'Instructor',
        route: '/game/millionaire-presenter',
        available: true
      },
      {
        id: 'word-search',
        name: 'Word Search',
        description: 'Find theological terms and Bible names in the puzzle!',
        icon: '🔍',
        difficulty: 'Medium',
        route: '/game/word-search?edition=adult',
        available: false,
        comingSoon: true
      },
      {
        id: 'scripture-sprint',
        name: 'Scripture Sprint',
        description: 'Race against time to complete Bible verses!',
        icon: '⚡',
        difficulty: 'Hard',
        route: '/game/scripture-sprint?edition=adult',
        available: false,
        comingSoon: true
      }
    ]
  };

  const currentGames = games[edition] || games.youth;
  const hasActiveSession = sessionStatus?.active_session !== null;
  const tierInfo = sessionStatus?.tier || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              ← Back to Home
            </Button>
            <img 
              src="/game-logos/gaming-central.png"
              alt="Gaming Central"
              className="h-14 w-14 rounded-xl"
            />
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            🎮 Gaming Central
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Test your Bible knowledge with fun, interactive games. 
            Learn scripture while having a blast!
          </p>
        </div>

        {/* Session Status Panel */}
        <Card className="bg-black/40 backdrop-blur-md border-purple-500/30 mb-8">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tier & Status Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hasActiveSession ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      {hasActiveSession ? (
                        <Play className="w-5 h-5 text-green-400" />
                      ) : (
                        <Pause className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{tierInfo.name || 'Free/Beta Access'}</p>
                      <p className="text-purple-300 text-sm">
                        {hasActiveSession ? 'Session Active' : 'No Active Session'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasActiveSession ? (
                      <Button
                        onClick={endSession}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        End Session
                      </Button>
                    ) : (
                      <Badge className="bg-purple-500/30 text-purple-300 px-3 py-1">
                        <Timer className="w-4 h-4 mr-1 inline" />
                        {tierInfo.daily_limit_hours ? `${tierInfo.daily_limit_hours}hr daily limit` : 'Unlimited'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Time Progress */}
                {sessionStatus?.daily_limit_minutes && (
                  <TimeProgressBar
                    used={sessionStatus.used_today_minutes || 0}
                    total={sessionStatus.daily_limit_minutes}
                    label="Today's Usage"
                  />
                )}

                {/* Remaining Time Display */}
                {sessionStatus?.remaining_minutes !== null && sessionStatus?.remaining_minutes !== undefined && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    sessionStatus.remaining_minutes < 15 
                      ? 'bg-red-500/20 border border-red-500/30' 
                      : sessionStatus.remaining_minutes < 30 
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-green-500/20 border border-green-500/30'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      sessionStatus.remaining_minutes < 15 ? 'text-red-400' :
                      sessionStatus.remaining_minutes < 30 ? 'text-amber-400' : 'text-green-400'
                    }`} />
                    <span className="text-white font-medium">
                      {formatTime(sessionStatus.remaining_minutes)} remaining today
                    </span>
                    {sessionStatus.remaining_minutes < 30 && (
                      <span className="text-amber-300 text-sm ml-auto">
                        Time running low!
                      </span>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300">{error}</span>
                  </div>
                )}

                {/* Idle Timeout Warning */}
                {tierInfo.idle_timeout_minutes && hasActiveSession && (
                  <p className="text-purple-400 text-sm text-center">
                    ⏱️ Sessions auto-end after {tierInfo.idle_timeout_minutes} minutes of inactivity
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-amber-400" />
                  <div>
                    <p className="text-white font-semibold">Running low on time?</p>
                    <p className="text-amber-200 text-sm">Upgrade your pass for more daily playtime!</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/quick-order')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Pass
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edition Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-black/30 p-1.5 rounded-2xl inline-flex gap-2">
            <button
              onClick={() => setEdition('youth')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                edition === 'youth'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-purple-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🧢✨ Youth Edition
            </button>
            <button
              onClick={() => setEdition('adult')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                edition === 'adult'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'text-purple-300 hover:text-white hover:bg-white/10'
              }`}
            >
              👨 Adult Edition
            </button>
          </div>
        </div>

        {/* Edition Badge */}
        <div className="text-center mb-8">
          <Badge className={`text-lg px-4 py-2 ${
            edition === 'youth' 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
              : 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
          }`}>
            {edition === 'youth' ? 'Ages 12-20 • Family Friendly' : 'Ages 21+ • Deeper Content'}
          </Badge>

          {/* Unlocked Content Summary */}
          {entitlements && (
            <div className="mt-4 flex flex-wrap justify-center gap-3" data-testid="unlocked-content-summary">
              {['holiday_4c', 'breakfast'].map(s => {
                const unlocked = entitlements.series?.includes(s);
                const label = s === 'holiday_4c' ? 'Holiday 4C\'s' : 'Break*fast';
                return (
                  <div key={s} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    unlocked ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-white/5 text-purple-400 border border-white/10'
                  }`} data-testid={`content-status-${s}`}>
                    {unlocked ? <CheckCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {label} {unlocked ? 'Unlocked' : 'Demo'}
                  </div>
                );
              })}
              {entitlements.has_audio && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40" data-testid="audio-entitlement">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Lesson Audio
                </div>
              )}
            </div>
          )}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentGames.map((game) => (
            <Card 
              key={game.id}
              className={`bg-white/10 backdrop-blur-md border-purple-400/30 hover:bg-white/15 transition-all ${
                game.available ? 'cursor-pointer' : 'opacity-70'
              }`}
              onClick={() => handlePlayGame(game)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 flex items-center justify-center text-5xl flex-shrink-0">{game.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{game.name}</h3>
                      {game.comingSoon && (
                        <Badge className="bg-amber-500/80 text-white text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-purple-200 text-sm mb-3">{game.description}</p>
                    {/* Content access indicator */}
                    {entitlements && !game.comingSoon && (
                      <p className={`text-xs mb-2 ${entitlements.access_level === 'full' ? 'text-green-400' : 'text-purple-400'}`}>
                        {entitlements.access_level === 'full'
                          ? `Full question bank — ${entitlements.series?.join(', ').replace('holiday_4c', '4C\'s').replace('breakfast', 'Break*fast')}`
                          : 'Demo questions — purchase to unlock full bank'}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className={`
                        ${game.difficulty === 'Easy' ? 'bg-green-500/30 text-green-300' : ''}
                        ${game.difficulty === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' : ''}
                        ${game.difficulty === 'Hard' ? 'bg-red-500/30 text-red-300' : ''}
                      `}>
                        {game.difficulty}
                      </Badge>
                      {game.available ? (
                        <Button
                          size="sm"
                          disabled={startingSession}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {startingSession ? 'Loading...' : 'Play Now →'}
                        </Button>
                      ) : (
                        <span className="text-purple-400 text-sm">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Offline Games Section */}
        <div className="mt-14" data-testid="offline-games-section">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Table Talk Games</h2>
            <p className="text-purple-300 text-sm">Print &amp; play at home, in class, or at your ministry gathering</p>
            {entitlements && !entitlements.has_instructor && (
              <p className="text-amber-300/70 text-xs mt-2">
                <Lock className="w-3 h-3 inline mr-1" />
                Offline game packs require the Instructor Bundle upgrade
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GRinCH Cards */}
            <Card className="bg-gradient-to-br from-red-900/40 to-red-700/20 border-red-500/30 hover:border-red-400/50 transition-all cursor-pointer"
              onClick={() => navigate('/instructor-toolbox')}
              data-testid="offline-grinch"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-red-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-black text-red-300">G</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">GRinCH Cards</h3>
                    <p className="text-xs text-red-300 font-semibold mb-2">Grid Iron Challenge</p>
                    <p className="text-purple-200 text-sm mb-3">
                      Jeopardy-style card decks organized by character and section. 
                      Perfect for group nights and classroom review.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-red-500/20 text-red-200 text-xs">4Cs Holiday</Badge>
                      <Badge className="bg-red-500/20 text-red-200 text-xs">Break*fast</Badge>
                      <Badge className="bg-red-500/20 text-red-200 text-xs">Printable</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passport Trek */}
            <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-700/20 border-emerald-500/30 hover:border-emerald-400/50 transition-all cursor-pointer"
              onClick={() => navigate('/instructor-toolbox')}
              data-testid="offline-passport"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-black text-emerald-300">P</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Passport Trek</h3>
                    <p className="text-xs text-emerald-300 font-semibold mb-2">Stamp Collection Tracker</p>
                    <p className="text-purple-200 text-sm mb-3">
                      Track progress through biblical journeys. Earn stamps as you complete 
                      lessons and game rounds.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-emerald-500/20 text-emerald-200 text-xs">Journey Maps</Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-200 text-xs">Stamp Cards</Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-200 text-xs">Printable</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tier Info Cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Your Game Access</h2>
          {entitlements ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className={`border ${entitlements.access_level === 'full' ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <CardContent className="p-4 text-center">
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${entitlements.access_level === 'full' ? 'text-green-400' : 'text-gray-400'}`} />
                  <h3 className="text-white font-bold">Question Bank</h3>
                  <p className={`text-sm ${entitlements.access_level === 'full' ? 'text-green-300' : 'text-gray-400'}`}>
                    {entitlements.access_level === 'full' ? 'Full pool unlocked' : 'Demo (10 questions)'}
                  </p>
                </CardContent>
              </Card>
              <Card className={`border ${entitlements.has_instructor ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <CardContent className="p-4 text-center">
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${entitlements.has_instructor ? 'text-indigo-400' : 'text-gray-400'}`} />
                  <h3 className="text-white font-bold">Game Duration</h3>
                  <p className={`text-sm ${entitlements.has_instructor ? 'text-indigo-300' : 'text-purple-300'}`}>
                    {entitlements.has_instructor ? '3-Hour Pass (Instructor)' : entitlements.access_level === 'full' ? '1-Hour Pass' : '30 min/day (Free)'}
                  </p>
                </CardContent>
              </Card>
              <Card className={`border ${entitlements.has_audio ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <CardContent className="p-4 text-center">
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${entitlements.has_audio ? 'text-amber-400' : 'text-gray-400'}`} />
                  <h3 className="text-white font-bold">Lesson Audio</h3>
                  <p className={`text-sm ${entitlements.has_audio ? 'text-amber-300' : 'text-gray-400'}`}>
                    {entitlements.has_audio ? 'Included with purchase' : 'Not included'}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">Separate from game access</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Free/Beta', time: '30 min/day', idle: '10 min', color: 'gray' },
                { name: '1-Hour Pass', time: '1 hr/session', idle: '20 min', color: 'blue', price: 'With purchase' },
                { name: '3-Hour Pass', time: '3 hrs/session', idle: '30 min', color: 'purple', price: 'Instructor Bundle' },
                { name: 'Ministry', time: '6 hrs/day', idle: '40 min', color: 'amber', price: '$24.99/mo' },
              ].map((tier) => (
                <Card key={tier.name} className={`bg-${tier.color}-500/10 border-${tier.color}-500/30`}>
                  <CardContent className="p-4 text-center">
                    <Shield className={`w-8 h-8 mx-auto mb-2 text-${tier.color}-400`} />
                    <h3 className="text-white font-bold">{tier.name}</h3>
                    <p className="text-purple-300 text-sm">{tier.time}</p>
                    <p className="text-purple-400 text-xs">Idle: {tier.idle}</p>
                    {tier.price && (
                      <Badge className="mt-2 bg-green-500/20 text-green-300">{tier.price}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-purple-300 mb-4">Want more? Check out our interactive lessons!</p>
          <Button
            onClick={() => navigate('/snack-packs')}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold px-8 py-3"
          >
            📚 Browse Lessons
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 text-white py-6 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-purple-400 text-sm">
            Soul Food Gaming Central | Test Your Knowledge, Grow Your Faith
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GamingCentral;
