import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { 
  Book, Download, Gift, Shield, User, LogOut, 
  Star, ChevronRight, Loader2, Award, Settings,
  Music, Play, Pause, Headphones
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyLibrary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState({ points: 0, available_rewards: [] });
  const [redeemingReward, setRedeemingReward] = useState(false);
  
  // Audio library state
  const [audioAccess, setAudioAccess] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  
  const token = localStorage.getItem('soul_food_token');
  
  useEffect(() => {
    if (!token) {
      navigate('/auth', { state: { returnTo: '/my-library' } });
      return;
    }
    
    // Check if we have user data in localStorage (from login)
    const storedUser = localStorage.getItem('soul_food_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setLoading(false);
        
        // Only fetch from API if not a beta user
        if (!userData.is_beta) {
          fetchUserData();
        }
      } catch (e) {
        fetchUserData();
      }
    } else {
      fetchUserData();
    }
    
    fetchPurchases();
    fetchRewards();
    fetchAudioAccess();
  }, [token, navigate]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('soul_food_user', JSON.stringify(data));
      } else {
        // Token might be expired
        localStorage.removeItem('soul_food_token');
        localStorage.removeItem('soul_food_user');
        navigate('/auth', { state: { returnTo: '/my-library' } });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`${API}/payments/my-purchases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch(`${API}/auth/rewards/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  };

  const fetchAudioAccess = async () => {
    // Get email from stored user or fetch it
    const storedUser = localStorage.getItem('soul_food_user');
    let email = null;
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        email = userData.email;
      } catch (e) {}
    }
    
    if (!email) return;
    
    try {
      const response = await fetch(`${API}/audio/access/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.has_access) {
          setAudioAccess(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audio access:', err);
    }
  };

  const playAudio = (audioId, audioSrc) => {
    if (playingAudio === audioId) {
      // Pause current
      if (audioElement) {
        audioElement.pause();
        setPlayingAudio(null);
      }
    } else {
      // Stop any playing audio
      if (audioElement) {
        audioElement.pause();
      }
      
      // Play new
      const audio = new Audio(audioSrc);
      audio.play();
      setAudioElement(audio);
      setPlayingAudio(audioId);
      
      audio.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const handleRedeemReward = async (points) => {
    setRedeemingReward(true);
    try {
      const response = await fetch(`${API}/auth/rewards/redeem?points_to_redeem=${points}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Success! Your discount code: ${data.discount_code}`);
        fetchRewards(); // Refresh balance
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to redeem');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRedeemingReward(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('soul_food_token');
    localStorage.removeItem('soul_food_user');
    localStorage.removeItem('soul_food_session');
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-slate-800"
              >
                <img src="/soul-food-logo.png" alt="Soul Food" className="h-12 w-12" />
              </Button>
              <h1 className="text-xl font-bold text-slate-800">My Library</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/quick-order')}
                className="hidden sm:flex"
              >
                Browse Store
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-slate-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* User Welcome Card */}
        <Card className="mb-8 border-2 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Welcome, {user?.name?.split(' ')[0] || 'User'}!
                  </h2>
                  <p className="text-slate-500">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${
                      user?.role === 'instructor' || user?.role === 'admin' 
                        ? 'bg-purple-600' 
                        : 'bg-slate-500'
                    }`}>
                      {user?.role || 'Member'}
                    </Badge>
                    {user?.tfa_enabled && (
                      <Badge className="bg-green-600 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        2FA Enabled
                      </Badge>
                    )}
                    {user?.google_linked && (
                      <Badge className="bg-blue-600">Google Linked</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {!user?.tfa_enabled && (
                  <Button
                    onClick={() => navigate('/2fa-setup')}
                    variant="outline"
                    className="flex-1 sm:flex-initial border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => navigate('/account-settings')}
                  className="flex-1 sm:flex-initial"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Purchases & Downloads */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Purchases */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-purple-600" />
                  My Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Book className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No purchases yet</h3>
                    <p className="text-slate-500 mb-6">Start your spiritual journey with Soul Food today!</p>
                    <Button
                      onClick={() => navigate('/quick-order')}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      Browse Store
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl">
                            📚
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{purchase.product_name}</h4>
                            <p className="text-sm text-slate-500">
                              Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {purchase.download_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(purchase.download_url, '_blank')}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* My Audio Library */}
            {audioAccess && audioAccess.has_access && (
              <Card className="shadow-lg border-purple-200">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-purple-600" />
                    My Audio Library
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {audioAccess.series_access.map((seriesId) => {
                      const seriesContent = audioAccess.audio_content?.[seriesId];
                      if (!seriesContent) return null;
                      
                      return (
                        <div key={seriesId} className="border border-purple-200 rounded-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-3">
                            <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                              <Music className="w-4 h-4" />
                              {seriesContent.name}
                            </h4>
                            <p className="text-xs text-purple-600">{seriesContent.lessons?.length || 0} audio lessons</p>
                          </div>
                          <div className="divide-y divide-purple-100">
                            {seriesContent.lessons?.map((lesson) => (
                              <div 
                                key={lesson.id}
                                className="flex items-center justify-between p-3 hover:bg-purple-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => playAudio(lesson.id, `/audio/${seriesId}-${lesson.id}.m4a`)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                      playingAudio === lesson.id 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                    }`}
                                  >
                                    {playingAudio === lesson.id ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                  </button>
                                  <div>
                                    <p className="font-medium text-slate-800">{lesson.title}</p>
                                    <p className="text-xs text-slate-500">{lesson.speaker} • {lesson.duration}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-purple-600 border-purple-200">
                                  Unlocked
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/multimedia')}
                      className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      View All Audio Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Access */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-amber-50">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/lesson/free-sample')}
                    className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Free Sample Lesson</h4>
                        <p className="text-sm text-slate-500">Try our "Leap of Faith" lesson</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/snack-packs')}
                    className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Snack Packs</h4>
                        <p className="text-sm text-slate-500">Interactive mini-lessons</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/gaming-central')}
                    className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Gaming Central</h4>
                        <p className="text-sm text-slate-500">Test your knowledge</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/multimedia')}
                    className="p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Multimedia</h4>
                        <p className="text-sm text-slate-500">Videos & audio content</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Rewards */}
          <div className="space-y-6">
            {/* Rewards Points Card */}
            <Card className="shadow-lg border-2 border-amber-200">
              <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Soul Food Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-amber-600 mb-1">
                    {rewards.points}
                  </div>
                  <p className="text-slate-600">Points Available</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Worth ${(rewards.points * 0.05).toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600 font-medium mb-2">How to Earn:</p>
                  <p className="text-sm text-slate-500">
                    🎁 Earn 1 point for every $10 spent on Soul Food products!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    🎉 <span className="text-amber-600 font-medium">First Purchase Bonus:</span> Get 10 extra points on your first order!
                  </p>
                </div>
                
                {rewards.available_rewards?.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Available Rewards:</p>
                    {rewards.available_rewards.map((reward, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-amber-50/50"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{reward.description}</p>
                          <p className="text-sm text-slate-500">{reward.points} points</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRedeemReward(reward.points)}
                          disabled={redeemingReward}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          {redeemingReward ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 text-sm">
                      Earn 50+ points to unlock rewards!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Gift Certificate Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Gift Certificates</h3>
                    <p className="text-sm text-slate-500">Share the blessing!</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/gift-certificates')}
                  variant="outline"
                  className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  Buy a Gift Certificate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white/80 border-t border-slate-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 Soul Food - Kingdom Living Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MyLibrary;
