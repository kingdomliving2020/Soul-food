/**
 * Multimedia Page - Videos, Audio, and Teaching Content
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Music, Video, Lock, Ticket, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MultimediaPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('audio'); // Default to audio until videos are ready
  const [playingPreview, setPlayingPreview] = useState(null);
  
  // Audio code redemption state
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null); // { success: bool, message: string }

  const videos = [
    {
      id: 'a-friend',
      title: '"A Friend" by Kossi Bruno',
      description: 'Music video featuring the Soul Food theme song from DRC artist Kossi Bruno',
      youtubeId: 'p2XDayIVugk',
      category: 'music',
      free: true
    },
    {
      id: 'intro-adult',
      title: 'Soul Food Introduction (Adult Edition)',
      description: 'Welcome message and overview of the Break*fast series',
      youtubeId: null,
      category: 'teaching',
      free: false,
      comingSoon: true
    },
    {
      id: 'intro-youth',
      title: 'Soul Food Introduction (Youth Edition)',
      description: 'Welcome message tailored for young learners',
      youtubeId: null,
      category: 'teaching',
      free: false,
      comingSoon: true
    }
  ];

  const audioContent = [
    {
      id: 'why-soul-food',
      title: 'Why Soul Food?',
      description: 'Hear from Dr. Shefa D. Brown about the heart behind this ministry',
      src: '/audio/why-soul-food.m4a',
      duration: '2:30',
      free: true,
      category: 'introduction',
      lessonLink: null,
      thumbnail: '/images/dr-shefa-brown.png',
      icon: '🍽️'
    },
    {
      id: 'holiday-covenant',
      title: 'The 4 C\'s: The Covenant',
      description: 'Teaching by Pastor Mike Edwards - God\'s covenant promises through the ages',
      src: '/audio/holiday-covenant.m4a',
      duration: '8:45',
      free: false,
      category: 'holiday-series',
      lessonLink: '/lesson/holiday-ae-covenant',
      lessonTitle: '4 C\'s of Christianity - Lesson 1',
      thumbnail: '/images/team/pastor-mike-edwards.jpg',
      icon: '📜' // Scroll for covenant
    },
    {
      id: 'holiday-cradle',
      title: 'The 4 C\'s: The Cradle',
      description: 'Teaching by Pastor Mike Edwards - The birth of Christ and its significance',
      src: '/audio/holiday-cradle.m4a',
      duration: '11:30',
      free: false,
      category: 'holiday-series',
      lessonLink: '/lesson/holiday-ae-cradle',
      lessonTitle: '4 C\'s of Christianity - Lesson 2',
      thumbnail: '/images/team/pastor-mike-edwards.jpg',
      icon: '⭐' // Star for the nativity
    },
    {
      id: 'holiday-cross',
      title: 'The 4 C\'s: The Cross',
      description: 'Teaching by Pastor Mike Edwards - The sacrifice and redemption through Christ',
      src: '/audio/holiday-cross.m4a',
      duration: '4:30',
      free: false,
      category: 'holiday-series',
      lessonLink: '/lesson/holiday-ae-cross',
      lessonTitle: '4 C\'s of Christianity - Lesson 3',
      thumbnail: '/images/team/pastor-mike-edwards.jpg',
      icon: '✝️' // Cross
    },
    {
      id: 'holiday-comforter',
      title: 'The 4 C\'s: The Comforter',
      description: 'Teaching by Pastor Mike Edwards - The Holy Spirit as our guide and helper',
      src: '/audio/holiday-comforter.m4a',
      duration: '4:30',
      free: false,
      category: 'holiday-series',
      lessonLink: '/lesson/holiday-ae-comforter',
      lessonTitle: '4 C\'s of Christianity - Lesson 4',
      thumbnail: '/images/team/pastor-mike-edwards.jpg',
      icon: '🕊️' // Dove for Holy Spirit
    }
  ];

  // Handle 30-second preview playback (Amazon-style teaser)
  const handlePreviewPlay = (audioId, audioSrc) => {
    // Stop any currently playing preview
    const allPreviews = document.querySelectorAll('.audio-preview');
    allPreviews.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (playingPreview === audioId) {
      setPlayingPreview(null);
      return;
    }

    const previewAudio = document.getElementById(`preview-${audioId}`);
    if (previewAudio) {
      previewAudio.currentTime = 0;
      previewAudio.play();
      setPlayingPreview(audioId);

      // Stop after 30 seconds
      setTimeout(() => {
        if (previewAudio && !previewAudio.paused) {
          previewAudio.pause();
          previewAudio.currentTime = 0;
          setPlayingPreview(null);
        }
      }, 30000);

      // Handle natural end
      previewAudio.onended = () => {
        setPlayingPreview(null);
      };
    }
  };

  // Audio code redemption
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    setRedeemLoading(true);
    setRedeemResult(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/audio/codes/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: redeemCode.toUpperCase().trim(), 
          email: redeemEmail.trim() 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRedeemResult({ 
          success: true, 
          message: data.message || '🎉 Audio access unlocked!',
          seriesName: data.series_name,
          lessons: data.lessons_included
        });
        setRedeemCode('');
      } else {
        setRedeemResult({ 
          success: false, 
          message: data.detail || 'Failed to redeem code. Please check and try again.' 
        });
      }
    } catch (error) {
      setRedeemResult({ 
        success: false, 
        message: 'Connection error. Please try again.' 
      });
    }
    
    setRedeemLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Multimedia</h1>
                <p className="text-xs text-slate-500">Videos, Audio & More</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowRedeemModal(true)} 
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Ticket className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Redeem Code</span>
              </Button>
              <Button onClick={() => navigate('/quick-order')} className="bg-purple-600 hover:bg-purple-700">
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Audio Code Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowRedeemModal(false);
                setRedeemResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Redeem Audio Access Code</h3>
              <p className="text-sm text-slate-500 mt-1">Enter the code from your physical book purchase</p>
            </div>
            
            {redeemResult ? (
              <div className={`p-4 rounded-lg mb-4 ${redeemResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {redeemResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${redeemResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {redeemResult.message}
                    </p>
                    {redeemResult.success && redeemResult.seriesName && (
                      <p className="text-sm text-green-600 mt-1">
                        You now have access to: {redeemResult.seriesName}
                      </p>
                    )}
                  </div>
                </div>
                {redeemResult.success && (
                  <Button 
                    onClick={() => {
                      setShowRedeemModal(false);
                      setRedeemResult(null);
                    }}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    Start Listening
                  </Button>
                )}
              </div>
            ) : (
              <form onSubmit={handleRedeemCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="SF-XXXX-XXXX"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={redeemEmail}
                    onChange={(e) => setRedeemEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">Used to track your audio access</p>
                </div>
                <Button 
                  type="submit" 
                  disabled={redeemLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3"
                >
                  {redeemLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Unlock Audio Access'
                  )}
                </Button>
              </form>
            )}
            
            <p className="text-xs text-slate-400 text-center mt-4">
              Don't have a code? <a href="/quick-order" className="text-purple-600 hover:underline">Purchase a physical book</a> to get one!
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === 'videos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('videos')}
            className={activeTab === 'videos' ? 'bg-purple-600' : ''}
          >
            <Video className="w-4 h-4 mr-2" />
            Videos
          </Button>
          <Button
            variant={activeTab === 'audio' ? 'default' : 'outline'}
            onClick={() => setActiveTab('audio')}
            className={activeTab === 'audio' ? 'bg-purple-600' : ''}
          >
            <Music className="w-4 h-4 mr-2" />
            Audio
          </Button>
        </div>

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Videos</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-slate-200">
                    {video.youtubeId ? (
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        {video.comingSoon ? (
                          <div className="text-center">
                            <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <span className="text-slate-500 text-sm">Coming Soon</span>
                          </div>
                        ) : (
                          <Play className="w-12 h-12 text-slate-400" />
                        )}
                      </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-2 right-2">
                      {video.free ? (
                        <Badge className="bg-green-500">FREE</Badge>
                      ) : (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-bold text-slate-800 mb-1">{video.title}</h3>
                    <p className="text-sm text-slate-600">{video.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs capitalize">
                      {video.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* More Videos Coming */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Video className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-purple-800 mb-2">More Videos Coming!</h3>
                <p className="text-purple-600 text-sm">
                  Teaching videos for each series are in production. Subscribe to get notified when they're released.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Audio Content</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>30-second preview available for premium content</span>
              </div>
            </div>
            
            {/* Free Introduction Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">🎧</span>
                Introduction
              </h3>
              {audioContent.filter(a => a.category === 'introduction').map(audio => (
                <Card key={audio.id} className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Speaker Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-purple-200 shadow-md">
                        <img 
                          src={audio.thumbnail} 
                          alt="Speaker"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-slate-800">{audio.title}</h3>
                          <Badge className="bg-green-500 text-xs">FREE</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{audio.description}</p>
                        <audio controls className="w-full">
                          <source src={audio.src} type="audio/mp4" />
                          <source src={audio.src} type="audio/x-m4a" />
                          Your browser does not support the audio element.
                        </audio>
                        {audio.duration && (
                          <p className="text-xs text-slate-500 mt-2">Duration: {audio.duration}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Holiday Series Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg">✝️</span>
                4 C&apos;s of Christianity
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {audioContent.filter(a => a.category === 'holiday-series').map(audio => (
                  <Card key={audio.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Speaker Photo with Theme Icon Overlay */}
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-200 shadow-md">
                            <img 
                              src={audio.thumbnail} 
                              alt="Pastor Mike Edwards"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Theme Icon Badge */}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border-3 border-slate-900 flex items-center justify-center text-base shadow-lg">
                            {audio.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-slate-800">{audio.title}</h3>
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{audio.description}</p>
                          
                          {/* Lesson Link */}
                          {audio.lessonLink && (
                            <button
                              onClick={() => navigate(audio.lessonLink)}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium mb-3 flex items-center gap-1"
                            >
                              📖 View {audio.lessonTitle}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}

                          {/* Amazon-style Preview Button */}
                          <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                            {/* Hidden audio element for preview */}
                            <audio 
                              id={`preview-${audio.id}`}
                              className="audio-preview hidden"
                              src={audio.src}
                            />
                            
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handlePreviewPlay(audio.id, audio.src)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                  playingPreview === audio.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white border border-purple-300 text-purple-600 hover:bg-purple-50'
                                }`}
                              >
                                {playingPreview === audio.id ? (
                                  <>
                                    <span className="w-4 h-4 flex items-center justify-center">
                                      <span className="w-2 h-2 bg-white rounded-sm animate-pulse"></span>
                                    </span>
                                    Playing Preview...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    30-sec Preview
                                  </>
                                )}
                              </button>
                              
                              <Button 
                                size="sm" 
                                onClick={() => navigate('/quick-order')} 
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              >
                                Unlock Full Audio
                              </Button>
                            </div>
                            
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Purchase 4 C&apos;s of Christianity workbook to unlock full audio
                            </p>
                          </div>
                          
                          {audio.duration && (
                            <p className="text-xs text-slate-500 mt-2">Full Duration: {audio.duration}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* More Audio Coming */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-6 text-center">
                <Music className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="font-bold text-indigo-800 mb-2">More Audio Content Coming!</h3>
                <p className="text-indigo-600 text-sm">
                  Audio devotionals and study guides are in production for the Break*fast series.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MultimediaPage;
