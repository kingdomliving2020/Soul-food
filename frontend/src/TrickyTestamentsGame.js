import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Demo board: 2 YE categories + 2 AE categories + 2 locked
const DEMO_CATEGORIES = [
  { id: 1, name: "Ruth & Naomi", type: "youth", locked: false },
  { id: 2, name: "Prayer Warriors", type: "youth", locked: false },
  { id: 3, name: "Unlock Full Version", type: "locked", locked: true },
  { id: 4, name: "Upgrade for More!", type: "locked", locked: true },
  { id: 5, name: "Names of God", type: "adult", locked: false },
  { id: 6, name: "City Bound", type: "adult", locked: false }
];

const POINT_VALUES = [100, 200, 300, 400, 500];

const TrickyTestamentsGame = ({ edition = "demo", onExit }) => {
  const [gameState, setGameState] = useState("start"); // start, playing, daily_double, answer_reveal, complete
  const [board, setBoard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [answeredCells, setAnsweredCells] = useState(new Set());
  const [dailyDoublePositions, setDailyDoublePositions] = useState([]);
  const [wager, setWager] = useState(0);

  useEffect(() => {
    if (gameState === "start") {
      initializeBoard();
    }
  }, []);

  const initializeBoard = () => {
    // Create 6x5 board
    const newBoard = [];
    for (let catIndex = 0; catIndex < 6; catIndex++) {
      const category = DEMO_CATEGORIES[catIndex];
      const column = POINT_VALUES.map((value, rowIndex) => ({
        categoryId: category.id,
        categoryName: category.name,
        categoryType: category.type,
        locked: category.locked,
        value: value,
        cellId: `${catIndex}-${rowIndex}`,
        answered: false
      }));
      newBoard.push(column);
    }
    setBoard(newBoard);

    // Place Daily Doubles: 1 in youth section (cols 0-1), 1 in adult section (cols 4-5)
    const youthDD = `${Math.random() < 0.5 ? 0 : 1}-${Math.floor(Math.random() * 5)}`;
    const adultDD = `${Math.random() < 0.5 ? 4 : 5}-${Math.floor(Math.random() * 5)}`;
    setDailyDoublePositions([youthDD, adultDD]);
  };

  const startGame = () => {
    setGameState("playing");
    toast.success("Pick a category and point value!");
  };

  const selectCell = (colIndex, rowIndex) => {
    const cell = board[colIndex][rowIndex];
    
    if (cell.locked) {
      toast.error("Upgrade to unlock this category!");
      return;
    }
    
    if (answeredCells.has(cell.cellId)) {
      toast.warning("Question already answered!");
      return;
    }

    setSelectedCell(cell);

    // Check if Daily Double
    if (dailyDoublePositions.includes(cell.cellId)) {
      setGameState("daily_double");
      toast.success("🎯 DAILY DOUBLE! Make your wager!");
    } else {
      loadQuestion(cell);
    }
  };

  const makeDailyDoubleWager = () => {
    if (wager < 5 || wager > Math.max(playerScore, 1000)) {
      toast.error(`Wager must be between $5 and $${Math.max(playerScore, 1000)}`);
      return;
    }
    loadQuestion(selectedCell, true);
  };

  const loadQuestion = (cell, isDailyDouble = false) => {
    // Mock question - in production, fetch from API
    const mockQuestion = {
      category: cell.categoryName,
      value: cell.value,
      question: `This woman said, "Where you go I will go, and your God will be my God."`,
      answer: "Who is Ruth?",
      correctAnswer: "Ruth",
      isDailyDouble: isDailyDouble
    };
    
    setCurrentQuestion(mockQuestion);
    setGameState("playing");
  };

  const submitAnswer = (userAnswer) => {
    setGameState("answer_reveal");
    
    // Mock answer checking
    const isCorrect = userAnswer.toLowerCase().includes("ruth");
    
    setTimeout(() => {
      if (isCorrect) {
        const points = currentQuestion.isDailyDouble ? wager : selectedCell.value;
        setPlayerScore(playerScore + points);
        toast.success(`Correct! +$${points}`);
      } else {
        const points = currentQuestion.isDailyDouble ? wager : selectedCell.value;
        setPlayerScore(Math.max(0, playerScore - points));
        toast.error(`Wrong! The answer was: ${currentQuestion.answer}`);
      }
      
      // Mark cell as answered
      setAnsweredCells(new Set([...answeredCells, selectedCell.cellId]));
      
      // Check if board is complete (all unlocked cells answered)
      const unlockedCells = board.flat().filter(c => !c.locked);
      if (answeredCells.size + 1 >= unlockedCells.length) {
        setTimeout(() => setGameState("complete"), 1500);
      } else {
        setCurrentQuestion(null);
        setSelectedCell(null);
        setWager(0);
        setGameState("playing");
      }
    }, 2000);
  };

  if (gameState === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-amber-50 to-yellow-50 border-4 border-amber-600 shadow-2xl">
          <CardContent className="p-12 text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_book-website-help/artifacts/bsug6l3b_Tricky%20Testaments%20Demo%20Icon.png"
              alt="Tricky Testaments"
              className="w-64 h-64 mx-auto mb-6 rounded-full"
            />
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Tricky Testaments</h1>
            <p className="text-lg text-slate-600 mb-2">Jeopardy Style Bible Challenge</p>
            {edition === "demo" && (
              <Badge className="bg-amber-600 text-white mb-6">
                DEMO MODE - 2 Youth + 2 Adult Categories
              </Badge>
            )}
            <p className="text-slate-700 mb-4">
              Pick categories, answer in question form, and watch out for Daily Doubles!
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-blue-100 p-3 rounded">
                <div className="font-bold text-blue-800">Youth Edition</div>
                <div className="text-blue-600">2 Categories Available</div>
              </div>
              <div className="bg-purple-100 p-3 rounded">
                <div className="font-bold text-purple-800">Adult Edition</div>
                <div className="text-purple-600">2 Categories Available</div>
              </div>
            </div>
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-6 text-2xl font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-400 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Game Complete!</h1>
            <p className="text-3xl text-amber-600 font-bold mb-6">
              Final Score: ${playerScore}
            </p>
            <p className="text-lg text-slate-600 mb-8">
              {playerScore >= 2000 ? "Outstanding knowledge of Scripture!" : 
               playerScore >= 1000 ? "Great job! Keep studying!" :
               "Good effort! Try again to improve!"}
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  setGameState("start");
                  setPlayerScore(0);
                  setAnsweredCells(new Set());
                  setCurrentQuestion(null);
                  setSelectedCell(null);
                  initializeBoard();
                }}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-xl font-bold rounded-xl"
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

  if (gameState === "daily_double") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-yellow-200 to-orange-300 border-4 border-yellow-500 shadow-2xl animate-pulse">
          <CardContent className="p-12 text-center">
            <div className="text-8xl mb-6 animate-bounce">💎</div>
            <h1 className="text-5xl font-bold text-slate-900 mb-6">DAILY DOUBLE!</h1>
            <p className="text-2xl text-slate-800 mb-8">Make your wager!</p>
            <div className="mb-6">
              <p className="text-lg text-slate-700 mb-4">
                Current Score: ${playerScore}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Wager between $5 and ${Math.max(playerScore, 1000)}
              </p>
              <input
                type="number"
                min="5"
                max={Math.max(playerScore, 1000)}
                value={wager}
                onChange={(e) => setWager(parseInt(e.target.value) || 0)}
                className="w-full max-w-xs p-4 text-2xl text-center font-bold rounded-xl border-4 border-amber-600"
                placeholder="Enter wager"
              />
            </div>
            <Button
              onClick={makeDailyDoubleWager}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-6 text-2xl font-bold rounded-xl shadow-xl"
            >
              Lock In Wager
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex justify-between items-center">
            <div className="text-white text-2xl font-bold">Score: ${playerScore}</div>
            <Badge className={`${
              currentQuestion.isDailyDouble ? "bg-yellow-500" : "bg-blue-500"
            } text-white text-lg px-4 py-2`}>
              {currentQuestion.isDailyDouble ? `💎 Daily Double - $${wager}` : `$${currentQuestion.value}`}
            </Badge>
          </div>

          <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 border-4 border-blue-500 shadow-2xl">
            <CardContent className="p-12">
              <div className="mb-6 text-center">
                <Badge className="bg-amber-500 text-white text-lg mb-4">
                  {currentQuestion.category}
                </Badge>
              </div>
              
              <div className="bg-blue-800 p-8 rounded-xl mb-8">
                <h2 className="text-3xl font-bold text-white text-center">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="mb-6">
                <label className="text-white font-semibold mb-2 block">Your Answer (in question form):</label>
                <input
                  type="text"
                  placeholder="Who is...? or What is...?"
                  className="w-full p-4 text-xl rounded-xl border-4 border-blue-500 bg-white"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      submitAnswer(e.target.value);
                    }
                  }}
                  id="answer-input"
                  autoFocus
                />
              </div>

              <div className="text-center">
                <Button
                  onClick={() => {
                    const answer = document.getElementById("answer-input").value;
                    submitAnswer(answer);
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-bold rounded-xl shadow-xl"
                >
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Jeopardy Board
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Tricky Testaments</h1>
          <div className="text-3xl font-bold text-amber-400">Score: ${playerScore}</div>
        </div>

        {/* 6x5 Jeopardy Board */}
        <div className="grid grid-cols-6 gap-2">
          {/* Category Headers */}
          {DEMO_CATEGORIES.map((cat, index) => (
            <div
              key={`header-${index}`}
              className={`${
                cat.locked 
                  ? "bg-slate-700 opacity-50" 
                  : cat.type === "youth" 
                  ? "bg-gradient-to-br from-blue-600 to-cyan-600" 
                  : "bg-gradient-to-br from-purple-600 to-pink-600"
              } p-4 text-center font-bold text-white rounded-t-xl border-4 ${
                cat.locked ? "border-slate-600" : cat.type === "youth" ? "border-blue-400" : "border-purple-400"
              }`}
            >
              {cat.locked ? (
                <div className="flex flex-col items-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="text-xs">{cat.name}</div>
                </div>
              ) : (
                <div>
                  <div className="text-xs mb-1">{cat.type === "youth" ? "Youth" : "Adult"}</div>
                  <div className="text-sm">{cat.name}</div>
                </div>
              )}
            </div>
          ))}

          {/* Question Cells */}
          {POINT_VALUES.map((value, rowIndex) => (
            DEMO_CATEGORIES.map((cat, colIndex) => {
              const cell = board[colIndex]?.[rowIndex];
              const isAnswered = cell && answeredCells.has(cell.cellId);
              const isLocked = cat.locked;
              
              return (
                <button
                  key={`cell-${colIndex}-${rowIndex}`}
                  onClick={() => !isAnswered && !isLocked && selectCell(colIndex, rowIndex)}
                  disabled={isAnswered || isLocked}
                  className={`${
                    isLocked
                      ? "bg-slate-800 cursor-not-allowed opacity-40"
                      : isAnswered
                      ? "bg-slate-900 cursor-not-allowed opacity-50"
                      : cat.type === "youth"
                      ? "bg-blue-700 hover:bg-blue-600 cursor-pointer hover:scale-105"
                      : "bg-purple-700 hover:bg-purple-600 cursor-pointer hover:scale-105"
                  } p-8 text-center font-bold text-3xl text-amber-400 rounded-xl border-4 ${
                    isLocked ? "border-slate-700" : cat.type === "youth" ? "border-blue-500" : "border-purple-500"
                  } transition-all shadow-lg`}
                >
                  {isLocked ? "🔒" : isAnswered ? "✓" : `$${value}`}
                </button>
              );
            })
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={onExit}
            variant="outline"
            className="border-white text-white hover:bg-white/20"
          >
            Exit Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrickyTestamentsGame;
