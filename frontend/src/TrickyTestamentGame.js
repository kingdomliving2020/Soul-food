import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TrickyTestamentGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const edition = searchParams.get('edition') || 'adult'; // youth or adult
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [dailyDoubleRevealed, setDailyDoubleRevealed] = useState(false);
  const [dailyDoubleIndex, setDailyDoubleIndex] = useState(null);
  const [wager, setWager] = useState(0);

  // Point values escalating
  const pointValues = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000];

  useEffect(() => {
    // Fetch questions from backend
    fetchQuestions();
  }, [edition]);

  const fetchQuestions = async () => {
    try {
      // Mock questions for now
      const mockQuestions = generateMockQuestions();
      setQuestions(mockQuestions);
      
      // Random Daily Double between questions 3-8
      const ddIndex = Math.floor(Math.random() * 6) + 3;
      setDailyDoubleIndex(ddIndex);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const generateMockQuestions = () => {
    const categories = ['Old Testament', 'New Testament', 'Prophets', 'Miracles', 'Parables'];
    
    return Array(10).fill(null).map((_, index) => ({
      id: index + 1,
      category: categories[Math.floor(Math.random() * categories.length)],
      points: pointValues[index],
      question: `${edition === 'youth' ? 'Youth' : 'Adult'} Jeopardy Question ${index + 1}`,
      answer: `What is ${edition === 'youth' ? 'a youth answer' : 'an adult answer'}?`,
      options: [
        `What is ${edition === 'youth' ? 'option A' : 'advanced option A'}?`,
        `Who is ${edition === 'youth' ? 'option B' : 'advanced option B'}?`,
        `What are ${edition === 'youth' ? 'option C' : 'advanced option C'}?`,
        `Where is ${edition === 'youth' ? 'option D' : 'advanced option D'}?`
      ],
      correct_answer: `What is ${edition === 'youth' ? 'a youth answer' : 'an adult answer'}?`,
      explanation: 'This demonstrates biblical knowledge in Jeopardy format.',
      scripture_ref: 'Sample Scripture'
    }));
  };

  const handleDailyDoubleWager = (amount) => {
    setWager(amount);
    setDailyDoubleRevealed(false);
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === questions[currentQuestion].correct_answer;
    
    if (currentQuestion === dailyDoubleIndex) {
      // Daily Double scoring
      if (isCorrect) {
        setScore(score + wager);
      } else {
        setScore(score - wager);
      }
    } else {
      // Regular scoring
      if (isCorrect) {
        setScore(score + questions[currentQuestion].points);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      
      // Check if next question is Daily Double
      if (currentQuestion + 1 === dailyDoubleIndex) {
        setDailyDoubleRevealed(true);
      }
    } else {
      setGameOver(true);
    }
  };

  const restartGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setDailyDoubleRevealed(false);
    setWager(0);
    fetchQuestions();
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading questions...</div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-purple-300">
            <CardContent className="p-12 text-center">
              <h2 className="text-5xl font-bold text-slate-800 mb-4">
                {score >= 5000 ? '🏆 Champion! 🏆' : 'Game Complete!'}
              </h2>
              <div className="text-6xl font-bold text-purple-600 mb-6">
                {score} Points
              </div>
              <p className="text-2xl text-slate-700 mb-8">
                You completed all 10 Jeopardy-style questions!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={restartGame}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 text-lg"
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-8 py-4 text-lg"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Daily Double modal
  if (dailyDoubleRevealed && !showResult && wager === 0) {
    const maxWager = Math.max(score, 1000);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-400 max-w-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-6xl font-bold text-yellow-600 mb-6 animate-pulse">
              💰 DAILY DOUBLE! 💰
            </h2>
            <p className="text-2xl text-slate-800 mb-4">
              You found the hidden Daily Double!
            </p>
            <p className="text-xl text-slate-700 mb-8">
              Current Score: <strong>{score} points</strong>
            </p>
            <p className="text-lg text-slate-600 mb-6">
              How much do you want to wager?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDailyDoubleWager(500)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 text-lg"
              >
                Wager $500
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(1000)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 text-lg"
              >
                Wager $1,000
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(Math.floor(score / 2))}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-lg"
                disabled={score === 0}
              >
                Wager Half ({Math.floor(score / 2)})
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(maxWager)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg"
              >
                All In! ({maxWager})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isDaily Double = currentQuestion === dailyDoubleIndex && !dailyDoubleRevealed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 text-lg mb-4">
            {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">Tricky Testaments</h1>
          <p className="text-purple-300">Jeopardy Style Challenge</p>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-sm">Total Points</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{currentQuestion + 1}/10</div>
              <div className="text-sm">Questions</div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="bg-white mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">
                {question.category}
                {currentQuestion === dailyDoubleIndex && wager > 0 && (
                  <Badge className="ml-4 bg-yellow-500 text-white">
                    💰 DAILY DOUBLE - Wager: ${wager}
                  </Badge>
                )}
              </CardTitle>
              <Badge className="bg-purple-600 text-white text-lg">
                {currentQuestion === dailyDoubleIndex && wager > 0 
                  ? `Wager: ${wager}` 
                  : `${question.points} Points`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="bg-blue-900 text-white p-6 rounded-lg mb-8 text-center">
              <p className="text-2xl font-semibold">
                {question.question}
              </p>
            </div>

            {/* Answer Options (in Jeopardy format) */}
            <div className="grid gap-4">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === question.correct_answer;
                
                let buttonClass = 'w-full text-left p-6 text-lg font-semibold rounded-xl transition-all ';
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass += 'bg-green-500 text-white border-4 border-green-700';
                  } else if (isSelected) {
                    buttonClass += 'bg-red-500 text-white border-4 border-red-700';
                  } else {
                    buttonClass += 'bg-slate-100 text-slate-700';
                  }
                } else if (isSelected) {
                  buttonClass += 'bg-purple-200 border-4 border-purple-500';
                } else {
                  buttonClass += 'bg-slate-100 hover:bg-purple-100 hover:scale-105 border-2 border-slate-300';
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    className={buttonClass}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className={`mt-6 p-6 rounded-xl ${
                selectedAnswer === question.correct_answer
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-red-50 border-2 border-red-500'
              }`}>
                <h4 className="font-bold text-lg mb-2">
                  {selectedAnswer === question.correct_answer 
                    ? `✅ Correct! +${currentQuestion === dailyDoubleIndex ? wager : question.points} points` 
                    : `❌ Incorrect! ${currentQuestion === dailyDoubleIndex ? `-${wager} points` : 'No points'}`}
                </h4>
                <p className="text-slate-700 mb-2"><strong>Correct Answer:</strong> {question.correct_answer}</p>
                <p className="text-slate-700 mb-2">{question.explanation}</p>
                <p className="text-sm text-slate-600">📖 {question.scripture_ref}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Button */}
        {showResult && !gameOver && (
          <div className="text-center">
            <Button
              onClick={nextQuestion}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-6 text-xl"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrickyTestamentGame;
