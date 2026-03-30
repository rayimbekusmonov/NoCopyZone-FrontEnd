import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import IntegrityGauge from '../../components/IntegrityGauge';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, AlertTriangle, Clock } from 'lucide-react';

interface Task {
  id: number; title: string; description: string;
  type: string; courseName: string; deadline: string; maxScore: number;
}
interface Submission {
  id: number; status: string; integrityScore: number; content: string;
}

const TaskPage: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
//   const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const submissionRef = useRef<Submission | null>(null);
  submissionRef.current = submission;

  // Proctoring event yuborish
  const sendEvent = useCallback(async (eventType: string, details: string) => {
    if (!submissionRef.current || submissionRef.current.status === 'SUBMITTED') return;
    try {
      await api.post('/proctor/event', {
        submissionId: submissionRef.current.id,
        eventType, details,
      });
      setEvents(prev => [`${new Date().toLocaleTimeString()} — ${eventType}`, ...prev.slice(0, 9)]);
      setSubmission(prev => prev ? {
        ...prev,
        integrityScore: Math.max(0, prev.integrityScore - (
          ['TAB_SWITCH', 'FOCUS_LOST', 'COPY_PASTE'].includes(eventType) ? 15 :
          ['SUSPICIOUS_TYPING', 'RIGHT_CLICK'].includes(eventType) ? 7 : 2
        ))
      } : null);
    } catch {}
  }, []);

  // Proctoring eventlarini ulash
  useEffect(() => {
    if (!submission || submitted) return;

    // Tab switch
    const handleVisibility = () => {
      if (document.hidden) sendEvent('TAB_SWITCH', 'Talaba boshqa tabga o\'tdi');
    };

    // Focus lost
    const handleBlur = () => sendEvent('FOCUS_LOST', 'Brauzer oynasi fokusdan chiqdi');

    // Copy paste
    const handleCopy = () => sendEvent('COPY_PASTE', 'Matn nusxalandi (Ctrl+C)');
    const handlePaste = () => sendEvent('COPY_PASTE', 'Matn joylandi (Ctrl+V)');

    // Right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendEvent('RIGHT_CLICK', 'O\'ng tugma bosildi');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [submission, submitted, sendEvent]);

  // Deadline timer
  useEffect(() => {
    if (!task?.deadline) return;
    const timer = setInterval(() => {
      const diff = new Date(task.deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Muddat tugadi!'); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [task]);

  useEffect(() => {
    const init = async () => {
      const taskRes = await api.get(`/tasks/${taskId}`);
      setTask(taskRes.data);
      const subRes = await api.post(`/submissions/start/${taskId}`);
      setSubmission(subRes.data);
      setContent(subRes.data.content || '');
      if (subRes.data.status === 'SUBMITTED') setSubmitted(true);
    };
    init();
  }, [taskId]);

  const handleSubmit = async () => {
    if (!submission) return;
    setLoading(true);
    try {
      await api.post(`/submissions/${submission.id}/submit`, content, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setSubmitted(true);
      toast.success('Topshiriq muvaffaqiyatli yuborildi!');
    } catch { toast.error('Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  if (!task || !submission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/student')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-white">{task.title}</h1>
            <p className="text-slate-400 text-sm">{task.courseName} · {task.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {timeLeft && (
            <div className={`flex items-center gap-2 text-sm font-medium ${timeLeft === 'Muddat tugadi!' ? 'text-red-400' : 'text-amber-400'}`}>
              <Clock size={16} />
              {timeLeft}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Halollik:</span>
            <IntegrityGauge score={submission.integrityScore} size={52} />
          </div>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Send size={16} />
              {loading ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {/* Task description */}
          <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-4">
            <p className="text-slate-300 text-sm">{task.description}</p>
          </div>

          {/* Content area */}
          {submitted ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Send size={36} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Topshirildi!</h2>
                <p className="text-slate-400">Topshiriqingiz muvaffaqiyatli qabul qilindi</p>
                <div className="mt-4 flex justify-center">
                  <IntegrityGauge score={submission.integrityScore} size={80} />
                </div>
                <p className="text-slate-400 text-sm mt-2">Yakuniy halollik bali</p>
              </motion.div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Javobingizni shu yerga yozing..."
              className="flex-1 bg-transparent text-white p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed placeholder-slate-600"
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
            />
          )}
        </div>

        {/* Events panel */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-white">Harakatlar tarixi</span>
          </div>
          {events.length === 0 ? (
            <p className="text-slate-500 text-xs">Hali shubhali harakat yo'q</p>
          ) : (
            <div className="space-y-1">
              {events.map((e, i) => (
                <div key={i} className="text-xs text-amber-400/80 bg-amber-500/5 rounded-lg px-2 py-1.5 border border-amber-500/10">
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskPage;