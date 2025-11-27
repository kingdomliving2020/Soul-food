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
    const youthQuestions = [
      {
        category: 'Creation Stories',
        question: 'God created this on the first day',
        options: ['What is light?', 'What is the sun?', 'What are plants?', 'What are animals?'],
        correct_answer: 'What is light?',
        explanation: "On the first day of creation, God said 'Let there be light,' and there was light.",
        scripture_ref: 'Genesis 1:3'
      },
      {
        category: 'Famous Miracles',
        question: 'Jesus walked on this',
        options: ['What is water?', 'What is sand?', 'What are clouds?', 'What is fire?'],
        correct_answer: 'What is water?',
        explanation: 'Jesus walked on water during a storm, demonstrating His power over nature.',
        scripture_ref: 'Matthew 14:22-33'
      },
      {
        category: 'Bible Heroes',
        question: 'The strongest man in the Bible',
        options: ['Who is Samson?', 'Who is David?', 'Who is Goliath?', 'Who is Joshua?'],
        correct_answer: 'Who is Samson?',
        explanation: 'Samson was given supernatural strength by God as long as he kept his Nazirite vow.',
        scripture_ref: 'Judges 13-16'
      },
      {
        category: 'Famous Prayers',
        question: "This prayer starts with 'Our Father'",
        options: ["What is the Lord's Prayer?", 'What is a blessing?', 'What is a psalm?', 'What is a hymn?'],
        correct_answer: "What is the Lord's Prayer?",
        explanation: "Jesus taught His disciples the Lord's Prayer, which begins with 'Our Father in heaven.'",
        scripture_ref: 'Matthew 6:9-13'
      },
      {
        category: 'Animals in the Bible',
        question: 'This animal talked to Balaam',
        options: ['What is a donkey?', 'What is a snake?', 'What is a lion?', 'What is a dove?'],
        correct_answer: 'What is a donkey?',
        explanation: "God opened the mouth of Balaam's donkey to speak and warn him.",
        scripture_ref: 'Numbers 22:28'
      },
      {
        category: 'Disciples',
        question: 'The disciple who doubted Jesus rose from the dead',
        options: ['Who is Thomas?', 'Who is Peter?', 'Who is John?', 'Who is James?'],
        correct_answer: 'Who is Thomas?',
        explanation: 'Thomas doubted until he saw Jesus and touched His wounds.',
        scripture_ref: 'John 20:24-29'
      },
      {
        category: 'Old Testament Kings',
        question: 'He fought a giant with just a sling',
        options: ['Who is David?', 'Who is Saul?', 'Who is Solomon?', 'Who is Joshua?'],
        correct_answer: 'Who is David?',
        explanation: 'Young David defeated the giant Goliath with a sling and a stone, trusting in God.',
        scripture_ref: '1 Samuel 17'
      },
      {
        category: 'Parables',
        question: 'The story Jesus told about a son who left home and came back',
        options: ['What is the Prodigal Son?', 'What is the Good Samaritan?', 'What is the Lost Sheep?', 'What is the Sower?'],
        correct_answer: 'What is the Prodigal Son?',
        explanation: 'The Parable of the Prodigal Son teaches about repentance and God\'s forgiveness.',
        scripture_ref: 'Luke 15:11-32'
      },
      {
        category: 'Ten Commandments',
        question: 'The number of commandments God gave Moses',
        options: ['What is ten?', 'What is seven?', 'What is twelve?', 'What is five?'],
        correct_answer: 'What is ten?',
        explanation: 'God gave Moses the Ten Commandments on Mount Sinai.',
        scripture_ref: 'Exodus 20:1-17'
      },
      {
        category: 'Easter Story',
        question: 'The day Jesus rose from the dead',
        options: ['What is the third day?', 'What is the first day?', 'What is the seventh day?', 'What is the fourth day?'],
        correct_answer: 'What is the third day?',
        explanation: 'Jesus rose from the dead on the third day, fulfilling prophecy and defeating death.',
        scripture_ref: 'Luke 24:7'
      }
    ];

    const adultQuestions = [
      {
        category: 'Pauline Theology',
        question: 'Paul describes this as the "righteousness of God" revealed in the gospel',
        options: ['What is justification by faith?', 'What is sanctification?', 'What is glorification?', 'What is propitiation?'],
        correct_answer: 'What is justification by faith?',
        explanation: 'In Romans, Paul reveals that the righteousness of God is made available through faith in Jesus Christ.',
        scripture_ref: 'Romans 1:17, 3:21-22'
      },
      {
        category: 'Messianic Prophecies',
        question: 'Isaiah 53 prophesies about this aspect of the Messiah',
        options: ['What is His suffering and death?', 'What is His royal reign?', 'What is His birth?', 'What is His miracles?'],
        correct_answer: 'What is His suffering and death?',
        explanation: 'Isaiah 53 vividly describes the Suffering Servant who would bear our sins and be pierced for our transgressions.',
        scripture_ref: 'Isaiah 53'
      },
      {
        category: 'Covenants',
        question: 'The theological term for the new covenant replacing the old',
        options: ['What is fulfillment?', 'What is substitution?', 'What is abolishment?', 'What is renovation?'],
        correct_answer: 'What is fulfillment?',
        explanation: 'Jesus came to fulfill the law and prophets, establishing a new covenant through His blood.',
        scripture_ref: 'Matthew 5:17, Hebrews 8:13'
      },
      {
        category: 'Systematic Theology',
        question: 'The doctrine that God chose people for salvation before creation',
        options: ['What is predestination?', 'What is foreknowledge?', 'What is providence?', 'What is sovereignty?'],
        correct_answer: 'What is predestination?',
        explanation: 'Predestination refers to God\'s eternal decree to choose some for salvation according to His will.',
        scripture_ref: 'Ephesians 1:4-5, Romans 8:29-30'
      },
      {
        category: 'Spiritual Gifts',
        question: 'Paul lists these gifts in 1 Corinthians 12 as manifestations of the Spirit',
        options: ['What are charismata?', 'What are fruits?', 'What are talents?', 'What are works?'],
        correct_answer: 'What are charismata?',
        explanation: 'Charismata (spiritual gifts) are given by the Holy Spirit for the common good of the church.',
        scripture_ref: '1 Corinthians 12:4-11'
      },
      {
        category: 'Biblical Hermeneutics',
        question: 'The interpretation method considering historical and cultural context',
        options: ['What is grammatical-historical?', 'What is allegorical?', 'What is literal?', 'What is mystical?'],
        correct_answer: 'What is grammatical-historical?',
        explanation: 'The grammatical-historical method interprets Scripture according to grammar and historical context.',
        scripture_ref: '2 Timothy 2:15'
      },
      {
        category: 'Early Church History',
        question: 'The council that addressed the Arian heresy in 325 AD',
        options: ['What is Nicaea?', 'What is Chalcedon?', 'What is Constantinople?', 'What is Ephesus?'],
        correct_answer: 'What is Nicaea?',
        explanation: 'The Council of Nicaea affirmed the deity of Christ against Arianism, producing the Nicene Creed.',
        scripture_ref: 'John 1:1, Colossians 1:15-20'
      },
      {
        category: 'Eschatology',
        question: 'The theological term for the study of last things',
        options: ['What is eschatology?', 'What is soteriology?', 'What is pneumatology?', 'What is ecclesiology?'],
        correct_answer: 'What is eschatology?',
        explanation: 'Eschatology is the study of end times, including Christ\'s return, resurrection, and final judgment.',
        scripture_ref: 'Revelation 1:19, 1 Thessalonians 4:13-18'
      },
      {
        category: 'Atonement Theories',
        question: 'The view that Christ\'s death satisfied God\'s justice and wrath',
        options: ['What is penal substitution?', 'What is moral influence?', 'What is Christus Victor?', 'What is governmental?'],
        correct_answer: 'What is penal substitution?',
        explanation: 'Penal substitutionary atonement teaches that Christ bore the penalty for sin in our place, satisfying God\'s justice.',
        scripture_ref: 'Isaiah 53:5, Romans 3:25, 2 Corinthians 5:21'
      },
      {
        category: 'Trinity Doctrine',
        question: 'The Latin term meaning "three persons, one essence"',
        options: ['What is Tres Personae, Una Substantia?', 'What is Sola Scriptura?', 'What is Imago Dei?', 'What is Ex Nihilo?'],
        correct_answer: 'What is Tres Personae, Una Substantia?',
        explanation: 'This formulation expresses the orthodox doctrine of the Trinity: three distinct persons sharing one divine essence.',
        scripture_ref: 'Matthew 28:19, 2 Corinthians 13:14'
      }
    ];

    const questionBank = edition === 'youth' ? youthQuestions : adultQuestions;
    
    return questionBank.map((q, index) => ({
      id: index + 1,
      points: pointValues[index],
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
