import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Users, Plus, X, Check, ChevronRight,
  Eye, RotateCcw, ArrowLeft, Crown, Skull,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// =============================================================================
// Millionaire — Presenter-Mode Elimination
// Multiple teams. Each question is a filter. Instructor marks correct/incorrect.
// Incorrect teams are eliminated. Game ends when one team remains or board is done.
// No points. No persistence. No student devices. Ephemeral browser state only.
// =============================================================================

const PHASE_SETUP = 'setup';
const PHASE_PLAYING = 'playing';
const PHASE_GAMEOVER = 'gameover';

const STATUS_ACTIVE = 'active';
const STATUS_ELIMINATED = 'eliminated';

const MARK_PENDING = 'pending';
const MARK_CORRECT = 'correct';
const MARK_INCORRECT = 'incorrect';

// Team caps — default 4, optional 5 via toggle. No UI rework, just enforces the limit.
const MIN_TEAMS = 2;
const MAX_TEAMS_DEFAULT = 4;
const MAX_TEAMS_EXTENDED = 5;

const MillionairePresenter = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASE_SETUP);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [allowFifthTeam, setAllowFifthTeam] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marks, setMarks] = useState({}); // {teamId: 'pending'|'correct'|'incorrect'}
  const [revealed, setRevealed] = useState(false);

  const maxTeams = allowFifthTeam ? MAX_TEAMS_EXTENDED : MAX_TEAMS_DEFAULT;
  const atTeamCap = teams.length >= maxTeams;

  // ---------- Setup ----------
  const addTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    if (atTeamCap) return;
    if (teams.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
    setTeams(prev => [
      ...prev,
      { id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, status: STATUS_ACTIVE, eliminatedAtLevel: null },
    ]);
    setNewTeamName('');
  };

  const removeTeam = (id) => {
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  const startGame = async () => {
    if (teams.length < 2) return;
    setQuestionsLoading(true);
    setQuestionsError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/trivia/questions/for-game?game_type=tricky_trivia`);
      if (!res.ok) throw new Error(`Question load failed (${res.status})`);
      const data = await res.json();
      const qs = (data.questions || data).filter(q => q.options && q.options.length >= 3);
      if (qs.length === 0) throw new Error('No Millionaire-style questions available.');
      setQuestions(qs);
      setCurrentIndex(0);
      setRevealed(false);
      setMarks(Object.fromEntries(teams.map(t => [t.id, MARK_PENDING])));
      setPhase(PHASE_PLAYING);
    } catch (err) {
      setQuestionsError(err.message || 'Failed to load questions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // ---------- Active gameplay ----------
  const activeTeams = useMemo(() => teams.filter(t => t.status === STATUS_ACTIVE), [teams]);
  const eliminatedTeams = useMemo(() => teams.filter(t => t.status === STATUS_ELIMINATED), [teams]);
  const currentQuestion = questions[currentIndex];
  const allActiveMarked = activeTeams.length > 0 && activeTeams.every(t => marks[t.id] && marks[t.id] !== MARK_PENDING);

  const setTeamMark = (teamId, mark) => {
    setMarks(prev => ({ ...prev, [teamId]: prev[teamId] === mark ? MARK_PENDING : mark }));
  };

  const advance = () => {
    // Eliminate teams marked incorrect at this level
    const level = currentIndex + 1;
    const updatedTeams = teams.map(t => {
      if (t.status !== STATUS_ACTIVE) return t;
      if (marks[t.id] === MARK_INCORRECT) {
        return { ...t, status: STATUS_ELIMINATED, eliminatedAtLevel: level };
      }
      return t;
    });
    setTeams(updatedTeams);

    const survivors = updatedTeams.filter(t => t.status === STATUS_ACTIVE);
    const isLastQuestion = currentIndex >= questions.length - 1;

    if (survivors.length <= 1 || isLastQuestion) {
      setPhase(PHASE_GAMEOVER);
      return;
    }

    // Next question
    setCurrentIndex(idx => idx + 1);
    setRevealed(false);
    setMarks(Object.fromEntries(survivors.map(t => [t.id, MARK_PENDING])));
  };

  const restart = () => {
    setPhase(PHASE_SETUP);
    setTeams(prev => prev.map(t => ({ ...t, status: STATUS_ACTIVE, eliminatedAtLevel: null })));
    setQuestions([]);
    setCurrentIndex(0);
    setMarks({});
    setRevealed(false);
    setQuestionsError('');
  };

  const newGame = () => {
    setPhase(PHASE_SETUP);
    setTeams([]);
    setQuestions([]);
    setCurrentIndex(0);
    setMarks({});
    setRevealed(false);
    setQuestionsError('');
  };

  // ---------- Setup screen ----------
  if (phase === PHASE_SETUP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6" data-testid="millionaire-presenter-setup">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="text-slate-300 hover:text-white mb-4"
            onClick={() => navigate('/gaming-central')}
            data-testid="back-to-gaming-central-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gaming Central
          </Button>

          <Card className="bg-slate-800/60 border-amber-500/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-amber-300">
                <Trophy className="w-7 h-7" /> Millionaire — Presenter Mode
              </CardTitle>
              <p className="text-sm text-slate-300 mt-1">
                Add teams. Each question filters the field. Mark correct/incorrect — wrong teams eliminate at that level.
                Last team standing wins. No points. No student devices. Instructor-controlled.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-2">
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                  placeholder={atTeamCap ? `Max ${maxTeams} teams reached` : "Team name (e.g. Lions of Judah)"}
                  disabled={atTeamCap}
                  className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 disabled:opacity-50"
                  data-testid="team-name-input"
                />
                <Button
                  onClick={addTeam}
                  disabled={atTeamCap}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold disabled:opacity-50"
                  data-testid="add-team-btn"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span data-testid="team-count">{teams.length} / {maxTeams} teams</span>
                <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="allow-fifth-team-toggle-label">
                  <input
                    type="checkbox"
                    checked={allowFifthTeam}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setAllowFifthTeam(next);
                      if (!next && teams.length > MAX_TEAMS_DEFAULT) {
                        // Trim from the end if user disables the 5th-team option
                        setTeams(prev => prev.slice(0, MAX_TEAMS_DEFAULT));
                      }
                    }}
                    className="accent-amber-500"
                    data-testid="allow-fifth-team-toggle"
                  />
                  <span>Allow up to 5 teams</span>
                </label>
              </div>

              <div className="space-y-2" data-testid="team-list">
                {teams.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Add at least 2 teams to begin.</p>
                ) : (
                  teams.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between bg-slate-900/40 border border-slate-700/60 rounded-lg px-4 py-2"
                      data-testid={`team-row-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span className="font-medium">{t.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTeam(t.id)}
                        className="text-slate-400 hover:text-red-400"
                        data-testid={`remove-team-btn-${idx}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {questionsError && (
                <div className="bg-red-900/40 border border-red-500/40 rounded-lg p-3 text-sm text-red-200" data-testid="questions-error">
                  {questionsError}
                </div>
              )}

              <Button
                onClick={startGame}
                disabled={teams.length < 2 || questionsLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold text-lg py-6 disabled:opacity-50"
                data-testid="start-game-btn"
              >
                {questionsLoading ? 'Loading questions…' : (
                  <>
                    Start Elimination Round <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Game over screen ----------
  if (phase === PHASE_GAMEOVER) {
    const survivors = teams.filter(t => t.status === STATUS_ACTIVE);
    const sortedEliminated = [...eliminatedTeams].sort((a, b) => (b.eliminatedAtLevel || 0) - (a.eliminatedAtLevel || 0));
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6" data-testid="millionaire-gameover">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-slate-800/60 border-amber-500/40 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-amber-300 flex items-center justify-center gap-3">
                <Crown className="w-8 h-8" />
                {survivors.length === 1 ? 'Champion!' : 'Board Completed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {survivors.length === 1 ? (
                <div className="text-center py-8" data-testid="winner-banner">
                  <div className="text-6xl mb-4">🏆</div>
                  <div className="text-3xl font-bold text-amber-300">{survivors[0].name}</div>
                  <p className="text-slate-300 mt-2">survived all {currentIndex + 1} levels</p>
                </div>
              ) : (
                <div className="text-center py-6" data-testid="multiple-survivors-banner">
                  <p className="text-lg text-slate-200">{survivors.length} teams remain after the final question:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {survivors.map((t, i) => (
                      <Badge key={t.id} className="bg-amber-500 text-slate-900 text-base px-3 py-1" data-testid={`survivor-${i}`}>
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {sortedEliminated.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <Skull className="w-4 h-4" /> Eliminated
                  </h3>
                  <div className="space-y-1">
                    {sortedEliminated.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-900/40 rounded px-3 py-1.5 text-sm">
                        <span className="text-slate-300">{t.name}</span>
                        <span className="text-slate-500">eliminated at Q{t.eliminatedAtLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={restart}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  data-testid="play-again-same-teams-btn"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again — Same Teams
                </Button>
                <Button
                  onClick={newGame}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
                  data-testid="new-game-btn"
                >
                  New Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Playing screen ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6" data-testid="millionaire-playing">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Badge className="bg-amber-500 text-slate-900 text-sm px-3 py-1" data-testid="level-badge">
            Question {currentIndex + 1} / {questions.length}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-slate-300" data-testid="active-count">
            <Users className="w-4 h-4 text-amber-400" />
            {activeTeams.length} active · {eliminatedTeams.length} eliminated
          </div>
        </div>

        {/* Question */}
        <Card className="bg-slate-800/60 border-amber-500/30">
          <CardContent className="p-6 space-y-4">
            <p className="text-xl font-semibold text-amber-100" data-testid="question-prompt">
              {currentQuestion?.question}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(currentQuestion?.options || []).map((opt, idx) => {
                const isCorrect = revealed && opt === currentQuestion?.correct_answer;
                return (
                  <div
                    key={idx}
                    className={`px-4 py-3 rounded-lg border text-base transition-all ${
                      isCorrect
                        ? 'bg-green-500/20 border-green-400 text-green-100 font-semibold'
                        : 'bg-slate-900/40 border-slate-700 text-slate-200'
                    }`}
                    data-testid={`option-${idx}`}
                  >
                    <span className="text-amber-400 font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>
            {!revealed ? (
              <Button
                onClick={() => setRevealed(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                data-testid="reveal-answer-btn"
              >
                <Eye className="w-4 h-4 mr-2" /> Reveal Answer
              </Button>
            ) : (
              <p className="text-sm text-green-300 text-center" data-testid="answer-revealed-text">
                Correct answer revealed. Mark each team below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team marking grid */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Active teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="active-teams-grid">
            {activeTeams.map((t, idx) => {
              const mark = marks[t.id] || MARK_PENDING;
              return (
                <div
                  key={t.id}
                  className={`bg-slate-800/60 border rounded-lg p-3 flex items-center justify-between transition-all ${
                    mark === MARK_CORRECT ? 'border-green-500' : mark === MARK_INCORRECT ? 'border-red-500' : 'border-slate-700'
                  }`}
                  data-testid={`active-team-row-${idx}`}
                >
                  <div className="font-medium text-white">{t.name}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setTeamMark(t.id, MARK_CORRECT)}
                      className={`${mark === MARK_CORRECT ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-green-700'} text-white`}
                      data-testid={`mark-correct-btn-${idx}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setTeamMark(t.id, MARK_INCORRECT)}
                      className={`${mark === MARK_INCORRECT ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-red-700'} text-white`}
                      data-testid={`mark-incorrect-btn-${idx}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eliminated teams (visible but inactive) */}
        {eliminatedTeams.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <Skull className="w-4 h-4" /> Eliminated
            </h3>
            <div className="flex flex-wrap gap-2" data-testid="eliminated-teams-list">
              {eliminatedTeams.map((t) => (
                <Badge key={t.id} className="bg-slate-700 text-slate-400 line-through" data-testid={`eliminated-${t.id}`}>
                  {t.name} (Q{t.eliminatedAtLevel})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Advance */}
        <Button
          onClick={advance}
          disabled={!revealed || !allActiveMarked}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold text-lg py-6 disabled:opacity-40"
          data-testid="next-question-btn"
        >
          {currentIndex >= questions.length - 1 ? 'Finalize Round' : 'Next Question'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        <Button
          onClick={newGame}
          variant="ghost"
          className="w-full text-slate-400 hover:text-red-400"
          data-testid="abort-game-btn"
        >
          End Game Early
        </Button>
      </div>
    </div>
  );
};

export default MillionairePresenter;
