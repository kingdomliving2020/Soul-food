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
  const isDailyDouble = currentQuestion === dailyDoubleIndex && !dailyDoubleRevealed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 text-lg">
              {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
            </Badge>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Tricky Testaments</h1>
            <p className="text-purple-300">Jeopardy Style Challenge</p>
          </div>
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
                    buttonClass += 'bg-slate-100 text-slate-800';
                  }
                } else if (isSelected) {
                  buttonClass += 'bg-purple-200 text-slate-900 border-4 border-purple-500';
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
