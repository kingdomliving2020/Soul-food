import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Millionaire Prize Ladder
const PRIZE_LADDER = [
  { level: 15, amount: "$1,000,000", color: "text-yellow-400" },
  { level: 14, amount: "$500,000", color: "text-yellow-300" },
  { level: 13, amount: "$250,000", color: "text-yellow-200" },
  { level: 12, amount: "$125,000", color: "text-orange-300" },
  { level: 11, amount: "$64,000", color: "text-orange-200" },
  { level: 10, amount: "$32,000", color: "text-orange-100" },
  { level: 9, amount: "$16,000", color: "text-red-300" },
  { level: 8, amount: "$8,000", color: "text-red-200" },
  { level: 7, amount: "$4,000", color: "text-red-100" },
  { level: 6, amount: "$2,000", color: "text-purple-300" },
  { level: 5, amount: "$1,000", color: "text-purple-200" },
  { level: 4, amount: "$500", color: "text-blue-300" },
  { level: 3, amount: "$300", color: "text-blue-200" },
  { level: 2, amount: "$200", color: "text-blue-100" },
  { level: 1, amount: "$100", color: "text-slate-300" }
];

const TriviaMixupGame = ({ mode = "demo", onExit }) => {
  const [gameState, setGameState] = useState("start"); // start, playing, answer_reveal, complete
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lifelines, setLifelines] = useState({
    fifty_fifty: true,
    ask_congregation: true,
    scripture_hint: true,
    prayer_pause: true
  });
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [score, setScore] = useState(0);
  const [removedOptions, setRemovedOptions] = useState([]);

  // Demo mode limits to 20 questions
  const maxQuestions = mode === "demo" ? 20 : 15;

  const startGame = async () => {
    try {
      // In production, fetch from API
      // const response = await fetch(`${API}/trivia/session/start`, {
      //   method: "POST",
      //   body: JSON.stringify({ mode, user_id: "demo_user" })
      // });
      
      // Mock first question for demo
      const mockQuestion = {
        id: 1,
        question: "In the Soul Food 'Prayer, the First Resort' quarter, which lesson focuses on Esther's story?",
        options: [
          "Esther: Second Is the Best",
          "Solomon: The Question That Unlocked a Legacy",
          "Jesus: Prayer as First Resort",
          "Paul & Silas: Faith in the Dark"
        ],
        difficulty: "easy",
        category: "Series Structure"
      };
      
      setCurrentQuestion(mockQuestion);
      setGameState("playing");
      setTimerActive(true);
    } catch (error) {
      toast.error("Failed to start game");
    }
  };

  const selectAnswer = (answer) => {
    if (gameState !== "playing") return;
    setSelectedAnswer(answer);
    setTimerActive(false);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;
    
    setGameState("answer_reveal");
    
    // Mock answer checking
    const isCorrect = selectedAnswer === "Esther: Second Is the Best";
    
    setTimeout(() => {
      if (isCorrect) {
        const points = PRIZE_LADDER.find(p => p.level === currentLevel)?.amount || "$100";
        toast.success(`Correct! You've won ${points}!`);
        
        if (currentLevel >= maxQuestions) {
          setGameState("complete");
          setScore(currentLevel);
        } else {
          setCurrentLevel(currentLevel + 1);
          // Load next question
          setGameState("playing");
          setSelectedAnswer(null);
          setRemovedOptions([]);
          setTimeRemaining(30);
          setTimerActive(true);
        }
      } else {
        toast.error("Wrong answer! Game over.");
        setGameState("complete");
        setScore(currentLevel - 1);
      }
    }, 2000);
  };

  const useLifeline = (lifeline) => {
    if (!lifelines[lifeline]) {
      toast.error("Lifeline already used!");
      return;
    }
    
    setLifelines({ ...lifelines, [lifeline]: false });
    
    if (lifeline === "fifty_fifty") {
      // Remove 2 wrong answers
      const correctAnswer = "Esther: Second Is the Best";
      const wrongAnswers = currentQuestion.options.filter(opt => opt !== correctAnswer);
      const toRemove = wrongAnswers.slice(0, 2);
      setRemovedOptions(toRemove);
      toast.success("50/50 used! Two wrong answers removed.");
    } else if (lifeline === "ask_congregation") {
      toast.info("Poll Results: 65% - A, 20% - B, 10% - C, 5% - D");
    } else if (lifeline === "scripture_hint") {
      toast.info("Scripture Hint: Esther 4:14 - 'For such a time as this'");
    } else if (lifeline === "prayer_pause") {
      setTimerActive(false);
      setTimeout(() => setTimerActive(true), 30000);
      toast.success("Timer paused for 30 seconds!");
    }
  };

  const walkAway = () => {
    setGameState("complete");
    setScore(currentLevel - 1);
    toast.success(`You walked away with ${PRIZE_LADDER.find(p => p.level === currentLevel - 1)?.amount || "$0"}!`);
  };

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timerActive && timeRemaining === 0) {
      toast.error("Time's up!");
      setGameState("complete");
      setScore(currentLevel - 1);
    }
  }, [timerActive, timeRemaining]);

  if (gameState === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-orange-50 to-amber-50 border-4 border-amber-400 shadow-2xl">
          <CardContent className="p-12 text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/f3i87r9n_Trivia%20Mix-up%20Demo%20Icon%20%281%29.png"
              alt="Trivia Mix-up"
              className="w-64 h-64 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Trivia Mix-up</h1>
            <p className="text-lg text-slate-600 mb-2">Who Wants to Be a Millionaire Style</p>
            {mode === "demo" && (
              <Badge className="bg-amber-500 text-white mb-6">DEMO MODE - 20 Questions</Badge>
            )}
            <p className="text-slate-700 mb-8">
              Answer 15 questions correctly to win $1,000,000 in Soul Food knowledge points!
            </p>
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-12 py-6 text-2xl font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all"
            >
              Start Game
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              className="ml-4 border-slate-400 text-slate-700"
            >
              Exit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-400 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Game Complete!</h1>
            <p className="text-2xl text-slate-700 mb-6">
              Final Prize: <span className="font-bold text-amber-600">
                {PRIZE_LADDER.find(p => p.level === score)?.amount || "$0"}
              </span>
            </p>
            <p className="text-lg text-slate-600 mb-8">
              You answered {score} questions correctly!
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  setGameState("start");
                  setCurrentLevel(1);
                  setScore(0);
                  setSelectedAnswer(null);
                  setLifelines({
                    fifty_fifty: true,
                    ask_congregation: true,
                    scripture_hint: true,
                    prayer_pause: true
                  });
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-8 py-4 text-xl font-bold rounded-xl"
              >
                Play Again
              </Button>
              <Button
                onClick={onExit}
                variant="outline"
                className="border-slate-400 text-slate-700 px-8 py-4 text-xl"
              >
                Exit to Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Prize Ladder - Left Side */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500 shadow-xl">
              <CardContent className="p-4">
                <h3 className="text-amber-400 font-bold text-center mb-4">Prize Ladder</h3>
                <div className="space-y-1">
                  {PRIZE_LADDER.map((prize) => (
                    <div
                      key={prize.level}
                      className={`p-2 rounded text-center font-bold ${
                        prize.level === currentLevel
                          ? "bg-amber-500 text-slate-900 scale-110 shadow-lg"
                          : prize.level < currentLevel
                          ? "bg-green-800 text-green-200"
                          : "bg-slate-700 text-slate-400"
                      } transition-all`}
                    >
                      {prize.amount}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Game Area - Center */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {/* Timer & Lifelines */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  onClick={() => useLifeline("fifty_fifty")}
                  disabled={!lifelines.fifty_fifty}
                  className={`${
                    lifelines.fifty_fifty
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-600 cursor-not-allowed"
                  } text-white font-bold px-4 py-2`}
                >
                  50:50
                </Button>
                <Button
                  onClick={() => useLifeline("ask_congregation")}
                  disabled={!lifelines.ask_congregation}
                  className={`${
                    lifelines.ask_congregation
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-slate-600 cursor-not-allowed"
                  } text-white font-bold px-4 py-2`}
                >
                  👥 Poll
                </Button>
                <Button
                  onClick={() => useLifeline("scripture_hint")}
                  disabled={!lifelines.scripture_hint}
                  className={`${
                    lifelines.scripture_hint
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-slate-600 cursor-not-allowed"
                  } text-white font-bold px-4 py-2`}
                >
                  📖 Hint
                </Button>
                <Button
                  onClick={() => useLifeline("prayer_pause")}
                  disabled={!lifelines.prayer_pause}
                  className={`${
                    lifelines.prayer_pause
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-slate-600 cursor-not-allowed"
                  } text-white font-bold px-4 py-2`}
                >
                  🙏 Pause
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`text-4xl font-bold ${timeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-white"}`}>
                  {timeRemaining}s
                </div>
                <Button onClick={walkAway} variant="outline" className="border-white text-white">
                  Walk Away
                </Button>
              </div>
            </div>

            {/* Question Card */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-amber-500 shadow-2xl">
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge className="bg-amber-500 text-white mb-2">
                    Question {currentLevel} of {maxQuestions}
                  </Badge>
                  <Badge className="bg-blue-500 text-white ml-2">
                    {currentQuestion?.difficulty}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-white mb-8">
                  {currentQuestion?.question}
                </h2>

                {/* Answer Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion?.options.map((option, index) => {
                    const isRemoved = removedOptions.includes(option);
                    const isSelected = selectedAnswer === option;
                    const label = ["A", "B", "C", "D"][index];
                    
                    return (
                      <Button
                        key={index}
                        onClick={() => selectAnswer(option)}
                        disabled={isRemoved || gameState === "answer_reveal"}
                        className={`${
                          isRemoved
                            ? "bg-slate-700 opacity-30 cursor-not-allowed"
                            : isSelected
                            ? "bg-amber-500 hover:bg-amber-600 scale-105 shadow-lg"
                            : "bg-blue-700 hover:bg-blue-600"
                        } text-white text-left p-6 text-lg font-semibold rounded-xl transition-all`}
                      >
                        <span className="font-bold mr-3">{label}:</span> {option}
                      </Button>
                    );
                  })}
                </div>

                {selectedAnswer && gameState === "playing" && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={submitAnswer}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-bold rounded-xl shadow-xl"
                    >
                      Final Answer?
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriviaMixupGame;
