import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import IntegrityGauge from '../../components/IntegrityGauge';
import CodeEditor from '../../components/CodeEditor';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, AlertTriangle, Clock,
  Upload, FileText, X, Code, AlignLeft,
  Maximize, ShieldAlert, CheckCircle2, Circle
} from 'lucide-react';

interface Task {
  id: number; title: string; description: string;
  type: string; courseName: string; deadline: string;
  maxScore: number; durationMinutes?: number;
}
interface Submission {
  id: number; status: string; integrityScore: number;
  content: string; fileUrl?: string; score?: number;
}
interface QuizQuestion {
  id: number; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  orderNum: number;
}
interface QuizResult {
  totalQuestions: number; correctAnswers: number;
  score: number; maxScore: number; percentage: number;
  answers: { questionId: number; questionText: string; selected: string; correctAnswer: string; isCorrect: boolean }[];
}

const TaskPage: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [events, setEvents] = useState<{ time: string; type: string; severity: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'text' | 'file'>('text');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizTimer, setQuizTimer] = useState<number>(0);
  const [savingAnswer, setSavingAnswer] = useState(false);

  const submissionRef = useRef<Submission | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  submissionRef.current = submission;

  const isQuiz = task?.type === 'QUIZ';

  // ===== FULLSCREEN =====
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current || document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const handleFSChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !submitted && submissionRef.current) {
        showWarningAlert('Fullscreen rejimdan chiqdingiz!', 'HIGH');
        sendEvent('FOCUS_LOST', 'Fullscreen rejimdan chiqildi');
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [submitted]);

  // ===== PROCTORING =====
  const sendEvent = useCallback(async (eventType: string, details: string) => {
    if (!submissionRef.current || submissionRef.current.status === 'SUBMITTED') return;
    try {
      await api.post('/proctor/event', { submissionId: submissionRef.current.id, eventType, details });
      const severity = ['TAB_SWITCH', 'FOCUS_LOST', 'COPY_PASTE'].includes(eventType) ? 'HIGH'
                     : ['SUSPICIOUS_TYPING', 'RIGHT_CLICK'].includes(eventType) ? 'MEDIUM' : 'LOW';
      const penalty = severity === 'HIGH' ? 15 : severity === 'MEDIUM' ? 7 : 2;
      setEvents(prev => [{ time: new Date().toLocaleTimeString(), type: eventType, severity }, ...prev.slice(0, 14)]);
      setSubmission(prev => prev ? { ...prev, integrityScore: Math.max(0, prev.integrityScore - penalty) } : null);
    } catch {}
  }, []);

  const showWarningAlert = useCallback((msg: string, severity: string) => {
    setWarningMsg(msg);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
    if (severity === 'HIGH') setTabSwitchCount(prev => prev + 1);
  }, []);

  // ===== EVENT LISTENERS =====
  useEffect(() => {
    if (!submission || submitted) return;
    const onVisibility = () => { if (document.hidden) { sendEvent('TAB_SWITCH', 'Boshqa tabga o\'tdi'); showWarningAlert('⚠️ Tab almashtirish aniqlandi!', 'HIGH'); } };
    const onBlur = () => { sendEvent('FOCUS_LOST', 'Fokus yo\'qoldi'); showWarningAlert('⚠️ Oyna minimallashtirildi!', 'HIGH'); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); sendEvent('COPY_PASTE', 'Nusxalash bloklandi'); showWarningAlert('🚫 Nusxalash bloklangan!', 'HIGH'); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); sendEvent('COPY_PASTE', 'Joylashtirish bloklandi'); showWarningAlert('🚫 Joylashtirish bloklangan!', 'HIGH'); };
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); sendEvent('RIGHT_CLICK', 'O\'ng tugma'); showWarningAlert('🚫 O\'ng tugma bloklangan!', 'MEDIUM'); };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) { e.preventDefault(); sendEvent('DEVTOOLS', 'DevTools urinish'); }
      if (e.altKey && e.key === 'Tab') { sendEvent('TAB_SWITCH', 'Alt+Tab'); showWarningAlert('⚠️ Alt+Tab aniqlandi!', 'HIGH'); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy as EventListener);
    document.addEventListener('paste', onPaste as EventListener);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy as EventListener);
      document.removeEventListener('paste', onPaste as EventListener);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [submission, submitted, sendEvent, showWarningAlert]);

  // ===== DEADLINE TIMER =====
  useEffect(() => {
    if (!task?.deadline) return;
    const timer = setInterval(() => {
      const diff = new Date(task.deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Muddat tugadi!'); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [task]);

  // ===== QUIZ TIMER =====
  useEffect(() => {
    if (!isQuiz || !task?.durationMinutes || submitted) return;
    setQuizTimer(task.durationMinutes * 60);
    const timer = setInterval(() => {
      setQuizTimer(prev => {
        if (prev <= 1) { clearInterval(timer); handleFinishQuiz(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQuiz, task, submitted]);

  // ===== INIT =====
  useEffect(() => {
    const init = async () => {
      try {
        const taskRes = await api.get(`/tasks/${taskId}`);
        setTask(taskRes.data);
        const subRes = await api.post(`/submissions/start/${taskId}`);
        setSubmission(subRes.data);
        setContent(subRes.data.content || '');
        if (subRes.data.status === 'SUBMITTED' || subRes.data.status === 'GRADED') {
          setSubmitted(true);
        }
        if (taskRes.data.type === 'QUIZ') {
          const qRes = await api.get(`/quiz/task/${taskId}/questions`);
          setQuizQuestions(qRes.data);
        }
      } catch { toast.error('Topshiriq yuklanmadi'); navigate('/student'); }
    };
    init();
  }, [taskId, navigate]);

  // ===== QUIZ ANSWER =====
  const handleSelectAnswer = async (questionId: number, answer: string) => {
    if (!submission || submitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    setSavingAnswer(true);
    try {
      await api.post(`/quiz/submission/${submission.id}/answer`, { questionId, selected: answer });
    } catch { toast.error('Javob saqlanmadi'); }
    finally { setSavingAnswer(false); }
  };

  const handleFinishQuiz = async () => {
    if (!submission) return;
    setLoading(true);
    try {
      const res = await api.post(`/quiz/submission/${submission.id}/finish`);
      setQuizResult(res.data);
      setSubmitted(true);
      exitFullscreen();
      toast.success(`Quiz yakunlandi! Ball: ${res.data.score}/${res.data.maxScore}`);
    } catch { toast.error('Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  // ===== TEXT SUBMIT =====
  const handleTextSubmit = async () => {
    if (!submission) return;
    setLoading(true);
    try {
      await api.post(`/submissions/${submission.id}/submit`, content, { headers: { 'Content-Type': 'text/plain' } });
      setSubmitted(true); exitFullscreen();
      toast.success('Topshirildi!');
    } catch { toast.error('Xato'); } finally { setLoading(false); }
  };

  const handleFileUpload = async () => {
    if (!file || !submission) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      await api.post(`/files/upload/${submission.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true); exitFullscreen();
      toast.success('Fayl yuklandi!');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Xato'); } finally { setUploading(false); }
  };

  const severityColor: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionValues = (q: QuizQuestion) => [q.optionA, q.optionB, q.optionC, q.optionD];
  const answeredCount = Object.keys(quizAnswers).length;
  const quizTimerStr = quizTimer > 0
    ? `${Math.floor(quizTimer / 60)}:${String(quizTimer % 60).padStart(2, '0')}`
    : '0:00';

  if (!task || !submission) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Yuklanmoqda...</div></div>;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 flex flex-col select-none">

      {/* Warning */}
      <AnimatePresence>
        {showWarning && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-500 text-red-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium">
            <ShieldAlert size={20} className="text-red-400" /> {warningMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirm */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-2">Chiqishni tasdiqlang</h3>
              <p className="text-slate-400 text-sm mb-6">Bu shubhali harakat sifatida qayd etiladi.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition">Qolish</button>
                <button onClick={() => { exitFullscreen(); navigate('/student'); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl transition">Chiqish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-white text-sm">{task.title}</h1>
            <p className="text-slate-400 text-xs">{task.courseName} · {task.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isQuiz && !submitted && (
            <div className={`flex items-center gap-2 text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${
              quizTimer < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : quizTimer < 300 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-white'
            }`}>
              <Clock size={14} /> {quizTimerStr}
            </div>
          )}
          {!isQuiz && timeLeft && (
            <div className={`flex items-center gap-2 text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${
              timeLeft === 'Muddat tugadi!' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-white'
            }`}>
              <Clock size={14} /> {timeLeft}
            </div>
          )}
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-500/30">
              {tabSwitchCount} qoidabuzarlik
            </div>
          )}
          <IntegrityGauge score={submission.integrityScore} size={48} />
          {!submitted && (
            <button onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${isFullscreen ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'}`}>
              <Maximize size={14} /> {isFullscreen ? 'Fullscreen' : 'Fullscreen kirish'}
            </button>
          )}
          {!submitted && !isQuiz && (
            <button onClick={editorMode === 'text' ? handleTextSubmit : handleFileUpload}
              disabled={loading || uploading || (editorMode === 'text' ? !content.trim() : !file)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <Send size={14} /> {loading || uploading ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ===== QUIZ MODE ===== */}
          {isQuiz && !submitted ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Question list sidebar */}
              <div className="w-48 bg-slate-900/50 border-r border-slate-800 p-3 overflow-y-auto shrink-0">
                <div className="text-xs text-slate-400 mb-2 font-medium">
                  {answeredCount}/{quizQuestions.length} javoblandi
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {quizQuestions.map((q, i) => (
                    <button key={q.id} onClick={() => setCurrentQuestion(i)}
                      className={`aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center ${
                        currentQuestion === i ? 'bg-indigo-600 text-white' :
                        quizAnswers[q.id] ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={handleFinishQuiz} disabled={loading}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white py-2 rounded-xl text-xs font-medium transition">
                  {loading ? 'Yakunlanmoqda...' : 'Yakunlash'}
                </button>
              </div>

              {/* Question area */}
              {quizQuestions.length > 0 ? (
                <div className="flex-1 p-8 overflow-y-auto">
                  <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-slate-400 text-sm">{currentQuestion + 1} / {quizQuestions.length}</span>
                      {savingAnswer && <span className="text-xs text-indigo-400">Saqlanmoqda...</span>}
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-8 leading-relaxed">
                      {quizQuestions[currentQuestion].questionText}
                    </h2>

                    <div className="space-y-3">
                      {optionValues(quizQuestions[currentQuestion]).map((opt, idx) => {
                        const label = optionLabels[idx];
                        const isSelected = quizAnswers[quizQuestions[currentQuestion].id] === label;
                        return (
                          <motion.button key={label} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectAnswer(quizQuestions[currentQuestion].id, label)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${
                              isSelected ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                            }`}>{label}</div>
                            <span className="flex-1">{opt}</span>
                            {isSelected ? <CheckCircle2 size={18} className="text-indigo-400 shrink-0" /> : <Circle size={18} className="text-slate-600 shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white py-3 rounded-xl transition text-sm font-medium">
                        ← Oldingi
                      </button>
                      <button onClick={() => setCurrentQuestion(Math.min(quizQuestions.length - 1, currentQuestion + 1))}
                        disabled={currentQuestion === quizQuestions.length - 1}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white py-3 rounded-xl transition text-sm font-medium">
                        Keyingi →
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-400">Savollar yuklanmoqda...</p>
                </div>
              )}
            </div>

          ) : isQuiz && submitted && quizResult ? (
            /* Quiz results */
            <div className="flex-1 overflow-y-auto p-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                      <CheckCircle2 size={36} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Quiz yakunlandi!</h2>
                    <div className="flex items-center justify-center gap-8 mt-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-400">{quizResult.score}</div>
                        <div className="text-slate-400 text-sm">/ {quizResult.maxScore} ball</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-indigo-400">{quizResult.correctAnswers}</div>
                        <div className="text-slate-400 text-sm">/ {quizResult.totalQuestions} to'g'ri</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-amber-400">{quizResult.percentage.toFixed(0)}%</div>
                        <div className="text-slate-400 text-sm">foiz</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Natijalar</h3>
                    {quizResult.answers.map((a, i) => (
                      <div key={a.questionId} className={`glass rounded-2xl p-4 border-l-4 ${a.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <span className={`text-xs font-bold ${a.isCorrect ? 'text-green-400' : 'text-red-400'}`}>{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm mb-2">{a.questionText}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className={`px-2 py-1 rounded-lg ${a.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                Sizning javob: {a.selected || '—'}
                              </span>
                              {!a.isCorrect && (
                                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400">
                                  To'g'ri: {a.correctAnswer}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate('/student')} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl transition font-medium">
                    Dashboardga qaytish
                  </button>
                </div>
              </motion.div>
            </div>

          ) : !isQuiz ? (
            <>
              {/* Description */}
              <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 shrink-0">
                <p className="text-slate-300 text-sm leading-relaxed">{task.description}</p>
              </div>

              {/* Editor tabs */}
              {!submitted && (
                <div className="flex gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/30 shrink-0">
                  <button onClick={() => setEditorMode('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${editorMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    {task.type === 'CODE' ? <Code size={12} /> : <AlignLeft size={12} />}
                    {task.type === 'CODE' ? 'Kod yozish' : 'Matn yozish'}
                  </button>
                  <button onClick={() => setEditorMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${editorMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    <Upload size={12} /> Fayl yuklash
                  </button>
                </div>
              )}

              {/* Submitted view */}
              {submitted ? (
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                      <Send size={32} className="text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Topshirildi!</h2>
                    {submission.score != null && (
                      <div className="glass rounded-2xl p-5 inline-block mb-4 mt-2">
                        <div className="text-4xl font-bold text-green-400">{submission.score}</div>
                        <div className="text-slate-400 text-sm">/ {task.maxScore} ball</div>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2 mt-4">
                      <IntegrityGauge score={submission.integrityScore} size={80} />
                      <p className="text-slate-400 text-sm">Halollik bali</p>
                    </div>
                    <button onClick={() => navigate('/student')} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl transition">
                      Dashboardga qaytish
                    </button>
                  </motion.div>
                </div>
              ) : editorMode === 'text' ? (
                task.type === 'CODE'
                  ? <CodeEditor value={content} onChange={setContent} readOnly={submitted} />
                  : <textarea value={content} onChange={e => setContent(e.target.value)}
                      placeholder='Javobingizni yozing...'
                      className="flex-1 bg-transparent text-white p-6 resize-none focus:outline-none text-sm leading-relaxed placeholder-slate-600"
                    />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  {file ? (
                    <div className="glass rounded-2xl p-8 text-center max-w-sm w-full">
                      <FileText size={48} className="text-indigo-400 mx-auto mb-3" />
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-slate-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={() => setFile(null)} className="mt-4 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mx-auto">
                        <X size={14} /> O'chirish
                      </button>
                    </div>
                  ) : (
                    <label className="glass rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500/50 transition block max-w-sm w-full">
                      <Upload size={48} className="text-slate-500 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">Fayl tanlash</p>
                      <p className="text-slate-400 text-sm">PDF, DOCX, PPTX, ZIP (max 50MB)</p>
                      <input type="file" className="hidden" accept=".pdf,.docx,.pptx,.zip,.png,.jpg,.txt"
                        onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Events panel */}
        <div className="w-52 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-white">Nazorat jurnali</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-red-400">{events.filter(e => e.severity === 'HIGH').length} HIGH</span>
              <span className="text-amber-400">{events.filter(e => e.severity === 'MEDIUM').length} MED</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {events.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-4">Hali harakat yo'q</p>
            ) : events.map((e, i) => (
              <div key={i} className={`text-xs border rounded-lg px-2 py-1.5 ${severityColor[e.severity]}`}>
                <div className="font-medium">{e.type}</div>
                <div className="opacity-60">{e.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;