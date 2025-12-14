import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SnackPacksPage = () => {
  const navigate = useNavigate();
  const [snackPacks, setSnackPacks] = useState([]);
  const [nibbles, setNibbles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packsResponse, nibblesResponse] = await Promise.all([
        fetch(`${API}/interactive-lessons/snack-packs`),
        fetch(`${API}/interactive-lessons/nibbles`)
      ]);
      
      if (packsResponse.ok) {
        const packsData = await packsResponse.json();
        setSnackPacks(packsData.snack_packs || []);
      }
      
      if (nibblesResponse.ok) {
        const nibblesData = await nibblesResponse.json();
        setNibbles(nibblesData.nibbles || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (nibbleId) => {
    navigate(`/interactive-lesson/${nibbleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading lessons...</p>
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
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src="/soul-food-logo.png" 
                alt="Soul Food Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">Snack Packs</h1>
                <p className="text-xs text-slate-600">Interactive Lessons</p>
              </div>
            </div>
            <div className="w-20" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Snack Packs
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Bite-sized interactive lessons designed for your spiritual growth. 
            Each pack contains 3-4 "nibbles" - engaging lessons with reflection questions and activities.
          </p>
        </div>

        {/* Snack Packs Grid */}
        {snackPacks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-2">🥡</span> Available Snack Packs
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {snackPacks.map((pack) => (
                <Card 
                  key={pack.id} 
                  className="border-2 border-indigo-200 hover:border-indigo-400 transition-all hover:shadow-xl cursor-pointer group"
                  onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                >
                  <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-600 text-white">
                        {pack.total_lessons} Lessons
                      </Badge>
                      {pack.is_free_sample && (
                        <Badge className="bg-emerald-500 text-white">FREE</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mt-2 group-hover:text-indigo-600 transition-colors">
                      {pack.title}
                    </CardTitle>
                    <p className="text-sm text-indigo-600 font-medium">{pack.series_name}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-slate-600 text-sm mb-4">{pack.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Download PDF</p>
                        <p className="font-bold text-lg text-slate-800">${pack.price_download}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500">Interactive</p>
                        <p className="font-bold text-lg text-indigo-600">${pack.price_interactive}</p>
                      </div>
                    </div>
                    
                    {pack.available_in && pack.available_in.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {pack.available_in.map(series => (
                          <Badge key={series} variant="outline" className="text-xs capitalize">
                            {series}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPack(pack);
                      }}
                    >
                      View Lessons
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Selected Pack Lessons */}
        {selectedPack && (
          <div className="mb-12 bg-white rounded-2xl border-2 border-indigo-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedPack.title}</h3>
                <p className="text-indigo-600">{selectedPack.series_name}</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedPack(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕ Close
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nibbles
                .filter(n => selectedPack.nibbles.includes(n.id))
                .map((nibble, index) => (
                  <Card 
                    key={nibble.id}
                    className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {nibble.lesson_number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{nibble.title}</h4>
                          <p className="text-xs text-slate-500">{nibble.key_verse_ref}</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleStartLesson(nibble.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        Start Lesson →
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* All Individual Nibbles */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="mr-2">📖</span> Individual Lessons (Nibbles)
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nibbles.map((nibble) => (
              <Card 
                key={nibble.id}
                className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {nibble.lesson_number}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {nibble.title}
                      </h4>
                      <p className="text-sm text-indigo-600">{nibble.series_name}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Key Verse</p>
                    <p className="text-sm text-slate-700 font-medium">{nibble.key_verse_ref}</p>
                  </div>
                  
                  <Button 
                    onClick={() => handleStartLesson(nibble.id)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 group-hover:shadow-lg transition-all"
                  >
                    <span className="mr-2">✨</span> Start Interactive Lesson
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {snackPacks.length === 0 && nibbles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Lessons Available Yet</h3>
            <p className="text-slate-600 mb-6">Check back soon for new interactive lessons!</p>
            <Button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700">
              Back to Home
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 px-4 mt-12">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/soul-food-logo.png" 
              alt="Soul Food Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h3 className="text-xl font-bold">Soul Food</h3>
              <p className="text-sm text-slate-400">Kingdom Living Project</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Putting on the whole armor of God and transforming lives through Kingdom principles
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SnackPacksPage;
