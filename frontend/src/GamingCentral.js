import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GamingCentral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [edition, setEdition] = useState(searchParams.get('edition') || 'youth');
  
  // Game data for each edition
  const games = {
    youth: [
      {
        id: 'mixup',
        name: 'Bible Mix-Up',
        description: 'Unscramble the letters to reveal Bible words and verses!',
        icon: '🔤',
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
        icon: '🎴',
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
        icon: '🔤',
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
              src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/k75fu34t_Gaming%20Central%20Test%20Your%20Knowledge%20Logo.png"
              alt="Gaming Central"
              className="h-12 w-12 rounded-xl"
            />
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            🎮 Gaming Central
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Test your Bible knowledge with fun, interactive games. 
            Learn scripture while having a blast!
          </p>
        </div>

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
              👦 Youth Edition
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
            {edition === 'youth' ? '👧 Ages 12-20 • Family Friendly' : '👨 Ages 21+ • Deeper Content'}
          </Badge>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentGames.map((game) => (
            <Card 
              key={game.id}
              className={`bg-white/10 backdrop-blur-md border-purple-400/30 hover:bg-white/15 transition-all ${
                game.available ? 'cursor-pointer' : 'opacity-70'
              }`}
              onClick={() => game.available && navigate(game.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{game.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{game.name}</h3>
                      {game.comingSoon && (
                        <Badge className="bg-amber-500/80 text-white text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-purple-200 text-sm mb-3">{game.description}</p>
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
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          Play Now →
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

        {/* Stats Section */}
        <div className="mt-12 text-center">
          <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 inline-block">
            <CardContent className="p-6">
              <div className="flex gap-8">
                <div>
                  <div className="text-3xl font-bold text-white">2</div>
                  <div className="text-purple-300 text-sm">Games Available</div>
                </div>
                <div className="border-l border-purple-500/30"></div>
                <div>
                  <div className="text-3xl font-bold text-white">2</div>
                  <div className="text-purple-300 text-sm">Coming Soon</div>
                </div>
                <div className="border-l border-purple-500/30"></div>
                <div>
                  <div className="text-3xl font-bold text-white">∞</div>
                  <div className="text-purple-300 text-sm">Fun to Have!</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
