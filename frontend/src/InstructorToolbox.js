/**
 * Instructor Toolbox - Gated area for instructors
 * ==============================================
 * Features:
 * - Answer Keys for lessons
 * - Facilitation Notes & Tips
 * - Group Roster Management
 * - Teaching Resources
 * - Game Setup Guides
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner';
import { 
  BookOpen, Key, Users, Lightbulb, Gamepad2, FileText, 
  Lock, ChevronRight, Download, Eye, ArrowLeft, Search,
  GraduationCap, ClipboardList, Trophy, BookMarked
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const InstructorToolbox = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [answerKeys, setAnswerKeys] = useState([]);
  const [facilitationNotes, setFacilitationNotes] = useState([]);
  const [roster, setRoster] = useState([]);
  
  // Game filtering state - which lessons have been covered
  const [coveredLessons, setCoveredLessons] = useState(() => {
    const saved = localStorage.getItem('sf_covered_lessons');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedSeries, setSelectedSeries] = useState('holiday');
  const [gameMode, setGameMode] = useState(null); // 'grinch' | 'passport' | null

  // Save covered lessons to localStorage
  useEffect(() => {
    localStorage.setItem('sf_covered_lessons', JSON.stringify(coveredLessons));
  }, [coveredLessons]);

  // Curriculum structure - all series and their lessons
  const curriculumStructure = {
    holiday: {
      name: 'Holiday Series (4 Cs)',
      lessons: [
        { id: 'hol-covenant', title: 'The Covenant', subtitle: 'God Keeps His Promises', bites: ['Bite 1: Rainbow Promise', 'Bite 2: Abraham\'s Covenant', 'Bite 3: New Covenant in Christ'] },
        { id: 'hol-cradle', title: 'The Cradle', subtitle: 'God Comes to Be with Us', bites: ['Bite 1: Prophecy Fulfilled', 'Bite 2: Immanuel', 'Bite 3: The Incarnation'] },
        { id: 'hol-cross', title: 'The Cross', subtitle: 'God Provides Salvation', bites: ['Bite 1: The Sacrifice', 'Bite 2: Substitution', 'Bite 3: It Is Finished'] },
        { id: 'hol-comforter', title: 'The Comforter', subtitle: 'God Remains with Us', bites: ['Bite 1: The Promise', 'Bite 2: Pentecost', 'Bite 3: Fruits of the Spirit'] }
      ],
      bonusLessons: [
        { id: 'hol-names-of-god', title: 'Names of God', subtitle: 'Understanding the Sacred Language' },
        { id: 'hol-times-seasons', title: 'Times and Seasons', subtitle: 'God\'s Order in Days and Numbers' }
      ]
    },
    breakfast: {
      name: 'Break*fast Series',
      lessons: [
        // Month 1 - Prayer
        { id: 'bkft-m1-l1', title: 'Hannah', subtitle: 'Prayer', month: 1 },
        { id: 'bkft-m1-l2', title: 'Solomon', subtitle: 'Wisdom', month: 1 },
        { id: 'bkft-m1-l3', title: 'Centurion', subtitle: 'Authority', month: 1 },
        { id: 'bkft-m1-l4', title: 'Chronic Woman', subtitle: 'Persistence', month: 1 },
        // Month 2 - Through
        { id: 'bkft-m2-l1', title: 'Joseph', subtitle: 'Forgiveness', month: 2 },
        { id: 'bkft-m2-l2', title: 'Abram', subtitle: 'Trust', month: 2 },
        { id: 'bkft-m2-l3', title: 'Rahab', subtitle: 'Courage', month: 2 },
        { id: 'bkft-m2-l4', title: 'Esther', subtitle: 'Purpose', month: 2 },
        // Month 3 - Worship
        { id: 'bkft-m3-l1', title: 'David', subtitle: 'Worship', month: 3 },
        { id: 'bkft-m3-l2', title: 'Mary', subtitle: 'Surrender', month: 3 },
        { id: 'bkft-m3-l3', title: 'Paul & Silas', subtitle: 'Joy in Trials', month: 3 },
        { id: 'bkft-m3-l4', title: 'The Leper', subtitle: 'Gratitude', month: 3 }
      ]
    }
  };

  // Toggle lesson coverage
  const toggleLessonCovered = (seriesId, lessonId) => {
    setCoveredLessons(prev => {
      const seriesKey = `${seriesId}`;
      const current = prev[seriesKey] || [];
      if (current.includes(lessonId)) {
        return { ...prev, [seriesKey]: current.filter(id => id !== lessonId) };
      } else {
        return { ...prev, [seriesKey]: [...current, lessonId] };
      }
    });
  };

  // Check if lesson is covered
  const isLessonCovered = (seriesId, lessonId) => {
    return (coveredLessons[seriesId] || []).includes(lessonId);
  };

  // Get count of covered lessons for a series
  const getCoveredCount = (seriesId) => {
    return (coveredLessons[seriesId] || []).length;
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('soul_food_token');
      const userData = localStorage.getItem('soul_food_user');
      
      if (!token || !userData) {
        navigate('/login', { state: { returnTo: '/instructor-toolbox', message: 'Please sign in with an Instructor account to access the Toolbox.' } });
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        
        // Check if user has instructor access
        const instructorRoles = ['instructor', 'instructor_tester', 'admin', 'owner'];
        const hasAccess = instructorRoles.includes(parsedUser.role) || 
                          parsedUser.access_level === 'instructor' ||
                          parsedUser.permissions?.includes('view_instructor_content');
        
        if (!hasAccess) {
          toast.error('Instructor access required');
          navigate('/', { state: { message: 'Instructor Edition access required for the Toolbox.' } });
          return;
        }

        setUser(parsedUser);
        await loadInstructorContent(token);
      } catch (err) {
        console.error('Auth check failed:', err);
        navigate('/login', { state: { returnTo: '/instructor-toolbox' } });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadInstructorContent = async (token) => {
    try {
      // Load answer keys
      const keysRes = await fetch(`${API_URL}/api/instructor/answer-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setAnswerKeys(keysData.items || []);
      }

      // Load facilitation notes
      const notesRes = await fetch(`${API_URL}/api/instructor/facilitation-notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setFacilitationNotes(notesData.items || []);
      }

      // Load roster
      const rosterRes = await fetch(`${API_URL}/api/instructor/roster`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rosterRes.ok) {
        const rosterData = await rosterRes.json();
        setRoster(rosterData.members || []);
      }
    } catch (err) {
      console.error('Failed to load instructor content:', err);
    }
  };

  // Toolbox sections
  const toolboxSections = [
    {
      id: 'answer-keys',
      title: 'Answer Keys',
      icon: Key,
      description: 'Complete answer guides for all lessons',
      color: 'bg-emerald-500',
      badge: answerKeys.length > 0 ? `${answerKeys.length} Available` : null
    },
    {
      id: 'facilitation',
      title: 'Facilitation Notes',
      icon: Lightbulb,
      description: 'Teaching tips, discussion prompts, and group activities',
      color: 'bg-amber-500',
      badge: facilitationNotes.length > 0 ? `${facilitationNotes.length} Guides` : null
    },
    {
      id: 'roster',
      title: 'Group Roster',
      icon: Users,
      description: 'Manage your study group members and track progress',
      color: 'bg-blue-500',
      badge: roster.length > 0 ? `${roster.length} Members` : null
    },
    {
      id: 'games',
      title: 'Game Setup',
      icon: Gamepad2,
      description: 'How to run GRinCH and Passport Trek with your group',
      color: 'bg-purple-500'
    },
    {
      id: 'resources',
      title: 'Teaching Resources',
      icon: BookMarked,
      description: 'Printables, slides, and supplementary materials',
      color: 'bg-rose-500'
    },
    {
      id: 'certificates',
      title: 'Achievement Awards',
      icon: Trophy,
      description: 'Print certificates and order medallions for your group',
      color: 'bg-orange-500'
    }
  ];

  // Sample answer keys data (these would come from the API)
  const sampleAnswerKeys = [
    { id: 'bkft-m1-l1', series: 'Breakfast', module: 'Month 1', lesson: 'Hannah - Prayer', available: true },
    { id: 'bkft-m1-l2', series: 'Breakfast', module: 'Month 1', lesson: 'Solomon - Wisdom', available: true },
    { id: 'bkft-m1-l3', series: 'Breakfast', module: 'Month 1', lesson: 'Centurion - Authority', available: true },
    { id: 'bkft-m1-l4', series: 'Breakfast', module: 'Month 1', lesson: 'Chronic Woman - Persistence', available: true },
    { id: 'bkft-m2-l1', series: 'Breakfast', module: 'Month 2', lesson: 'Joseph - Forgiveness', available: true },
    { id: 'bkft-m2-l2', series: 'Breakfast', module: 'Month 2', lesson: 'Abram - Trust', available: true },
    { id: 'bkft-m2-l3', series: 'Breakfast', module: 'Month 2', lesson: 'Rahab - Courage', available: true },
    { id: 'bkft-m2-l4', series: 'Breakfast', module: 'Month 2', lesson: 'Esther - Purpose', available: true },
    { id: 'hol-l1', series: 'Holiday', module: '4Cs', lesson: 'Covenant - Abraham', available: true },
    { id: 'hol-l2', series: 'Holiday', module: '4Cs', lesson: 'Cradle - Nativity', available: true },
    { id: 'hol-l3', series: 'Holiday', module: '4Cs', lesson: 'Cross - Redemption', available: true },
    { id: 'hol-l4', series: 'Holiday', module: '4Cs', lesson: 'Comforter - Holy Spirit', available: true }
  ];

  // Sample facilitation notes
  const sampleFacilitationNotes = [
    { id: 'fn-opening', title: 'Opening Your Session', type: 'general', description: 'Ice breakers and prayer starters' },
    { id: 'fn-discussion', title: 'Leading Discussions', type: 'general', description: 'Encouraging participation without lectures' },
    { id: 'fn-activities', title: 'Group Activities Guide', type: 'general', description: 'Interactive exercises for each lesson' },
    { id: 'fn-prayer', title: 'Prayer Module Tips', type: 'breakfast-m1', description: 'Month 1 - Prayer theme teaching notes' },
    { id: 'fn-through', title: 'Through Module Tips', type: 'breakfast-m2', description: 'Month 2 - Perseverance theme notes' },
    { id: 'fn-closing', title: 'Closing Strong', type: 'general', description: 'Recap and takeaway assignments' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'answer-keys':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search answer keys..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              {sampleAnswerKeys
                .filter(key => 
                  key.lesson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  key.series.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(key => (
                <Card key={key.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Key className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{key.lesson}</p>
                        <p className="text-sm text-slate-500">{key.series} • {key.module}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info('Opening answer key preview...')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => toast.success('Downloading answer key PDF...')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'facilitation':
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-6">
              Practical guides to help you lead engaging and meaningful study sessions.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {sampleFacilitationNotes.map(note => (
                <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.info(`Opening: ${note.title}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{note.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{note.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {note.type === 'general' ? 'All Lessons' : note.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'roster':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                Track your study group members and their progress.
              </p>
              <Button onClick={() => toast.info('Add member form coming soon!')}>
                <Users className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            {roster.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="font-semibold text-slate-700 mb-2">No Members Yet</h3>
                  <p className="text-slate-500 mb-4">
                    Add your study group members to track their progress and engagement.
                  </p>
                  <Button onClick={() => toast.info('Add member feature coming soon!')}>
                    Add Your First Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {roster.map(member => (
                  <Card key={member.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">{member.name?.[0] || '?'}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.progress || '0%'} Complete</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'games':
        return (
          <div className="space-y-6">
            <p className="text-slate-600">
              Everything you need to run engaging game sessions with your study group.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-800">GRinCH</CardTitle>
                      <CardDescription>Grid Iron Challenge</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Team-based trivia game testing lesson knowledge. Perfect for review sessions.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> 2-4 teams
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Point multipliers for difficulty
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Championship rounds
                    </li>
                  </ul>
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/gaming')}>
                    Launch GRinCH Setup
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-800">Passport Trek</CardTitle>
                      <CardDescription>Journey Through Scripture</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Individual progress tracking through biblical locations and themes.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Individual or team mode
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Stamp collection rewards
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Completion certificates
                    </li>
                  </ul>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/gaming')}>
                    Launch Passport Trek
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-4">
                <Lightbulb className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Pro Tip: Game Session Timing</p>
                  <p className="text-sm text-amber-700">
                    Schedule games for the last 15-20 minutes of your session as a reward for completing the lesson discussion.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'resources':
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-6">
              Downloadable materials to enhance your teaching sessions.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'Lesson Slides Template', type: 'PowerPoint', icon: FileText },
                { title: 'Attendance Sheet', type: 'PDF', icon: ClipboardList },
                { title: 'Prayer Request Cards', type: 'Printable', icon: BookOpen },
                { title: 'Discussion Question Cards', type: 'Printable', icon: Lightbulb },
                { title: 'Scripture Memory Verses', type: 'PDF', icon: BookMarked },
                { title: 'Group Activity Handouts', type: 'PDF', icon: Users }
              ].map((resource, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.info('Resource download coming soon!')}>
                  <CardContent className="p-4 text-center">
                    <resource.icon className="w-8 h-8 mx-auto text-rose-500 mb-3" />
                    <p className="font-semibold text-slate-800 text-sm">{resource.title}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{resource.type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'certificates':
        return (
          <div className="space-y-6">
            <p className="text-slate-600">
              Recognize your group members' achievements with official certificates and medallions.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    Printable Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Download and print achievement certificates for your group members.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Certificate generator coming soon!')}>
                      <Download className="w-4 h-4 mr-2" />
                      Lesson Completion Certificate
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Certificate generator coming soon!')}>
                      <Download className="w-4 h-4 mr-2" />
                      Series Completion Certificate
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Certificate generator coming soon!')}>
                      <Download className="w-4 h-4 mr-2" />
                      Game Champion Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    Achievement Medallions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Order metal medallions to award outstanding achievement.
                  </p>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-sm font-medium text-orange-800">Bulk Discounts Available!</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Teacher Pack (3) - $24.99 | Ministry Pack (10) - $69.99
                    </p>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/quick-order')}>
                    Order Medallions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolboxSections.map(section => (
              <Card 
                key={section.id} 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-slate-300"
                onClick={() => setActiveTab(section.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{section.title}</h3>
                  <p className="text-sm text-slate-600">{section.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-slate-700">
                    Open <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying instructor access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Instructor Toolbox</h1>
                <p className="text-xs text-slate-500">Teaching Resources & Tools</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">
                <Lock className="w-3 h-3 mr-1" />
                Instructor Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        {activeTab === 'overview' && (
          <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome, {user?.name || 'Instructor'}! 👋
                  </h2>
                  <p className="text-blue-100">
                    Access your teaching tools, answer keys, and group management features.
                  </p>
                </div>
                <GraduationCap className="w-16 h-16 text-blue-200 hidden md:block" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Breadcrumb / Tab Navigation */}
        {activeTab !== 'overview' && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('overview')}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Toolbox Overview
            </Button>
            <h2 className="text-2xl font-bold text-slate-800 mt-4">
              {toolboxSections.find(s => s.id === activeTab)?.title || 'Toolbox'}
            </h2>
          </div>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Quick Stats - Only on Overview */}
        {activeTab === 'overview' && (
          <Card className="mt-8 bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-emerald-600">{sampleAnswerKeys.length}</p>
                  <p className="text-sm text-slate-500">Answer Keys</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-amber-600">{sampleFacilitationNotes.length}</p>
                  <p className="text-sm text-slate-500">Teaching Guides</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-blue-600">{roster.length}</p>
                  <p className="text-sm text-slate-500">Group Members</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-purple-600">2</p>
                  <p className="text-sm text-slate-500">Game Modes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default InstructorToolbox;
