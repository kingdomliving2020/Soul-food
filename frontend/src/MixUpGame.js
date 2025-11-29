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
    // Generate 15 edition-specific questions with progressive difficulty
    const youthQuestions = {
      easy: [
        {
          question: "True or False: Jesus had 12 disciples.",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "Jesus chose 12 disciples to follow Him and learn from His teachings.",
          scripture_ref: "Matthew 10:1-4"
        },
        {
          question: "True or False: Moses parted the Red Sea.",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "God worked through Moses to part the Red Sea, allowing the Israelites to escape Egypt.",
          scripture_ref: "Exodus 14:21-22"
        },
        {
          question: "Who built the ark to save his family from the flood?",
          options: ["Moses", "Noah", "Abraham", "David"],
          correct_answer: "Noah",
          explanation: "Noah built the ark according to God's instructions to save his family and the animals.",
          scripture_ref: "Genesis 6-9"
        },
        {
          question: "What did David use to defeat Goliath?",
          options: ["A sword", "A spear", "A sling and stone", "His bare hands"],
          correct_answer: "A sling and stone",
          explanation: "David defeated the giant Goliath with just a sling and a stone, trusting in God.",
          scripture_ref: "1 Samuel 17"
        },
        {
          question: "True or False: Jonah was swallowed by a whale.",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "Jonah was swallowed by a great fish (often called a whale) after trying to run from God.",
          scripture_ref: "Jonah 1-2"
        }
      ],
      medium: [
        {
          question: "True or False: Jesus turned water into wine at a wedding.",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "Jesus performed His first miracle by turning water into wine at a wedding in Cana.",
          scripture_ref: "John 2:1-11"
        },
        {
          question: "Who was the wisest king in the Bible?",
          options: ["David", "Saul", "Solomon", "Hezekiah"],
          correct_answer: "Solomon",
          explanation: "Solomon asked God for wisdom and became the wisest king.",
          scripture_ref: "1 Kings 3"
        },
        {
          question: "True or False: Jesus rose from the dead on the third day.",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "Jesus rose from the dead on the third day, just as He prophesied.",
          scripture_ref: "Matthew 12:40"
        },
        {
          question: "Who betrayed Jesus for 30 pieces of silver?",
          options: ["Peter", "Judas", "Thomas", "Matthew"],
          correct_answer: "Judas",
          explanation: "Judas Iscariot betrayed Jesus to the chief priests for thirty pieces of silver.",
          scripture_ref: "Matthew 26:14-16"
        },
        {
          question: "What was Moses' brother's name?",
          options: ["Aaron", "Joshua", "Caleb", "Levi"],
          correct_answer: "Aaron",
          explanation: "Aaron was Moses' brother and became the first high priest of Israel.",
          scripture_ref: "Exodus 4:14"
        }
      ],
      hard: [
        {
          question: "How many years did the Israelites wander in the desert?",
          options: ["30 years", "40 years", "50 years", "60 years"],
          correct_answer: "40 years",
          explanation: "The Israelites wandered 40 years in the wilderness due to their disobedience.",
          scripture_ref: "Numbers 14:33-34"
        },
        {
          question: "Who was the first king of Israel?",
          options: ["David", "Solomon", "Saul", "Samuel"],
          correct_answer: "Saul",
          explanation: "Saul was anointed as the first king of Israel by the prophet Samuel.",
          scripture_ref: "1 Samuel 10"
        },
        {
          question: "What did Jesus say is the greatest commandment?",
          options: ["Love your neighbor", "Love the Lord your God", "Do not steal", "Honor your parents"],
          correct_answer: "Love the Lord your God",
          explanation: "Jesus said the greatest commandment is to love the Lord your God with all your heart, soul, and mind.",
          scripture_ref: "Matthew 22:37-38"
        },
        {
          question: "Who wrote most of the New Testament letters?",
          options: ["Peter", "John", "Paul", "James"],
          correct_answer: "Paul",
          explanation: "Paul (formerly Saul) wrote at least 13 letters that are part of the New Testament.",
          scripture_ref: "Acts 9"
        },
        {
          question: "What did God create on the seventh day?",
          options: ["Humans", "Animals", "Light", "He rested"],
          correct_answer: "He rested",
          explanation: "On the seventh day, God rested from all His work of creation and made it holy.",
          scripture_ref: "Genesis 2:2-3"
        }
      ]
    };

    const adultQuestions = {
      easy: [
        {
          question: "In Hebrews 11:1, what is faith defined as?",
          options: [
            "The substance of things hoped for",
            "Complete trust in God",
            "Believing without proof",
            "Following religious traditions"
          ],
          correct_answer: "The substance of things hoped for",
          explanation: "Hebrews 11:1 defines faith as 'the substance of things hoped for, the evidence of things not seen.'",
          scripture_ref: "Hebrews 11:1"
        },
        {
          question: "What covenant did God make with Abraham?",
          options: [
            "To make him a great nation",
            "To give him many cattle",
            "To make him wealthy",
            "To protect him from enemies"
          ],
          correct_answer: "To make him a great nation",
          explanation: "God promised Abraham that he would be the father of many nations and that all peoples would be blessed through him.",
          scripture_ref: "Genesis 12:2-3"
        },
        {
          question: "Which prophet confronted King David about his sin with Bathsheba?",
          options: ["Isaiah", "Nathan", "Elijah", "Jeremiah"],
          correct_answer: "Nathan",
          explanation: "The prophet Nathan confronted David with a parable, leading to David's repentance.",
          scripture_ref: "2 Samuel 12"
        },
        {
          question: "What did Paul describe as the 'armor of God' in Ephesians 6?",
          options: [
            "Physical weapons for battle",
            "Spiritual protection for believers",
            "Rules for church conduct",
            "Guidelines for missionaries"
          ],
          correct_answer: "Spiritual protection for believers",
          explanation: "Paul describes spiritual armor including truth, righteousness, faith, and salvation to protect believers in spiritual warfare.",
          scripture_ref: "Ephesians 6:10-18"
        },
        {
          question: "What is the central message of the Gospel?",
          options: [
            "Be a good person",
            "Jesus died and rose for our salvation",
            "Follow the Ten Commandments",
            "Attend church regularly"
          ],
          correct_answer: "Jesus died and rose for our salvation",
          explanation: "The Gospel (Good News) is that Jesus Christ died for our sins and rose again, offering salvation to all who believe.",
          scripture_ref: "1 Corinthians 15:1-4"
        }
      ],
      medium: [
        {
          question: "In Romans 12:2, what are believers instructed NOT to conform to?",
          options: [
            "This world",
            "Church traditions",
            "Family expectations",
            "Cultural norms"
          ],
          correct_answer: "This world",
          explanation: "Paul instructs believers not to conform to the pattern of this world, but to be transformed by renewing their minds.",
          scripture_ref: "Romans 12:2"
        },
        {
          question: "What did James say about faith without works?",
          options: [
            "It is sufficient",
            "It is dead",
            "It is growing",
            "It is optional"
          ],
          correct_answer: "It is dead",
          explanation: "James teaches that faith without works is dead, emphasizing that genuine faith produces action.",
          scripture_ref: "James 2:26"
        },
        {
          question: "What does 'Immanuel' mean?",
          options: [
            "God with us",
            "Savior of the world",
            "Prince of Peace",
            "Mighty God"
          ],
          correct_answer: "God with us",
          explanation: "Immanuel means 'God with us,' prophesying Jesus' coming to dwell among humanity.",
          scripture_ref: "Matthew 1:23"
        },
        {
          question: "According to Proverbs 3:5-6, what should we NOT lean on?",
          options: [
            "Our own understanding",
            "Other people",
            "Our wealth",
            "Our abilities"
          ],
          correct_answer: "Our own understanding",
          explanation: "Proverbs instructs us to trust in the Lord and not lean on our own understanding.",
          scripture_ref: "Proverbs 3:5-6"
        },
        {
          question: "What did Jesus say is required to enter the Kingdom of God?",
          options: [
            "Good works",
            "Being born again",
            "Church membership",
            "Following the law"
          ],
          correct_answer: "Being born again",
          explanation: "Jesus told Nicodemus that no one can see the kingdom of God unless they are born again.",
          scripture_ref: "John 3:3"
        }
      ],
      hard: [
        {
          question: "In Philippians 2:5-11, Paul describes Christ's humility. What did Christ empty Himself of?",
          options: [
            "His glory and divine privileges",
            "His knowledge",
            "His power",
            "His love"
          ],
          correct_answer: "His glory and divine privileges",
          explanation: "Christ emptied Himself of His divine privileges, taking on human form and humbling Himself to death on a cross.",
          scripture_ref: "Philippians 2:5-11"
        },
        {
          question: "What theological concept does Romans 8:29-30 describe as the 'golden chain of salvation'?",
          options: [
            "Foreknowledge, predestination, calling, justification, glorification",
            "Faith, hope, love, joy, peace",
            "Repentance, baptism, communion, prayer, worship",
            "Creation, fall, redemption, restoration, consummation"
          ],
          correct_answer: "Foreknowledge, predestination, calling, justification, glorification",
          explanation: "Romans 8:29-30 presents the unbreakable chain of God's sovereign work in salvation from foreknowledge to glorification.",
          scripture_ref: "Romans 8:29-30"
        },
        {
          question: "According to 1 Corinthians 13, what three things abide, and which is greatest?",
          options: [
            "Faith, hope, love - love is greatest",
            "Truth, justice, mercy - mercy is greatest",
            "Wisdom, knowledge, understanding - wisdom is greatest",
            "Prayer, fasting, giving - prayer is greatest"
          ],
          correct_answer: "Faith, hope, love - love is greatest",
          explanation: "Paul concludes his discourse on love by stating that faith, hope, and love abide, but the greatest of these is love.",
          scripture_ref: "1 Corinthians 13:13"
        },
        {
          question: "In Galatians, what does Paul argue is the true basis of justification?",
          options: [
            "Works of the law",
            "Faith in Jesus Christ alone",
            "Religious ceremonies",
            "Moral perfection"
          ],
          correct_answer: "Faith in Jesus Christ alone",
          explanation: "Paul strongly argues in Galatians that justification comes through faith in Christ alone, not by works of the law.",
          scripture_ref: "Galatians 2:16"
        },
        {
          question: "What does the theological term 'propitiation' mean in Romans 3:25?",
          options: [
            "Substitution",
            "Atonement that satisfies God's wrath",
            "Redemption price",
            "Reconciliation"
          ],
          correct_answer: "Atonement that satisfies God's wrath",
          explanation: "Propitiation refers to Jesus' sacrifice that satisfies God's righteous wrath against sin, making peace between God and humanity.",
          scripture_ref: "Romans 3:25"
        }
      ]
    };

    const questionBank = edition === 'youth' ? youthQuestions : adultQuestions;
    
    // Select 5 easy, 5 medium, 5 hard
    const selected = [
      ...questionBank.easy.slice(0, 5),
      ...questionBank.medium.slice(0, 5),
      ...questionBank.hard.slice(0, 5)
    ];

    return selected.map((q, index) => ({
      id: index + 1,
      difficulty: difficulties[index],
      ...q
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
    
    alert(`📖 Scripture Hint:\n\n${questions[currentQuestion].scripture_ref}\n\nLook up this passage for guidance!`);
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 text-lg">
              {edition === 'youth' ? '🎮 Youth Edition' : '📚 Adult Edition'}
            </Badge>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Trivia Mix-Up</h1>
            <p className="text-purple-300">Millionaire Style Challenge</p>
          </div>
        </div>

        {/* Money Ladder */}
        <div className="grid grid-cols-5 gap-1 mb-4">
          {moneyLadder.map((amount, index) => (
            <div
              key={index}
              className={`text-center py-1 rounded text-xs sm:text-sm ${
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
        <Card className="bg-white mb-4">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 py-3">
            <CardTitle className="text-lg sm:text-xl">
              Question {currentQuestion + 1} of 15
              <Badge className="ml-3 bg-purple-600 text-white text-xs">
                {question.difficulty.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-lg sm:text-xl text-slate-800 mb-6 font-semibold">
              {question.question}
            </p>

            {/* Answer Options */}
            <div className="grid gap-3">
              {question.options.map((option, index) => {
                const isEliminated = eliminatedOptions.includes(option);
                const isSelected = selectedAnswer === option;
                const isCorrect = option === question.correct_answer;
                
                let buttonClass = 'w-full justify-start items-center text-left p-4 text-base sm:text-lg font-semibold rounded-lg transition-all ';
                
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
                  buttonClass += 'bg-amber-200 text-slate-900 border-4 border-amber-500';
                } else {
                  buttonClass += 'bg-slate-100 text-slate-900 hover:bg-amber-100 hover:scale-105 border-2 border-slate-300';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={isEliminated || showResult}
                    className={buttonClass}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <span className="font-bold mr-4 text-slate-700">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                selectedAnswer === question.correct_answer
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-red-50 border-2 border-red-500'
              }`}>
                <h4 className="font-bold text-base mb-1">
                  {selectedAnswer === question.correct_answer ? '✅ Correct!' : '❌ Incorrect!'}
                </h4>
                <p className="text-sm text-slate-700 mb-1">{question.explanation}</p>
                <p className="text-xs text-slate-600">📖 {question.scripture_ref}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifelines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={use50_50}
            disabled={!lifelines.fiftyFifty || showResult}
            className={`p-4 rounded-lg text-white font-bold transition-all shadow-md ${
              lifelines.fiftyFifty
                ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">✂️</div>
              <div className="text-sm">50/50</div>
            </div>
          </button>

          <button
            onClick={useAskCongregation}
            disabled={!lifelines.askCongregation || showResult}
            className={`p-4 rounded-lg text-white font-bold transition-all shadow-md ${
              lifelines.askCongregation
                ? 'bg-green-600 hover:bg-green-700 hover:scale-105'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">👥</div>
              <div className="text-sm text-center leading-tight">Ask<br/>Congregation</div>
            </div>
          </button>

          <button
            onClick={useScriptureHint}
            disabled={!lifelines.scriptureHint || showResult}
            className={`p-4 rounded-lg text-white font-bold transition-all shadow-md ${
              lifelines.scriptureHint
                ? 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">📖</div>
              <div className="text-sm text-center leading-tight">Scripture<br/>Hint</div>
            </div>
          </button>

          <button
            onClick={usePrayerPause}
            disabled={!lifelines.prayerPause || showResult}
            className={`p-4 rounded-lg text-white font-bold transition-all shadow-md ${
              lifelines.prayerPause
                ? 'bg-amber-600 hover:bg-amber-700 hover:scale-105'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">🙏</div>
              <div className="text-sm text-center leading-tight">Prayer<br/>Pause</div>
            </div>
          </button>
        </div>

        {/* Next Button */}
        {showResult && !gameOver && (
          <div className="text-center mt-4">
            <button
              onClick={nextQuestion}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg text-base sm:text-lg shadow-lg transition-all hover:scale-105"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixUpGame;
