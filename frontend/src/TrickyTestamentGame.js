import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TrickyTestamentGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const edition = searchParams.get('edition') || 'adult'; // youth or adult
  
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showBoard, setShowBoard] = useState(true);
  const [dailyDoubleRevealed, setDailyDoubleRevealed] = useState(false);
  const [dailyDoubleIndex, setDailyDoubleIndex] = useState(null);
  const [wager, setWager] = useState(0);

  // Jeopardy board structure: 5 categories x 2 point values each
  const categories = edition === 'youth' 
    ? ['Creation Stories', 'Famous Miracles', 'Bible Heroes', 'Famous Prayers', 'Animals in the Bible']
    : ['Pauline Theology', 'Messianic Prophecies', 'Covenants', 'Systematic Theology', 'Spiritual Gifts'];
  
  const pointValues = [100, 200];

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
    const youthQuestions = [
      {
        category: 'Creation Stories',
        question: 'God created this on the first day',
        options: ['What is light?', 'What is the sun?', 'What are plants?', 'What are animals?'],
        correct_answer: 'What is light?',
        explanation: "On the first day of creation, God said 'Let there be light,' and there was light.",
        scripture_ref: 'Genesis 1:3',
        points: 100
      },
      {
        category: 'Creation Stories',
        question: 'The number of days it took God to create the world',
        options: ['What is six?', 'What is seven?', 'What is five?', 'What is eight?'],
        correct_answer: 'What is six?',
        explanation: 'God created the world in six days and rested on the seventh day.',
        scripture_ref: 'Genesis 1:31-2:2',
        points: 200
      },
      {
        category: 'Famous Miracles',
        question: 'Jesus walked on this',
        options: ['What is water?', 'What is sand?', 'What are clouds?', 'What is fire?'],
        correct_answer: 'What is water?',
        explanation: 'Jesus walked on water during a storm, demonstrating His power over nature.',
        scripture_ref: 'Matthew 14:22-33',
        points: 100
      },
      {
        category: 'Famous Miracles',
        question: 'The number of loaves Jesus used to feed 5,000 people',
        options: ['What is five?', 'What is two?', 'What is seven?', 'What is twelve?'],
        correct_answer: 'What is five?',
        explanation: 'Jesus fed 5,000 people with five loaves and two fish.',
        scripture_ref: 'Matthew 14:17-21',
        points: 200
      },
      {
        category: 'Bible Heroes',
        question: 'The strongest man in the Bible',
        options: ['Who is Samson?', 'Who is David?', 'Who is Goliath?', 'Who is Joshua?'],
        correct_answer: 'Who is Samson?',
        explanation: 'Samson was given supernatural strength by God as long as he kept his Nazirite vow.',
        scripture_ref: 'Judges 13-16',
        points: 100
      },
      {
        category: 'Bible Heroes',
        question: 'The disciple who doubted Jesus rose from the dead',
        options: ['Who is Thomas?', 'Who is Peter?', 'Who is John?', 'Who is James?'],
        correct_answer: 'Who is Thomas?',
        explanation: 'Thomas doubted until he saw Jesus and touched His wounds.',
        scripture_ref: 'John 20:24-29',
        points: 200
      },
      {
        category: 'Famous Prayers',
        question: "This prayer starts with 'Our Father'",
        options: ["What is the Lord's Prayer?", 'What is a blessing?', 'What is a psalm?', 'What is a hymn?'],
        correct_answer: "What is the Lord's Prayer?",
        explanation: "Jesus taught His disciples the Lord's Prayer, which begins with 'Our Father in heaven.'",
        scripture_ref: 'Matthew 6:9-13',
        points: 100
      },
      {
        category: 'Famous Prayers',
        question: 'The number of times Jesus prayed in the Garden of Gethsemane',
        options: ['What is three?', 'What is one?', 'What is seven?', 'What is twelve?'],
        correct_answer: 'What is three?',
        explanation: 'Jesus prayed three times in the Garden before His arrest.',
        scripture_ref: 'Matthew 26:39-44',
        points: 200
      },
      {
        category: 'Animals in the Bible',
        question: 'This animal talked to Balaam',
        options: ['What is a donkey?', 'What is a snake?', 'What is a lion?', 'What is a dove?'],
        correct_answer: 'What is a donkey?',
        explanation: "God opened the mouth of Balaam's donkey to speak and warn him.",
        scripture_ref: 'Numbers 22:28',
        points: 100
      },
      {
        category: 'Animals in the Bible',
        question: 'The animal that appeared as a symbol of the Holy Spirit at Jesus\' baptism',
        options: ['What is a dove?', 'What is an eagle?', 'What is a lamb?', 'What is a lion?'],
        correct_answer: 'What is a dove?',
        explanation: 'The Holy Spirit descended like a dove when Jesus was baptized.',
        scripture_ref: 'Matthew 3:16',
        points: 200
      }
    ];

    const adultQuestions = [
      {
        category: 'Pauline Theology',
        question: 'Paul describes this as the "righteousness of God" revealed in the gospel',
        options: ['What is justification by faith?', 'What is sanctification?', 'What is glorification?', 'What is propitiation?'],
        correct_answer: 'What is justification by faith?',
        explanation: 'In Romans, Paul reveals that the righteousness of God is made available through faith in Jesus Christ.',
        scripture_ref: 'Romans 1:17, 3:21-22',
        points: 100
      },
      {
        category: 'Pauline Theology',
        question: 'The term Paul uses for the believer being "in Christ"',
        options: ['What is union with Christ?', 'What is imputation?', 'What is adoption?', 'What is regeneration?'],
        correct_answer: 'What is union with Christ?',
        explanation: 'Paul frequently speaks of believers being "in Christ," signifying spiritual union.',
        scripture_ref: 'Romans 6:1-11, Ephesians 1:3-14',
        points: 200
      },
      {
        category: 'Messianic Prophecies',
        question: 'Isaiah 53 prophesies about this aspect of the Messiah',
        options: ['What is His suffering and death?', 'What is His royal reign?', 'What is His birth?', 'What is His miracles?'],
        correct_answer: 'What is His suffering and death?',
        explanation: 'Isaiah 53 vividly describes the Suffering Servant who would bear our sins and be pierced for our transgressions.',
        scripture_ref: 'Isaiah 53',
        points: 100
      },
      {
        category: 'Messianic Prophecies',
        question: 'The prophet who foretold the Messiah would be born in Bethlehem',
        options: ['Who is Micah?', 'Who is Isaiah?', 'Who is Jeremiah?', 'Who is Ezekiel?'],
        correct_answer: 'Who is Micah?',
        explanation: 'Micah prophesied that the ruler of Israel would come from Bethlehem.',
        scripture_ref: 'Micah 5:2',
        points: 200
      },
      {
        category: 'Covenants',
        question: 'The theological term for the new covenant replacing the old',
        options: ['What is fulfillment?', 'What is substitution?', 'What is abolishment?', 'What is renovation?'],
        correct_answer: 'What is fulfillment?',
        explanation: 'Jesus came to fulfill the law and prophets, establishing a new covenant through His blood.',
        scripture_ref: 'Matthew 5:17, Hebrews 8:13',
        points: 100
      },
      {
        category: 'Covenants',
        question: 'The sign of the Abrahamic covenant',
        options: ['What is circumcision?', 'What is baptism?', 'What is the rainbow?', 'What is the Sabbath?'],
        correct_answer: 'What is circumcision?',
        explanation: 'God commanded Abraham and his descendants to be circumcised as a sign of the covenant.',
        scripture_ref: 'Genesis 17:9-14',
        points: 200
      },
      {
        category: 'Systematic Theology',
        question: 'The doctrine that God chose people for salvation before creation',
        options: ['What is predestination?', 'What is foreknowledge?', 'What is providence?', 'What is sovereignty?'],
        correct_answer: 'What is predestination?',
        explanation: 'Predestination refers to God\'s eternal decree to choose some for salvation according to His will.',
        scripture_ref: 'Ephesians 1:4-5, Romans 8:29-30',
        points: 100
      },
      {
        category: 'Systematic Theology',
        question: 'The theological term for Christ taking on human nature',
        options: ['What is the Incarnation?', 'What is the Hypostatic Union?', 'What is Kenosis?', 'What is Theosis?'],
        correct_answer: 'What is the Incarnation?',
        explanation: 'The Incarnation refers to the Word becoming flesh when Jesus was conceived.',
        scripture_ref: 'John 1:14, Philippians 2:6-8',
        points: 200
      },
      {
        category: 'Spiritual Gifts',
        question: 'Paul lists these gifts in 1 Corinthians 12 as manifestations of the Spirit',
        options: ['What are charismata?', 'What are fruits?', 'What are talents?', 'What are works?'],
        correct_answer: 'What are charismata?',
        explanation: 'Charismata (spiritual gifts) are given by the Holy Spirit for the common good of the church.',
        scripture_ref: '1 Corinthians 12:4-11',
        points: 100
      },
      {
        category: 'Spiritual Gifts',
        question: 'The fruit of the Spirit listed first in Galatians 5',
        options: ['What is love?', 'What is joy?', 'What is peace?', 'What is patience?'],
        correct_answer: 'What is love?',
        explanation: 'Love is the first and primary fruit of the Spirit listed by Paul.',
        scripture_ref: 'Galatians 5:22-23',
        points: 200
      }
    ];

    const questionBank = edition === 'youth' ? youthQuestions : adultQuestions;
    
    return questionBank.map((q, index) => ({
      id: index,
      categoryIndex: Math.floor(index / 2),
      pointIndex: index % 2,
      ...q
    }));
  };

  const selectQuestion = (questionId) => {
    // Check if already answered
    if (answeredQuestions.includes(questionId)) return;
    
    const question = questions.find(q => q.id === questionId);
    setSelectedQuestion(question);
    setShowBoard(false);
    
    // Check if it's a Daily Double
    if (questionId === dailyDoubleIndex) {
      setDailyDoubleRevealed(true);
    }
  };

  const handleDailyDoubleWager = (amount) => {
    setWager(amount);
    setDailyDoubleRevealed(false);
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === selectedQuestion.correct_answer;
    
    if (selectedQuestion.id === dailyDoubleIndex && wager > 0) {
      // Daily Double scoring
      if (isCorrect) {
        setScore(score + wager);
      } else {
        setScore(score - wager);
      }
    } else {
      // Regular scoring
      if (isCorrect) {
        setScore(score + selectedQuestion.points);
      }
    }
  };

  const returnToBoard = () => {
    setAnsweredQuestions([...answeredQuestions, selectedQuestion.id]);
    setSelectedQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowBoard(true);
    setWager(0);
    
    // Check if all questions answered
    if (answeredQuestions.length + 1 === questions.length) {
      setGameOver(true);
    }
  };

  const restartGame = () => {
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setAnsweredQuestions([]);
    setSelectedQuestion(null);
    setShowBoard(true);
    setDailyDoubleRevealed(false);
    setDailyDoubleIndex(null);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 sm:border-4 border-purple-300">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                {score >= 800 ? '🏆 Champion! 🏆' : 'Game Complete!'}
              </h2>
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-purple-600 mb-4 sm:mb-6">
                {score} Points
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-700 mb-6 sm:mb-8">
                You completed all 10 Jeopardy-style questions!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={restartGame}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto"
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto"
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
    const maxWager = Math.max(score, 500);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 sm:border-4 border-yellow-400 max-w-2xl w-full mx-4">
          <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-yellow-600 mb-4 sm:mb-6 animate-pulse">
              💰 DAILY DOUBLE! 💰
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-800 mb-3 sm:mb-4">
              You found the hidden Daily Double!
            </p>
            <p className="text-base sm:text-lg lg:text-xl text-slate-700 mb-4 sm:mb-6 lg:mb-8">
              Current Score: <strong>{score} points</strong>
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-4 sm:mb-6">
              How much do you want to wager?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={() => handleDailyDoubleWager(100)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 sm:py-4 text-base sm:text-lg"
              >
                Wager 100
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(200)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 sm:py-4 text-base sm:text-lg"
              >
                Wager 200
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(Math.floor(score / 2))}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 sm:py-4 text-base sm:text-lg"
                disabled={score === 0}
              >
                Wager Half ({Math.floor(score / 2)})
              </Button>
              <Button
                onClick={() => handleDailyDoubleWager(maxWager)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 sm:py-4 text-base sm:text-lg"
              >
                All In! ({maxWager})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Jeopardy Board View
  if (showBoard) {

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                ← Back to Home
              </button>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2 text-base sm:text-lg">
                {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
              </Badge>
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Tricky Testaments</h1>
              <p className="text-sm sm:text-base text-purple-300">Pick a category and point value!</p>
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl">
              <div className="text-xs sm:text-sm text-blue-100">Your Score</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{score} Points</div>
              <div className="text-xs sm:text-sm text-blue-100">{answeredQuestions.length}/10 Answered</div>
            </div>
          </div>

          {/* Jeopardy Board */}
          <div className="bg-blue-950 p-3 sm:p-4 lg:p-6 rounded-xl shadow-2xl border-2 sm:border-4 border-yellow-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              {/* For each category, create a column with header + questions */}
              {categories.map((category, catIndex) => (
                <div key={`col-${catIndex}`} className="flex flex-col gap-2 sm:gap-3">
                  {/* Category Header */}
                  <div className="bg-blue-800 text-white p-3 sm:p-4 rounded-lg text-center font-bold text-sm sm:text-base lg:text-lg border-2 border-blue-600 min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                    {category}
                  </div>
                  
                  {/* Question Tiles for this category */}
                  {pointValues.map((points, pointIndex) => {
                    const question = questions.find(
                      q => q.categoryIndex === catIndex && q.pointIndex === pointIndex
                    );
                    const isAnswered = answeredQuestions.includes(question?.id);

                    return (
                      <button
                        key={`q-${catIndex}-${pointIndex}`}
                        onClick={() => !isAnswered && selectQuestion(question.id)}
                        disabled={isAnswered}
                        className={`
                          p-4 sm:p-6 lg:p-8 rounded-lg text-2xl sm:text-3xl font-bold transition-all
                          ${isAnswered 
                            ? 'bg-blue-950 text-blue-900 cursor-not-allowed border-2 border-blue-900' 
                            : 'bg-blue-600 text-yellow-400 hover:bg-blue-500 hover:scale-105 cursor-pointer border-2 border-yellow-500 shadow-lg'
                          }
                        `}
                      >
                        {isAnswered ? '✓' : points}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2 text-base sm:text-lg">
              {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
            </Badge>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold">{score} Points</div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Tricky Testaments</h1>
            <p className="text-sm sm:text-base text-purple-300">Answer in Question Form!</p>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-white mb-4 sm:mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                {selectedQuestion.category}
                {selectedQuestion.id === dailyDoubleIndex && wager > 0 && (
                  <Badge className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-yellow-500 text-white text-xs sm:text-sm">
                    💰 DAILY DOUBLE - Wager: {wager}
                  </Badge>
                )}
              </CardTitle>
              <Badge className="bg-purple-600 text-white text-sm sm:text-base lg:text-lg whitespace-nowrap">
                {selectedQuestion.id === dailyDoubleIndex && wager > 0 
                  ? `Wager: ${wager}` 
                  : `${selectedQuestion.points} Points`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="bg-blue-900 text-white p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 text-center">
              <p className="text-base sm:text-xl lg:text-2xl font-semibold">
                {selectedQuestion.question}
              </p>
            </div>

            {/* Answer Options (in Jeopardy format) */}
            <div className="grid gap-3 sm:gap-4">
              {selectedQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === selectedQuestion.correct_answer;
                
                let buttonClass = 'w-full text-left p-4 sm:p-6 text-sm sm:text-base lg:text-lg font-semibold rounded-xl transition-all ';
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass += 'bg-green-500 text-white border-2 sm:border-4 border-green-700';
                  } else if (isSelected) {
                    buttonClass += 'bg-red-500 text-white border-2 sm:border-4 border-red-700';
                  } else {
                    buttonClass += 'bg-slate-100 text-slate-800';
                  }
                } else if (isSelected) {
                  buttonClass += 'bg-purple-200 text-slate-900 border-2 sm:border-4 border-purple-500';
                } else {
                  buttonClass += 'bg-slate-100 text-slate-900 hover:bg-purple-100 hover:scale-105 border-2 border-slate-300';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className={`mt-4 sm:mt-6 p-4 sm:p-6 rounded-xl ${
                selectedAnswer === selectedQuestion.correct_answer
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-red-50 border-2 border-red-500'
              }`}>
                <h4 className="font-bold text-base sm:text-lg mb-2">
                  {selectedAnswer === selectedQuestion.correct_answer 
                    ? `✅ Correct! +${selectedQuestion.id === dailyDoubleIndex && wager > 0 ? wager : selectedQuestion.points} points` 
                    : `❌ Incorrect! ${selectedQuestion.id === dailyDoubleIndex && wager > 0 ? `-${wager} points` : 'No points'}`}
                </h4>
                <p className="text-sm sm:text-base text-slate-700 mb-2"><strong>Correct Answer:</strong> {selectedQuestion.correct_answer}</p>
                <p className="text-sm sm:text-base text-slate-700 mb-2">{selectedQuestion.explanation}</p>
                <p className="text-xs sm:text-sm text-slate-600">📖 {selectedQuestion.scripture_ref}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return to Board Button */}
        {showResult && (
          <div className="text-center">
            <Button
              onClick={returnToBoard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg lg:text-xl w-full sm:w-auto"
            >
              Return to Board →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrickyTestamentGame;
