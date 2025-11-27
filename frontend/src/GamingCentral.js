import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GamingCentral = () => {
  const [userProfile, setUserProfile] = useState({
    edition: "adult", // "adult", "youth", "instructor"
    access_tier: "free", // "free", "day_pass", "subscription", "instructor"
    publish_results: false
  });

  const games = [
    {
      id: "trivia_mixup",
      name: "Trivia Mix-up",
      subtitle: "Who Wants to Be a Millionaire Style",
      description: "15-question progressive climb with lifelines! Test your Soul Food knowledge.",
      logo: "https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/bovn8pyf_Soul%20Food%20Trivia%20Logo%20-%20Vintage%20Style%20%282%29.png",
      demoIcon: "https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/5gzs35hl_Trivia%20Mix-up%20Demo%20Icon%20%281%29.png",
      edition_available: "adult", // Vintage logo = Adult only
      gradient: "from-amber-600 via-orange-600 to-red-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      icon: "🎯",
      modes: ["Practice", "Quarter Challenge", "Millionaire Mode"],
      hasDemo: true
    },
    {
      id: "tricky_testaments_youth",
      name: "Tricky Testaments",
      subtitle: "Youth Edition - Jeopardy Style",
      description: "Pick categories, answer in question form, and climb the board!",
      logo: "https://customer-assets.emergentagent.com/job_book-website-help/artifacts/c5c1ujck_Soul%20Food%27s%20Tricky%20Testaments%20-%20Bold%20Modern%20%281%29.png",
      demoIcon: "https://customer-assets.emergentagent.com/job_soul-cuisine/artifacts/xts56w3w_Tricky%20Testaments%20Demo%20Icon.png",
      edition_available: "youth",
      gradient: "from-blue-600 via-purple-600 to-pink-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-purple-50",
      icon: "🎮",
      modes: ["Single Player", "Challenge Mode", "Class Mode"],
      hasDemo: true
    },
    {
      id: "tricky_testaments_adult",
      name: "Tricky Testaments",
      subtitle: "Adult Edition - Jeopardy Style",
      description: "Classic Jeopardy with deeper theological questions and higher stakes!",
      logo: "https://customer-assets.emergentagent.com/job_book-website-help/artifacts/29d8ivo6_Soul%20Food%27s%20Tricky%20Testaments%20Logo%20%281%29.png",
      edition_available: "adult",
      gradient: "from-amber-700 via-yellow-700 to-orange-700",
      bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
      icon: "📚",
      modes: ["Single Player", "Daily Double", "Final Jeopardy"]
    }
  ];

  const accessTiers = {
    free: {
      name: "Preview Mode",
      color: "bg-slate-500",
      games_available: 1,
      questions_limit: 5
    },
    day_pass: {
      name: "Day Pass - $40",
      color: "bg-blue-600",
      games_available: 3,
      questions_limit: "Unlimited"
    },
    ebook_courtesy: {
      name: "eBook Courtesy",
      color: "bg-emerald-600",
      games_available: 2,
      questions_limit: 50
    },
    subscription: {
      name: "Full Access",
      color: "bg-purple-600",
      games_available: 3,
      questions_limit: "Unlimited"
    },
    instructor: {
      name: "Instructor",
      color: "bg-orange-600",
      games_available: 3,
      questions_limit: "Unlimited + Custom"
    }
  };

  const canAccessGame = (game) => {
    const { access_tier, edition } = userProfile;
    
    // Free tier can only preview
    if (access_tier === "free") {
      return game.id === "trivia_mixup"; // Allow preview of one game
    }
    
    // Check edition restrictions
    if (game.edition_available === "adult" && edition === "youth") {
      return false; // Youth can't access adult-only games
    }
    
    // Instructors can access everything
    if (access_tier === "instructor") {
      return true;
    }
    
    // Day pass and subscription can access all
    if (access_tier === "day_pass" || access_tier === "subscription") {
      return true;
    }
    
    // eBook courtesy has limited access
    if (access_tier === "ebook_courtesy") {
      return game.id !== "tricky_testaments_adult"; // Can't access advanced Jeopardy
    }
    
    return false;
  };

  const handleGameClick = (game) => {
    if (!canAccessGame(game)) {
      toast.error(`Upgrade to access ${game.name}!`, {
        description: "Purchase day pass ($40) or subscribe for full access."
      });
      return;
    }
    
    // Navigate to game
    toast.success(`Launching ${game.name}...`);
    // In production: navigate to game page
  };

  const handleEditionChange = (newEdition) => {
    setUserProfile(prev => ({ ...prev, edition: newEdition }));
    toast.success(`Switched to ${newEdition} edition`);
  };

  const handlePublishToggle = () => {
    setUserProfile(prev => ({ 
      ...prev, 
      publish_results: !prev.publish_results 
    }));
    toast.success(
      userProfile.publish_results 
        ? "Results set to private" 
        : "Results will be published to leaderboards"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/k75fu34t_Gaming%20Central%20Test%20Your%20Knowledge%20Logo.png"
                alt="Gaming Central"
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Gaming Central</h1>
                <p className="text-sm text-purple-300">Test Your Knowledge</p>
              </div>
            </div>
            
            {/* Access Tier Badge */}
            <div className="flex items-center space-x-4">
              <Badge className={`${accessTiers[userProfile.access_tier].color} text-white px-4 py-2`}>
                {accessTiers[userProfile.access_tier].name}
              </Badge>
              <Button 
                variant="outline" 
                className="border-purple-400 text-purple-300 hover:bg-purple-500/20"
                onClick={() => toast.info("Upgrade options coming soon!")}
              >
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* User Controls */}
        <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Edition Selector */}
            <div>
              <label className="text-white font-semibold mb-3 block">Your Edition:</label>
              <div className="flex flex-wrap gap-3">
                {["adult", "youth", "instructor"].map((ed) => (
                  <Button
                    key={ed}
                    onClick={() => handleEditionChange(ed)}
                    className={`${
                      userProfile.edition === ed
                        ? "bg-purple-600 text-white"
                        : "bg-white/20 text-purple-200 hover:bg-white/30"
                    }`}
                    disabled={ed === "instructor" && userProfile.access_tier !== "instructor"}
                  >
                    {ed === "adult" ? "👤 Adult" : ed === "youth" ? "🎓 Youth" : "📖 Instructor"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-purple-300 mt-2">
                {userProfile.edition === "adult" && "Access Adult or Youth games"}
                {userProfile.edition === "youth" && "Youth-appropriate content"}
                {userProfile.edition === "instructor" && "Full control - mix any combination"}
              </p>
            </div>

            {/* Leaderboard Opt-In */}
            <div>
              <label className="text-white font-semibold mb-3 block">Leaderboard:</label>
              <Button
                onClick={handlePublishToggle}
                className={`${
                  userProfile.publish_results
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-600 hover:bg-slate-700"
                } text-white`}
              >
                {userProfile.publish_results ? "✅ Publishing Results" : "🔒 Private Mode"}
              </Button>
              <p className="text-xs text-purple-300 mt-2">
                {userProfile.publish_results 
                  ? "Your scores will appear on Top 10 leaderboards"
                  : "Your scores are private and won't be shared"}
              </p>
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white text-center mb-4">Choose Your Challenge</h2>
          <p className="text-center text-purple-300 mb-8">
            Three epic games. One mission: Master Soul Food Scripture!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {games.map((game) => {
            const hasAccess = canAccessGame(game);
            
            return (
              <Card
                key={game.id}
                className={`relative overflow-hidden ${game.bgColor} border-2 ${
                  hasAccess ? "border-purple-400 shadow-2xl hover:scale-105" : "border-slate-400 opacity-60"
                } transition-all duration-300 cursor-pointer`}
                onClick={() => handleGameClick(game)}
              >
                {!hasAccess && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🔒</div>
                      <p className="text-white font-bold text-lg">Upgrade to Access</p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info("Purchase options coming soon!");
                        }}
                        className="mt-4 bg-purple-600 hover:bg-purple-700"
                      >
                        Get Access
                      </Button>
                    </div>
                  </div>
                )}

                <CardHeader className="relative p-0">
                  <div className="h-48 overflow-hidden flex items-center justify-center bg-white/90">
                    <img 
                      src={game.logo} 
                      alt={game.name}
                      className="max-h-44 w-auto object-contain"
                    />
                  </div>
                  <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${game.gradient} rounded-full flex items-center justify-center text-2xl shadow-lg`}>
                    {game.icon}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{game.name}</h3>
                  <p className="text-sm font-semibold text-purple-600 mb-3">{game.subtitle}</p>
                  <p className="text-slate-700 mb-4">{game.description}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Game Modes:</p>
                      <div className="flex flex-wrap gap-2">
                        {game.modes.map((mode, i) => (
                          <Badge key={i} className="bg-purple-100 text-purple-700 text-xs">
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className={`w-full ${
                        hasAccess
                          ? `bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white`
                          : "bg-slate-400 cursor-not-allowed text-white"
                      } font-bold py-3 rounded-xl transition-all`}
                      disabled={!hasAccess}
                    >
                      {hasAccess ? "Play Now →" : "Locked"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-white text-center mb-6">Your Gaming Stats</h3>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-400">23</div>
              <div className="text-sm text-purple-300">Games Played</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400">84%</div>
              <div className="text-sm text-purple-300">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400">5</div>
              <div className="text-sm text-purple-300">Badges Earned</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-400">#12</div>
              <div className="text-sm text-purple-300">Global Rank</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamingCentral;
