import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Shield, AlertTriangle, Eye, Users,
  RefreshCw, CheckCircle2, ChevronDown,
  ChevronUp, Loader, Star, MessageSquare
} from 'lucide-react';

interface Task { id: number; title: string; type: string; maxScore: number; }
interface SubmissionStat {
  submissionId: number;
  studentName: string;
  studentEmail: string;
  status: string;
  integrityScore: number;
  score?: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
}
interface ProctoringEvent {
  id: number;
  eventType: string;
  severity: string;
  details: string;
  loggedAt: string;
}

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  GRADED: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'Ishlayapti',
  SUBMITTED: 'Topshirdi',
  GRADED: 'Baholandi',
};

const severityColor: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const Monitoring: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionStat[]>([]);
  const [selectedSub, setSelectedSub] = useState<SubmissionStat | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [setExpandedStudent] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Grading
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [showGradePanel, setShowGradePanel] = useState(false);

  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Tasks yuklash
  useEffect(() => {
    const fetchTasks = async () => {
      if (!courseId) return;
      const res = await api.get(`/tasks/course/${courseId}`);
      setTasks(res.data);
    };
    fetchTasks();
  }, [courseId]);

  // Submissionlar yuklash
  const loadSubmissions = useCallback(async (task: Task) => {
    setLoading(true);
    setSelectedTask(task);
    setSelectedSub(null);
    setExpandedStudent(null);
    try {
      const res = await api.get(`/proctor/task/${task.id}`);
      setSubmissions(res.data);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && selectedTask) {
      autoRefreshRef.current = setInterval(() => {
        loadSubmissions(selectedTask);
      }, 5000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh, selectedTask, loadSubmissions]);

  // Student events yuklash
  const loadEvents = async (sub: SubmissionStat) => {
    setSelectedSub(sub);
    setGradeScore(sub.score?.toString() || '');
    setGradeFeedback('');
    setShowGradePanel(false);
    const res = await api.get(`/proctor/submission/${sub.submissionId}`);
    setEvents(res.data);
  };

  // Ball qo'yish
  const gradeSubmission = async () => {
    if (!selectedSub || !selectedTask) return;
    const scoreNum = parseInt(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > selectedTask.maxScore) {
      toast.error(`Ball 0 dan ${selectedTask.maxScore} gacha bo'lishi kerak`);
      return;
    }
    setGrading(true);
    try {
      await api.post(`/submissions/${selectedSub.submissionId}/grade`, {
        score: scoreNum, feedback: gradeFeedback
      });
      toast.success('Baho qo\'yildi!');
      setShowGradePanel(false);
      setSubmissions(prev => prev.map(s =>
        s.submissionId === selectedSub.submissionId ? { ...s, score: scoreNum, status: 'GRADED' } : s
      ));
      setSelectedSub(prev => prev ? { ...prev, score: scoreNum, status: 'GRADED' } : null);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
    finally { setGrading(false); }
  };

  const filtered = submissions.filter(s => filterStatus === 'ALL' ? true : s.status === filterStatus);
  const inProgressCount = submissions.filter(s => s.status === 'IN_PROGRESS').length;
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED').length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const suspiciousCount = submissions.filter(s => s.highRiskEvents > 0).length;

  const getIntegrityColor = (score: number) =>
    score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  const getIntegrityBg = (score: number) =>
    score >= 80 ? 'bg-green-500/20 border-green-500/30' : score >= 50 ? 'bg-amber-500/20 border-amber-500/30' : 'bg-red-500/20 border-red-500/30';

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(`/teacher/courses/${courseId}`)}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Real-time Monitoring</h1>
                <p className="text-slate-400 text-sm">Talabalar faoliyatini kuzating</p>
              </div>
            </div>

            {selectedTask && (
              <div className="flex items-center gap-3">
                {/* Auto-refresh toggle */}
                <button onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition border ${
                    autoRefresh
                      ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}>
                  <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
                  {autoRefresh ? 'Live (5s)' : 'Auto-refresh'}
                </button>

                {/* Manual refresh */}
                <button onClick={() => loadSubmissions(selectedTask)} disabled={loading}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-sm transition">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Yangilash
                </button>

                {lastRefresh && (
                  <span className="text-slate-500 text-xs">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Task selector */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {tasks.map(task => (
              <button key={task.id} onClick={() => loadSubmissions(task)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  selectedTask?.id === task.id
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-white'
                }`}>
                {task.title}
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  task.type === 'QUIZ' ? 'bg-amber-500/20 text-amber-400' :
                  task.type === 'CODE' ? 'bg-green-500/20 text-green-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{task.type}</span>
              </button>
            ))}
            {tasks.length === 0 && (
              <p className="text-slate-500 text-sm">Topshiriqlar yo'q</p>
            )}
          </div>
        </div>

        {!selectedTask ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Eye size={56} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">Topshiriqni tanlang</p>
              <p className="text-slate-500 text-sm mt-1">Monitoring uchun yuqoridan topshiriq tanlang</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* Left: Submissions list */}
            <div className="flex flex-col w-96 border-r border-slate-800 overflow-hidden">

              {/* Stats bar */}
              <div className="p-4 border-b border-slate-800 grid grid-cols-4 gap-2">
                {[
                  { label: 'Ishlayapti', value: inProgressCount, color: 'amber' },
                  { label: 'Topshirdi', value: submittedCount, color: 'blue' },
                  { label: 'Baholandi', value: gradedCount, color: 'green' },
                  { label: 'Shubhali', value: suspiciousCount, color: 'red' },
                ].map(s => (
                  <div key={s.label} className={`text-center p-2 rounded-xl bg-${s.color}-500/10`}>
                    <div className={`text-xl font-bold text-${s.color}-400`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="flex gap-1 p-3 border-b border-slate-800">
                {['ALL', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'].map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterStatus === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>
                    {f === 'ALL' ? 'Barchasi' : f === 'IN_PROGRESS' ? 'Jarayon' : f === 'SUBMITTED' ? 'Topshirdi' : 'Baholandi'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader size={24} className="text-indigo-400 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    {submissions.length === 0 ? 'Hali hech kim boshlamadi' : 'Natija yo\'q'}
                  </div>
                ) : filtered.map(sub => (
                  <motion.div key={sub.submissionId} layout
                    onClick={() => loadEvents(sub)}
                    className={`rounded-2xl p-4 cursor-pointer transition border ${
                      selectedSub?.submissionId === sub.submissionId
                        ? 'border-indigo-500/40 bg-indigo-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                          {sub.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{sub.studentName}</div>
                          <div className="text-slate-500 text-xs">{sub.studentEmail}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg border ${statusColors[sub.status]}`}>
                        {statusLabels[sub.status]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 font-medium ${getIntegrityColor(sub.integrityScore)}`}>
                          <Shield size={11} /> {sub.integrityScore}%
                        </span>
                        {sub.highRiskEvents > 0 && (
                          <span className="flex items-center gap-1 text-red-400">
                            <AlertTriangle size={11} /> {sub.highRiskEvents}
                          </span>
                        )}
                      </div>
                      {sub.score != null && (
                        <span className="text-green-400 font-bold">{sub.score}/{selectedTask.maxScore}</span>
                      )}
                    </div>

                    {/* Progress bar - integrity */}
                    <div className="mt-2 w-full bg-slate-800 rounded-full h-1">
                      <div className={`h-1 rounded-full transition-all ${
                        sub.integrityScore >= 80 ? 'bg-green-500' :
                        sub.integrityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`} style={{ width: `${sub.integrityScore}%` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Student detail */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedSub ? (
                <>
                  {/* Student header */}
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                        {selectedSub.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{selectedSub.studentName}</div>
                        <div className="text-slate-400 text-sm">{selectedSub.studentEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${getIntegrityBg(selectedSub.integrityScore)}`}>
                        <Shield size={16} className={getIntegrityColor(selectedSub.integrityScore)} />
                        <span className={getIntegrityColor(selectedSub.integrityScore)}>{selectedSub.integrityScore}%</span>
                      </div>
                      <span className={`px-3 py-2 rounded-xl border text-sm ${statusColors[selectedSub.status]}`}>
                        {statusLabels[selectedSub.status]}
                      </span>
                      {selectedSub.score != null && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{selectedSub.score}</div>
                          <div className="text-slate-500 text-xs">/ {selectedTask.maxScore}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Risk summary */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'HIGH risk', value: selectedSub.highRiskEvents, color: 'red', desc: 'Tab, fokus, copy' },
                        { label: 'MEDIUM risk', value: selectedSub.mediumRiskEvents, color: 'amber', desc: 'O\'ng tugma va b.' },
                        { label: 'Halollik', value: `${selectedSub.integrityScore}%`, color: selectedSub.integrityScore >= 80 ? 'green' : selectedSub.integrityScore >= 50 ? 'amber' : 'red', desc: 'Umumiy baho' },
                      ].map(s => (
                        <div key={s.label} className={`glass rounded-2xl p-4 text-center border-${s.color}-500/20`}>
                          <div className={`text-2xl font-bold text-${s.color}-400 mb-1`}>{s.value}</div>
                          <div className="text-white text-sm font-medium">{s.label}</div>
                          <div className="text-slate-500 text-xs">{s.desc}</div>
                        </div>
                      ))}
                    </div>

                    {/* Grade panel */}
                    {(selectedSub.status === 'SUBMITTED' || selectedSub.status === 'GRADED') && (
                      <div className="glass rounded-2xl overflow-hidden">
                        <button onClick={() => setShowGradePanel(!showGradePanel)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-amber-400" />
                            <span className="font-semibold text-white">Ball qo'yish</span>
                            {selectedSub.score != null && (
                              <span className="text-green-400 text-sm ml-2">(hozir: {selectedSub.score}/{selectedTask.maxScore})</span>
                            )}
                          </div>
                          {showGradePanel ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                        <AnimatePresence>
                          {showGradePanel && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-800 p-5 space-y-4">
                              <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                  <label className="text-sm text-slate-300 mb-1.5 block">Ball (0 — {selectedTask.maxScore})</label>
                                  <input type="number" value={gradeScore} onChange={e => setGradeScore(e.target.value)}
                                    min={0} max={selectedTask.maxScore}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-indigo-500 transition" />
                                </div>
                                <div className={`text-4xl font-bold pb-1 ${
                                  gradeScore && parseInt(gradeScore) >= selectedTask.maxScore * 0.8 ? 'text-green-400' :
                                  gradeScore && parseInt(gradeScore) >= selectedTask.maxScore * 0.6 ? 'text-amber-400' : 'text-red-400'
                                }`}>{gradeScore || '—'}</div>
                              </div>
                              <div>
                                <label className="text-sm text-slate-300 mb-1.5 block flex items-center gap-1.5">
                                  <MessageSquare size={14} /> Izoh
                                </label>
                                <textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} rows={2}
                                  placeholder="Talabaga izoh..."
                                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm transition" />
                              </div>
                              <button onClick={gradeSubmission} disabled={grading || !gradeScore}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition">
                                {grading ? <Loader size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Baho qo'yish</>}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Events log */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-amber-400" />
                        <h4 className="font-semibold text-white">Nazorat jurnali</h4>
                        <span className="text-slate-400 text-sm">({events.length} ta hodisa)</span>
                      </div>
                      {events.length === 0 ? (
                        <div className="glass rounded-2xl p-8 text-center">
                          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Hech qanday qoidabuzarlik yo'q</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {events.map(e => (
                            <div key={e.id} className={`flex items-center justify-between text-xs border rounded-xl px-4 py-3 ${severityColor[e.severity]}`}>
                              <div className="flex items-center gap-3">
                                <span className={`font-bold px-2 py-0.5 rounded ${
                                  e.severity === 'HIGH' ? 'bg-red-500/20' :
                                  e.severity === 'MEDIUM' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                                }`}>{e.severity}</span>
                                <span className="font-medium">{e.eventType}</span>
                                <span className="opacity-60">{e.details}</span>
                              </div>
                              <span className="opacity-50 shrink-0 ml-4">
                                {new Date(e.loggedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Users size={56} className="text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg font-medium">Talabani tanlang</p>
                    <p className="text-slate-500 text-sm mt-1">Chap tomondagi ro'yxatdan talabani bosing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Monitoring;