import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import IntegrityGauge from '../../components/IntegrityGauge';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, AlertTriangle, Clock,
  Upload, FileText, X, Code, AlignLeft,
  Maximize, ShieldAlert, Eye
} from 'lucide-react';

interface Task {
  id: number; title: string; description: string;
  type: string; courseName: string; deadline: string; maxScore: number;
}
interface Submission {
  id: number; status: string; integrityScore: number;
  content: string; fileUrl?: string; score?: number;
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

  const submissionRef = useRef<Submission | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  submissionRef.current = submission;

  // ===== FULLSCREEN =====
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current || document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !submitted && submissionRef.current) {
        showWarningAlert('Fullscreen rejimdan chiqdingiz! Qaytib kiring.', 'HIGH');
        sendProctoringEvent('FOCUS_LOST', 'Talaba fullscreen rejimdan chiqdi');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [submitted]);

  // ===== PROCTORING EVENTS =====
  const sendProctoringEvent = useCallback(async (eventType: string, details: string) => {
    if (!submissionRef.current || submissionRef.current.status === 'SUBMITTED') return;
    try {
      await api.post('/proctor/event', {
        submissionId: submissionRef.current.id,
        eventType, details,
      });
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
    if (severity === 'HIGH') {
      setTabSwitchCount(prev => {
        const next = prev + 1;
        if (next >= 5) toast.error('⚠️ Ko\'p marta qoidabuzarlik aniqlandi!', { autoClose: false });
        return next;
      });
    }
  }, []);

  // ===== EVENT LISTENERS =====
  useEffect(() => {
    if (!submission || submitted) return;

    // Tab switch
    const handleVisibility = () => {
      if (document.hidden) {
        sendProctoringEvent('TAB_SWITCH', 'Talaba boshqa tabga o\'tdi');
        showWarningAlert('⚠️ Boshqa tabga o\'tish aniqlandi!', 'HIGH');
      }
    };

    // Window blur
    const handleBlur = () => {
      sendProctoringEvent('FOCUS_LOST', 'Brauzer fokusdan chiqdi');
      showWarningAlert('⚠️ Brauzer oynasi minimallashtirildi!', 'HIGH');
    };

    // Copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      sendProctoringEvent('COPY_PASTE', 'Nusxalash (Ctrl+C) bloklandi');
      showWarningAlert('🚫 Nusxalash bloklangan!', 'HIGH');
    };

    // Paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      sendProctoringEvent('COPY_PASTE', 'Joylashtirish (Ctrl+V) bloklandi');
      showWarningAlert('🚫 Joylashtirish bloklangan!', 'HIGH');
    };

    // Right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendProctoringEvent('RIGHT_CLICK', 'O\'ng tugma bosildi');
      showWarningAlert('🚫 O\'ng tugma bloklangan!', 'MEDIUM');
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        sendProctoringEvent('DEVTOOLS', 'DevTools ochishga urinish');
        showWarningAlert('🚫 DevTools bloklangan!', 'HIGH');
      }
      // Ctrl+U (source view)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
      // Alt+Tab — detect
      if (e.altKey && e.key === 'Tab') {
        sendProctoringEvent('TAB_SWITCH', 'Alt+Tab bosildi');
        showWarningAlert('⚠️ Alt+Tab aniqlandi!', 'HIGH');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy as EventListener);
    document.addEventListener('paste', handlePaste as EventListener);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy as EventListener);
      document.removeEventListener('paste', handlePaste as EventListener);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [submission, submitted, sendProctoringEvent, showWarningAlert]);

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
      } catch (err) {
        toast.error('Topshiriq yuklanmadi');
        navigate('/student');
      }
    };
    init();
  }, [taskId, navigate]);

  // ===== SUBMIT =====
  const handleTextSubmit = async () => {
    if (!submission) return;
    setLoading(true);
    try {
      await api.post(`/submissions/${submission.id}/submit`, content, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setSubmitted(true);
      exitFullscreen();
      toast.success('Topshiriq muvaffaqiyatli yuborildi!');
    } catch { toast.error('Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async () => {
    if (!file || !submission) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/files/upload/${submission.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
      exitFullscreen();
      toast.success('Fayl muvaffaqiyatli yuklandi!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Yuklashda xato');
    } finally { setUploading(false); }
  };

  const severityColor: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  if (!task || !submission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 flex flex-col select-none">

      {/* Warning overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-500 text-red-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium"
          >
            <ShieldAlert size={20} className="text-red-400" />
            {warningMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirm modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert size={24} className="text-red-400" />
                <h3 className="text-lg font-bold text-white">Chiqishni tasdiqlang</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Topshiriq bajarish jarayonida chiqib ketmoqchimisiz? Bu shubhali harakat sifatida qayd etiladi.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition">
                  Qolish
                </button>
                <button onClick={() => { exitFullscreen(); navigate('/student'); }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl transition">
                  Chiqish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-white text-sm">{task.title}</h1>
            <p className="text-slate-400 text-xs">{task.courseName} · {task.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {timeLeft && (
            <div className={`flex items-center gap-2 text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${
              timeLeft === 'Muddat tugadi!' ? 'bg-red-500/20 text-red-400' :
              timeLeft.startsWith('0:') ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-white'
            }`}>
              <Clock size={14} /> {timeLeft}
            </div>
          )}

          {/* Tab switch counter */}
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-500/30">
              <Eye size={12} /> {tabSwitchCount} qoidabuzarlik
            </div>
          )}

          {/* Integrity gauge */}
          <IntegrityGauge score={submission.integrityScore} size={48} />

          {/* Fullscreen button */}
          {!submitted && (
            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                isFullscreen ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
              }`}
            >
              <Maximize size={14} />
              {isFullscreen ? 'Fullscreen' : 'Fullscreen kirish'}
            </button>
          )}

          {/* Submit button */}
          {!submitted && (
            <button
              onClick={editorMode === 'text' ? handleTextSubmit : handleFileUpload}
              disabled={loading || uploading || (editorMode === 'text' ? !content.trim() : !file)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Send size={14} />
              {loading || uploading ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Task description */}
          <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 shrink-0">
            <p className="text-slate-300 text-sm leading-relaxed">{task.description}</p>
          </div>

          {/* Editor mode tabs */}
          {!submitted && (
            <div className="flex gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/30 shrink-0">
              <button onClick={() => setEditorMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                  editorMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                {task.type === 'CODE' ? <Code size={12} /> : <AlignLeft size={12} />}
                {task.type === 'CODE' ? 'Kod yozish' : 'Matn yozish'}
              </button>
              <button onClick={() => setEditorMode('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                  editorMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <Upload size={12} /> Fayl yuklash
              </button>
            </div>
          )}

          {/* Content */}
          {submitted ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <Send size={32} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Topshirildi!</h2>
                <p className="text-slate-400 mb-6">Topshiriqingiz muvaffaqiyatli qabul qilindi</p>
                {submission.score != null ? (
                  <div className="glass rounded-2xl p-5 inline-block mb-4">
                    <div className="text-4xl font-bold text-green-400">{submission.score}</div>
                    <div className="text-slate-400 text-sm">/ {task.maxScore} ball</div>
                  </div>
                ) : null}
                <div className="flex flex-col items-center gap-2">
                  <IntegrityGauge score={submission.integrityScore} size={80} />
                  <p className="text-slate-400 text-sm">Yakuniy halollik bali</p>
                </div>
                <button onClick={() => navigate('/student')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl transition">
                  Dashboardga qaytish
                </button>
              </motion.div>
            </div>
          ) : editorMode === 'text' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={task.type === 'CODE'
                ? '// Kodingizni shu yerga yozing...'
                : 'Javobingizni shu yerga yozing...'}
              className="flex-1 bg-transparent text-white p-6 resize-none focus:outline-none text-sm leading-relaxed placeholder-slate-600"
              style={{
                fontFamily: task.type === 'CODE'
                  ? "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
                  : 'inherit',
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (task.type === 'CODE' && e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const newVal = content.substring(0, start) + '  ' + content.substring(end);
                  setContent(newVal);
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  }, 0);
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              {file ? (
                <div className="glass rounded-2xl p-8 text-center max-w-sm w-full">
                  <FileText size={48} className="text-indigo-400 mx-auto mb-3" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={() => setFile(null)}
                    className="mt-4 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mx-auto transition">
                    <X size={14} /> Faylni olib tashlash
                  </button>
                </div>
              ) : (
                <label className="glass rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500/50 transition block max-w-sm w-full">
                  <Upload size={48} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">Fayl tanlash</p>
                  <p className="text-slate-400 text-sm">PDF, DOCX, PPTX, ZIP (max 50MB)</p>
                  <input type="file" className="hidden"
                    accept=".pdf,.docx,.pptx,.zip,.png,.jpg,.txt"
                    onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Events panel */}
        <div className="w-56 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-white">Nazorat jurnali</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-red-400">{events.filter(e => e.severity === 'HIGH').length} HIGH</span>
              <span className="text-amber-400">{events.filter(e => e.severity === 'MEDIUM').length} MED</span>
              <span className="text-slate-400">{events.filter(e => e.severity === 'LOW').length} LOW</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {events.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-4">Hali harakat yo'q</p>
            ) : (
              events.map((e, i) => (
                <div key={i} className={`text-xs border rounded-lg px-2 py-1.5 ${severityColor[e.severity]}`}>
                  <div className="font-medium">{e.type}</div>
                  <div className="opacity-60">{e.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;