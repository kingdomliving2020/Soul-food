import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MixUpGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const edition = searchParams.get('edition') || 'adult'; // youth or adult
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    askCongregation: true,
    scriptureHint: true,
    prayerPause: true
  });
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

  // Difficulty levels for 15 questions
  const difficulties = [
    ...Array(5).fill('easy'),
    ...Array(5).fill('medium'),
    ...Array(5).fill('hard')
  ];

  // Money ladder (Millionaire style)
  const moneyLadder = [
    '$100', '$200', '$300', '$500', '$1,000',
    '$2,000', '$4,000', '$8,000', '$16,000', '$32,000',
    '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000'
  ];

  useEffect(() => {
    // Fetch questions from backend
    fetchQuestions();
  }, [edition]);

  const fetchQuestions = async () => {
    try {
      // Mock questions for now - in production, fetch from backend
      const mockQuestions = generateMockQuestions();
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const generateMockQuestions = () => {
    // Generate 15 questions with progressive difficulty
    return difficulties.map((difficulty, index) => ({
      id: index + 1,
      difficulty,
      question: `${edition === 'youth' ? 'Youth' : 'Adult'} Question ${index + 1} (${difficulty}): What does the Bible teach about faith?`,
      options: [
        'Faith is believing without seeing',
        'Faith is trusting in God completely',
        'Faith is the substance of things hoped for',
        'Faith is demonstrated through actions'
      ],
      correct_answer: 'Faith is the substance of things hoped for',
      explanation: 'Hebrews 11:1 defines faith as the substance of things hoped for, the evidence of things not seen.',
      scripture_ref: 'Hebrews 11:1'
    }));
  };

  const use50_50 = () => {
    if (!lifelines.fiftyFifty || showResult) return;
    
    const correct = questions[currentQuestion].correct_answer;
    const options = questions[currentQuestion].options;
    const incorrect = options.filter(opt => opt !== correct);
    
    // Eliminate 2 wrong answers
    const toEliminate = incorrect.slice(0, 2);
    setEliminatedOptions(toEliminate);
    setLifelines({...lifelines, fiftyFifty: false});
  };

  const useAskCongregation = () => {
    if (!lifelines.askCongregation || showResult) return;
    
    alert('The congregation votes:\nOption A: 20%\nOption B: 45%\nOption C: 15%\nOption D: 20%');
    setLifelines({...lifelines, askCongregation: false});
  };

  const useScriptureHint = () => {
    if (!lifelines.scriptureHint || showResult) return;
    
    alert(`Scripture Hint: ${questions[currentQuestion].scripture_ref}\n\n${questions[currentQuestion].explanation}`);
    setLifelines({...lifelines, scriptureHint: false});
  };

  const usePrayerPause = () => {
    if (!lifelines.prayerPause || showResult) return;
    
    alert('Take a moment to pray and reflect... You have 30 extra seconds!');
    setLifelines({...lifelines, prayerPause: false});
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === questions[currentQuestion].correct_answer;
    if (isCorrect) {
      setScore(score + 1);
    } else {
      // Game over on wrong answer (Millionaire style)
      setGameOver(true);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setEliminatedOptions([]);
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
    setEliminatedOptions([]);
    setLifelines({
      fiftyFifty: true,
      askCongregation: true,
      scriptureHint: true,
      prayerPause: true
    });
    fetchQuestions();
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading questions...</div>
      </div>
    );
  }

  if (gameOver) {
    const finalMoney = moneyLadder[score - 1] || '$0';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-300">
            <CardContent className="p-12 text-center">
              <h2 className="text-5xl font-bold text-slate-800 mb-4">
                {score === 15 ? '🎉 CONGRATULATIONS! 🎉' : 'Game Over!'}
              </h2>
              <div className="text-6xl font-bold text-amber-600 mb-6">
                {finalMoney}
              </div>
              <p className="text-2xl text-slate-700 mb-8">
                You answered {score} out of 15 questions correctly!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={restartGame}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-8 py-4 text-lg"
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

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 text-lg mb-4">
            {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">Trivia Mix-Up</h1>
          <p className="text-purple-300">Millionaire Style Challenge</p>
        </div>

        {/* Money Ladder */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {moneyLadder.map((amount, index) => (
            <div
              key={index}
              className={`text-center py-2 rounded ${
                index === currentQuestion
                  ? 'bg-amber-500 text-white font-bold'
                  : index < currentQuestion
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {amount}
            </div>
          ))}
        </div>

        {/* Question Card */}
        <Card className="bg-white mb-6">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100">
            <CardTitle className="text-2xl">
              Question {currentQuestion + 1} of 15
              <Badge className="ml-4 bg-purple-600 text-white">
                {question.difficulty.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-2xl text-slate-800 mb-8 font-semibold">
              {question.question}
            </p>

            {/* Answer Options */}
            <div className="grid gap-4">
              {question.options.map((option, index) => {
                const isEliminated = eliminatedOptions.includes(option);
                const isSelected = selectedAnswer === option;
                const isCorrect = option === question.correct_answer;
                
                let buttonClass = 'w-full text-left p-6 text-lg font-semibold rounded-xl transition-all ';
                
                if (isEliminated) {
                  buttonClass += 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50';
                } else if (showResult) {
                  if (isCorrect) {
                    buttonClass += 'bg-green-500 text-white border-4 border-green-700';
                  } else if (isSelected) {
                    buttonClass += 'bg-red-500 text-white border-4 border-red-700';
                  } else {
                    buttonClass += 'bg-slate-100 text-slate-700';
                  }
                } else if (isSelected) {
                  buttonClass += 'bg-amber-200 border-4 border-amber-500';
                } else {
                  buttonClass += 'bg-slate-100 hover:bg-amber-100 hover:scale-105 border-2 border-slate-300';
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={isEliminated || showResult}
                    className={buttonClass}
                  >
                    <span className="font-bold mr-4">{String.fromCharCode(65 + index)}.</span>
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
                  {selectedAnswer === question.correct_answer ? '✅ Correct!' : '❌ Incorrect!'}
                </h4>
                <p className="text-slate-700 mb-2">{question.explanation}</p>
                <p className="text-sm text-slate-600">📖 {question.scripture_ref}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifelines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={use50_50}
            disabled={!lifelines.fiftyFifty || showResult}
            className={`p-6 ${
              lifelines.fiftyFifty
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">✂️</div>
              <div className="font-bold">50/50</div>
            </div>
          </Button>

          <Button
            onClick={useAskCongregation}
            disabled={!lifelines.askCongregation || showResult}
            className={`p-6 ${
              lifelines.askCongregation
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-bold">Ask Congregation</div>
            </div>
          </Button>

          <Button
            onClick={useScriptureHint}
            disabled={!lifelines.scriptureHint || showResult}
            className={`p-6 ${
              lifelines.scriptureHint
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📖</div>
              <div className="font-bold">Scripture Hint</div>
            </div>
          </Button>

          <Button
            onClick={usePrayerPause}
            disabled={!lifelines.prayerPause || showResult}
            className={`p-6 ${
              lifelines.prayerPause
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🙏</div>
              <div className="font-bold">Prayer Pause</div>
            </div>
          </Button>
        </div>

        {/* Next Button */}
        {showResult && !gameOver && (
          <div className="text-center">
            <Button
              onClick={nextQuestion}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-12 py-6 text-xl"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixUpGame;
