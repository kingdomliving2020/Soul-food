/**
 * Multimedia Page - Videos, Audio, and Teaching Content
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Music, Video, Lock } from 'lucide-react';

const MultimediaPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');

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
      category: 'introduction'
    },
    {
      id: 'holiday-covenant',
      title: 'The 4 C\'s: The Covenant',
      description: 'Teaching by Pastor ME II - God\'s covenant promises',
      src: '/audio/holiday-covenant.m4a',
      duration: '8:45',
      free: false,
      category: 'holiday-series'
    },
    {
      id: 'holiday-cradle',
      title: 'The 4 C\'s: The Cradle',
      description: 'Teaching by Pastor ME II - The birth of Christ',
      src: '/audio/holiday-cradle.m4a',
      duration: '11:30',
      free: false,
      category: 'holiday-series'
    },
    {
      id: 'holiday-comforter',
      title: 'The 4 C\'s: The Comforter',
      description: 'Teaching by Pastor ME II - The Holy Spirit',
      src: '/audio/holiday-comforter.m4a',
      duration: '4:30',
      free: false,
      category: 'holiday-series'
    }
  ];

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

            <Button onClick={() => navigate('/quick-order')} className="bg-purple-600 hover:bg-purple-700">
              Shop Now
            </Button>
          </div>
        </div>
      </header>

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
            <h2 className="text-2xl font-bold text-slate-800">Audio Content</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {audioContent.map(audio => (
                <Card key={audio.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        audio.category === 'holiday-series' 
                          ? 'bg-gradient-to-br from-red-400 to-green-500' 
                          : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                      }`}>
                        <Music className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-slate-800">{audio.title}</h3>
                          {audio.free ? (
                            <Badge className="bg-green-500 text-xs">FREE</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{audio.description}</p>
                        {audio.free ? (
                          <audio controls className="w-full">
                            <source src={audio.src} type="audio/mp4" />
                            <source src={audio.src} type="audio/x-m4a" />
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <div className="bg-slate-100 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm">Purchase Holiday Series to unlock</span>
                            </div>
                            <Button size="sm" onClick={() => navigate('/quick-order')} className="bg-purple-600 hover:bg-purple-700">
                              Get Access
                            </Button>
                          </div>
                        )}
                        {audio.duration && (
                          <p className="text-xs text-slate-500 mt-2">Duration: {audio.duration}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* More Audio Coming */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-6 text-center">
                <Music className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="font-bold text-indigo-800 mb-2">More Audio Content Coming!</h3>
                <p className="text-indigo-600 text-sm">
                  Audio devotionals and study guides are in production for each lesson series.
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
