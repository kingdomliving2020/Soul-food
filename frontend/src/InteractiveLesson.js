import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Icon components
const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LightBulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const InteractiveLesson = () => {
  const { nibbleId } = useParams();
  const navigate = useNavigate();
  
  const [nibble, setNibble] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [results, setResults] = useState(null);
  const [currentBiteIndex, setCurrentBiteIndex] = useState(0);
  const [completedBites, setCompletedBites] = useState([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Check if lesson is FREE (In His Image series, Bonus lessons)
  const isFreelesson = (lessonData) => {
    if (!lessonData) return false;
    const freeSeriesKeywords = ['in his image', 'self-worth', 'bonus', 'free'];
    const seriesName = (lessonData.series_name || '').toLowerCase();
    const title = (lessonData.title || '').toLowerCase();
    
    // Check if it's a free series
    if (freeSeriesKeywords.some(keyword => seriesName.includes(keyword) || title.includes(keyword))) {
      return true;
    }
    
    // Check if price is 0 or explicitly marked as free
    if (lessonData.price === 0 || lessonData.price_download === 0 || lessonData.is_free) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    fetchNibble();
    fetchEntitlement();
  }, [nibbleId]);

  const fetchNibble = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/interactive-lessons/nibble/${nibbleId}`);
      if (!response.ok) {
        throw new Error('Lesson not found');
      }
      const data = await response.json();
      setNibble(data.nibble);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntitlement = async () => {
    // Check if the current user has an active entitlement for this nibble.
    // INLINE viewer access — bypasses fulfillment / download_link logic entirely.
    try {
      const token = localStorage.getItem('soul_food_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/interactive-lessons/entitlement/${nibbleId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.has_access) {
        setHasPurchased(true);
      }
    } catch (e) {
      // Silent fail — gate falls back to the existing isFreelesson() check
      console.error('entitlement check failed', e);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Reset show answers when user changes an answer
    if (showAnswers) {
      setShowAnswers(false);
      setResults(null);
    }
  };

  const handleCheckAnswers = async () => {
    try {
      const response = await fetch(`${API}/interactive-lessons/progress/check-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nibble_id: nibbleId,
          answers: answers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check answers');
      }
      
      const data = await response.json();
      setResults(data);
      setShowAnswers(true);
      
      if (data.score !== null && data.score >= 70) {
        toast.success(`Great job! You scored ${Math.round(data.score)}%`);
      } else if (data.score !== null) {
        toast.info(`You scored ${Math.round(data.score)}%. Keep studying!`);
      } else {
        toast.success('Answers submitted! Reflection questions have been recorded.');
      }
    } catch (err) {
      toast.error('Failed to check answers');
    }
  };

  const handleSaveProgress = async () => {
    try {
      setSavingProgress(true);
      const response = await fetch(`${API}/interactive-lessons/progress/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nibble_id: nibbleId,
          answers: answers,
          completed_bites: completedBites
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save progress');
      }
      
      toast.success('Progress saved!');
    } catch (err) {
      toast.error('Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleNextBite = () => {
    if (nibble && currentBiteIndex < nibble.bites.length - 1) {
      if (!completedBites.includes(nibble.bites[currentBiteIndex].id)) {
        setCompletedBites(prev => [...prev, nibble.bites[currentBiteIndex].id]);
      }
      setCurrentBiteIndex(prev => prev + 1);
    }
  };

  const handlePrevBite = () => {
    if (currentBiteIndex > 0) {
      setCurrentBiteIndex(prev => prev - 1);
    }
  };

  const calculateProgress = () => {
    if (!nibble) return 0;
    const totalItems = nibble.bites.length + (nibble.activity ? 1 : 0);
    const completedItems = completedBites.length + (showAnswers ? 1 : 0);
    return Math.round((completedItems / totalItems) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !nibble) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Lesson Not Found</h2>
            <p className="text-slate-600 mb-4">{error || 'The requested lesson could not be found.'}</p>
            <Button onClick={() => navigate('/snack-packs')} className="bg-indigo-600 hover:bg-indigo-700">
              Browse Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBite = nibble.bites[currentBiteIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/snack-packs')}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Back to Lessons</span>
            </Button>
            <div className="flex items-center space-x-2 flex-wrap justify-center gap-1">
              <Badge className="bg-indigo-100 text-indigo-800">
                Lesson {nibble.lesson_number}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {nibble.series_name}
              </Badge>
              {nibble.edition && (
                <Badge className={nibble.edition === 'Youth' 
                  ? "bg-cyan-100 text-cyan-800" 
                  : "bg-blue-600 text-white"}>
                  {nibble.edition === 'Youth' ? '🧢✨ Youth' : '👨 Adult'} Edition
                </Badge>
              )}
              {nibble.month && (
                <Badge className="bg-amber-100 text-amber-800">
                  Month {nibble.month}: {nibble.theme}
                </Badge>
              )}
            </div>
            <Button
              onClick={handleSaveProgress}
              disabled={savingProgress}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              {savingProgress ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Lesson Progress</span>
            <span className="text-sm font-medium text-indigo-600">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Lesson Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">{nibble.title}</h1>
          
          {/* Key Verse */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-6 inline-block">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm font-semibold text-indigo-600 mb-1">Key Verse</p>
              <p className="text-indigo-800 italic text-lg">"{nibble.key_verse_text}"</p>
              <p className="text-indigo-600 text-sm mt-1">{nibble.key_verse_ref}</p>
            </CardContent>
          </Card>
        </div>

        {/* Opening Prayer */}
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-emerald-800">
              <span className="mr-2">🙏</span> Opening Prayer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 italic">{nibble.opening_prayer}</p>
          </CardContent>
        </Card>

        {/* Appetizer (Background) */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-amber-800">
              <span className="mr-2">🍽️</span> Appetizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{nibble.appetizer}</p>
          </CardContent>
        </Card>

        {/* FREE PREVIEW CUTOFF - Content below is blurred for paid lessons */}
        {!isFreelesson(nibble) && !hasPurchased ? (
          /* BLURRED PREVIEW FOR PAID LESSONS */
          <div className="relative">
            {/* Blurred Background Content (just visual hint) */}
            <div className="filter blur-md opacity-50 pointer-events-none select-none">
              {/* Bites Navigation Preview */}
              <div className="flex justify-center gap-2 mb-6">
                {nibble.bites.slice(0, 4).map((bite, index) => (
                  <div
                    key={bite.id}
                    className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              {/* Preview of Bite Card */}
              <Card className="mb-6 border-indigo-200">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-xl text-indigo-800">
                    Bite 1: {nibble.bites[0]?.title || 'Lesson Content'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-20 bg-slate-100 rounded mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white">
              <Card className="max-w-md mx-4 shadow-2xl border-2 border-indigo-300 bg-white">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    Preview Ends Here
                  </h3>
                  <p className="text-slate-600 mb-6">
                    You've seen the appetizer! Purchase this lesson to unlock the full teaching, 
                    Bible study content, reflection questions, and downloadable materials.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate('/quick-order')}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold py-3"
                    >
                      🛒 Purchase Full Lesson
                    </Button>
                    <Button
                      onClick={() => navigate('/snack-packs')}
                      variant="outline"
                      className="w-full"
                    >
                      Browse All Lessons
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    Want to try first? Check out our <a href="/snack-packs" className="text-indigo-600 underline">FREE "In His Image" lessons</a>!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* FULL CONTENT FOR FREE LESSONS OR PURCHASED */
          <>
            {/* Bites Navigation */}
            <div className="flex justify-center gap-2 mb-6">
              {nibble.bites.map((bite, index) => (
                <button
                  key={bite.id}
                  onClick={() => setCurrentBiteIndex(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    index === currentBiteIndex
                      ? 'bg-indigo-600 text-white shadow-lg scale-110'
                      : completedBites.includes(bite.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {completedBites.includes(bite.id) && index !== currentBiteIndex ? '✓' : index + 1}
                </button>
              ))}
            </div>

            {/* Current Bite */}
            <Card className="mb-6 border-indigo-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                <CardTitle className="text-xl text-indigo-800 flex items-center">
                  <BookIcon />
                  <span className="ml-2">Bite {currentBiteIndex + 1}: {currentBite.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Scripture with proper citation */}
                <div className="bg-slate-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6">
                  <p className="text-slate-700 italic text-lg leading-relaxed">"{currentBite.scripture_text}"</p>
                  <p className="text-sm font-semibold text-indigo-600 mt-2">
                    — {currentBite.scripture_ref}
                    {currentBite.scripture_ref?.toLowerCase().includes('nog') || currentBite.scripture_ref?.toLowerCase().includes('names of god') ? (
                      <span className="text-xs text-slate-500 ml-2">(Names of God Bible™)</span>
                    ) : currentBite.scripture_ref?.toLowerCase().includes('tlv') ? (
                      <span className="text-xs text-slate-500 ml-2">(Tree of Life Version™)</span>
                    ) : null}
                  </p>
                </div>

                {/* Teaching */}
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <LightBulbIcon />
                    <span className="ml-2">Teaching</span>
                  </h4>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">{currentBite.teaching}</div>
                </div>

                {/* Core Shared Truth */}
                {currentBite.cst && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="font-semibold text-purple-800 flex items-center">
                      <CheckCircleIcon />
                      <span className="ml-2">Core Shared Truth:</span>
                    </p>
                    <p className="text-purple-700 mt-1">{currentBite.cst}</p>
                  </div>
                )}

                {/* Reflection Question */}
                {currentBite.question && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-semibold text-amber-800 mb-3">
                      💭 {currentBite.question.type === 'reflection' ? 'Reflection Question' : 'Question'}
                    </p>
                    <p className="text-slate-700 mb-3">{currentBite.question.prompt}</p>
                    <Textarea
                      value={answers[currentBite.question.id] || ''}
                      onChange={(e) => handleAnswerChange(currentBite.question.id, e.target.value)}
                      placeholder="Write your thoughts here..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bite Navigation Buttons */}
            <div className="flex justify-between mb-8">
              <Button
                onClick={handlePrevBite}
                disabled={currentBiteIndex === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon /> Previous
              </Button>
              <Button
                onClick={handleNextBite}
                disabled={currentBiteIndex === nibble.bites.length - 1}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Next <ArrowRightIcon />
              </Button>
            </div>

            {/* To-Go Box (Key Takeaways) */}
            <Card className="mb-6 border-teal-200 bg-teal-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-teal-800">
                  <span className="mr-2">🥡</span> To-Go Box (Key Takeaways)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {nibble.to_go_box.map((item, index) => (
                    <li key={`takeaway-${index}-${String(item).slice(0, 24)}`} className="flex items-start">
                      <span className="text-teal-600 mr-2">✓</span>
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Activity Section */}
            {nibble.activity && (
              <Card className="mb-6 border-pink-200 bg-pink-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center text-pink-800">
                    <span className="mr-2">✏️</span> {nibble.activity.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{nibble.activity.instructions}</p>
                  
                  <div className="space-y-4">
                    {nibble.activity.questions.map((question, index) => (
                      <div key={question.id} className="bg-white rounded-lg p-4 border border-pink-200">
                        <label className="block font-medium text-slate-700 mb-2">
                          {index + 1}. {question.prompt}
                        </label>
                    
                    {question.type === 'fill_in_blank' ? (
                      <Input
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Your answer..."
                        className="w-full"
                      />
                    ) : question.type === 'word_scramble' ? (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">
                          Unscramble: <span className="font-mono font-bold text-indigo-600">{question.scrambled_letters}</span>
                        </p>
                        <Input
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Unscrambled word..."
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Write your reflection..."
                        className="min-h-[80px]"
                      />
                    )}

                    {/* Show answer after checking */}
                    {showAnswers && results && (
                      <div className="mt-2">
                        {results.results.find(r => r.question_id === question.id)?.type === 'reflection' ? (
                          <p className="text-emerald-600 text-sm flex items-center">
                            <CheckCircleIcon />
                            <span className="ml-1">Reflection recorded</span>
                          </p>
                        ) : results.results.find(r => r.question_id === question.id)?.is_correct ? (
                          <p className="text-emerald-600 text-sm flex items-center">
                            <CheckCircleIcon />
                            <span className="ml-1">Correct!</span>
                          </p>
                        ) : (
                          <div className="text-amber-600 text-sm">
                            <p className="font-medium">Correct answer: {results.results.find(r => r.question_id === question.id)?.correct_answer}</p>
                            {question.hint && (
                              <p className="text-slate-500 text-xs mt-1">Hint: {question.hint}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Check Answers Button */}
              <div className="mt-6 text-center">
                <Button
                  onClick={handleCheckAnswers}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-8 py-3 text-lg font-semibold shadow-lg"
                >
                  {showAnswers ? '🔄 Check Again' : '✨ Check My Answers'}
                </Button>
                
                {showAnswers && results && results.score !== null && (
                  <div className="mt-4">
                    <Badge className={`text-lg px-4 py-2 ${results.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                      Score: {Math.round(results.score)}% ({results.correct_count}/{results.total_gradable} correct)
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Prayer */}
        {nibble.your_prayer_prompt && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-purple-800">
                <span className="mr-2">✍️</span> Your Prayer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-3">{nibble.your_prayer_prompt}</p>
              <Textarea
                value={answers['your_prayer'] || ''}
                onChange={(e) => handleAnswerChange('your_prayer', e.target.value)}
                placeholder="Write your prayer here..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Closing Prayer */}
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-emerald-800">
              <span className="mr-2">🙏</span> Closing Prayer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 italic">{nibble.closing_prayer}</p>
          </CardContent>
        </Card>

        {/* Scripture Disclosure */}
        <p className="text-center text-xs text-slate-500 mb-6">
          {nibble.scripture_disclosure}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSaveProgress}
            disabled={savingProgress}
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
          >
            {savingProgress ? 'Saving...' : '💾 Save My Progress'}
          </Button>
          <Button
            onClick={() => {
              // Download PDF
              const downloadUrl = `${API}/interactive-lessons/download/nibble/${nibbleId}`;
              window.open(downloadUrl, '_blank');
              toast.success('PDF download started!');
            }}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
          >
            <DownloadIcon /> Download PDF
          </Button>
          <Button
            onClick={() => navigate('/snack-packs')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
          >
            🎓 Next Lesson
          </Button>
        </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6 px-4 mt-8">
        <div className="container mx-auto text-center">
          <p className="text-slate-400 text-sm">
            Soul Food - Kingdom Living Project | Putting on the whole armor of God
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InteractiveLesson;
