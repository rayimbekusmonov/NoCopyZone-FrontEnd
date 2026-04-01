import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  ClipboardList, Loader, Check,
  AlertTriangle, FileText, Code, User,
  Shield, Star, MessageSquare
} from 'lucide-react';

interface Course { id: number; name: string; }
interface Task { id: number; title: string; type: string; maxScore: number; courseId: number; courseName: string; }
interface Submission {
  id: number; taskId: number; taskTitle: string; studentId: number;
  studentName: string; studentEmail: string; status: string;
  content: string; fileUrl?: string; score?: number;
  integrityScore: number; submittedAt?: string; feedback?: string;
}
interface ProctoringEvent { id: number; eventType: string; severity: string; details: string; loggedAt: string; }

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  SUBMITTED: 'bg-blue-500/20 text-blue-400',
  GRADED: 'bg-green-500/20 text-green-400',
};

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400', CODE: 'bg-green-500/20 text-green-400',
  QUIZ: 'bg-amber-500/20 text-amber-400', ESSAY: 'bg-teal-500/20 text-teal-400',
  PRESENTATION: 'bg-purple-500/20 text-purple-400', FILE: 'bg-slate-500/20 text-slate-400',
};

const Grading: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'GRADED'>('SUBMITTED');

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.get('/courses/my');
      setCourses(res.data);
      const allTasks: Task[] = [];
      for (const course of res.data) {
        const tasksRes = await api.get(`/tasks/course/${course.id}`);
        allTasks.push(...tasksRes.data.map((t: Task) => ({ ...t, courseId: course.id, courseName: course.name })));
      }
      setTasks(allTasks);
    };
    fetchCourses();
  }, []);

  const loadSubmissions = useCallback(async (task: Task) => {
    setSelectedTask(task);
    setSelectedSub(null);
    const res = await api.get(`/submissions/task/${task.id}`);
    setSubmissions(res.data);
  }, []);

  const openSubmission = async (sub: Submission) => {
    setSelectedSub(sub);
    setScore(sub.score?.toString() || '');
    setFeedback(sub.feedback || '');
    const eventsRes = await api.get(`/proctor/submission/${sub.id}`);
    setEvents(eventsRes.data);
  };

  const gradeSubmission = async () => {
    if (!selectedSub || !selectedTask) return;
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > selectedTask.maxScore) {
      toast.error(`Ball 0 dan ${selectedTask.maxScore} gacha bo'lishi kerak`);
      return;
    }
    setGrading(true);
    try {
      await api.post(`/submissions/${selectedSub.id}/grade`, { score: scoreNum, feedback });
      toast.success('Baho qo\'yildi!');
      setSelectedSub(prev => prev ? { ...prev, score: scoreNum, status: 'GRADED', feedback } : null);
      loadSubmissions(selectedTask);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
    finally { setGrading(false); }
  };

  const filtered = submissions.filter(s => filter === 'ALL' ? true : s.status === filter);
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED').length;

  const severityColor: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Tasks list */}
        <div className="w-72 border-r border-slate-800 flex flex-col bg-slate-900/50">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Baholash</h2>
            <p className="text-slate-400 text-xs mt-0.5">Topshiriqni tanlang</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {courses.map(course => {
              const courseTasks = tasks.filter(t => t.courseId === course.id);
              if (courseTasks.length === 0) return null;
              return (
                <div key={course.id}>
                  <div className="text-xs text-slate-500 font-medium px-2 py-2 uppercase tracking-wider">{course.name}</div>
                  {courseTasks.map(task => (
                    <button key={task.id} onClick={() => loadSubmissions(task)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-2 ${
                        selectedTask?.id === task.id ? 'bg-indigo-500/15 text-white border border-indigo-500/20' : 'text-slate-300 hover:bg-slate-800'
                      }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <ClipboardList size={14} className="shrink-0" />
                        <span className="text-sm truncate">{task.title}</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${typeColors[task.type]}`}>{task.type}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">Topshiriqlar yo'q</p>
            )}
          </div>
        </div>

        {/* Middle: Submissions */}
        <div className="w-80 border-r border-slate-800 flex flex-col">
          {selectedTask ? (
            <>
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">{selectedTask.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="text-green-400">{gradedCount} baholangan</span>
                  <span className="text-blue-400">{submittedCount} kutmoqda</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {(['ALL', 'SUBMITTED', 'GRADED'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {f === 'ALL' ? 'Hammasi' : f === 'SUBMITTED' ? 'Kutmoqda' : 'Baholangan'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filtered.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Submission yo'q</p>
                ) : filtered.map(sub => (
                  <motion.button key={sub.id} onClick={() => openSubmission(sub)}
                    className={`w-full text-left p-3 rounded-xl transition border ${
                      selectedSub?.id === sub.id ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white text-sm font-medium truncate">{sub.studentName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className={`${sub.integrityScore >= 80 ? 'text-green-400' : sub.integrityScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {sub.integrityScore}% halollik
                      </span>
                      {sub.score != null && <span className="text-indigo-400">{sub.score}/{selectedTask.maxScore}</span>}
                      {sub.submittedAt && <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Topshiriqni tanlang</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Submission detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSub ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    {selectedSub.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selectedSub.studentName}</div>
                    <div className="text-slate-400 text-sm">{selectedSub.studentEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border ${
                    selectedSub.integrityScore >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    selectedSub.integrityScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    <Shield size={14} /> {selectedSub.integrityScore}%
                  </div>
                  <span className={`text-xs px-2.5 py-1.5 rounded-xl ${statusColors[selectedSub.status]}`}>{selectedSub.status}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Content */}
                {selectedSub.content && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Code size={16} className="text-indigo-400" />
                      <h4 className="font-semibold text-white">Topshirilgan ish</h4>
                    </div>
                    <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedSub.content}
                    </pre>
                  </div>
                )}

                {/* File */}
                {selectedSub.fileUrl && (
                  <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-4">
                    <FileText size={20} className="text-indigo-400" />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">Yuklangan fayl</div>
                    </div>
                    <a href={`http://localhost:8081/api/files/${selectedSub.fileUrl}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-sm transition">
                      Ochish
                    </a>
                  </div>
                )}

                {/* Proctoring events */}
                {events.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <h4 className="font-semibold text-white">Nazorat jurnali ({events.length} ta hodisa)</h4>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {events.map(e => (
                        <div key={e.id} className={`flex items-center justify-between text-xs border rounded-lg px-3 py-2 ${severityColor[e.severity]}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{e.eventType}</span>
                            <span className="opacity-70">{e.details}</span>
                          </div>
                          <span className="opacity-60 shrink-0">{new Date(e.loggedAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grading form */}
                <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-amber-400" />
                    <h4 className="font-semibold text-white">Ball qo'yish</h4>
                    <span className="text-slate-400 text-sm">({selectedTask?.maxScore} balldan)</span>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-300 mb-1.5">Ball</label>
                      <input type="number" value={score} onChange={e => setScore(e.target.value)}
                        min={0} max={selectedTask?.maxScore} placeholder={`0 - ${selectedTask?.maxScore}`}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition text-lg font-bold" />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <div className={`text-4xl font-bold ${
                        score && parseInt(score) >= (selectedTask?.maxScore || 0) * 0.8 ? 'text-green-400' :
                        score && parseInt(score) >= (selectedTask?.maxScore || 0) * 0.6 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {score || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare size={14} /> Izoh (ixtiyoriy)
                    </label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                      placeholder="Talabaga izoh yozing..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition text-sm" />
                  </div>
                  <button onClick={gradeSubmission} disabled={grading || !score}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition">
                    {grading ? <Loader size={18} className="animate-spin" /> : <><Check size={18} /> Baho qo'yish</>}
                  </button>
                  {selectedSub.score != null && (
                    <div className="mt-3 text-center text-sm text-green-400">
                      ✓ Avvalgi ball: {selectedSub.score}/{selectedTask?.maxScore}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Talabani tanlang</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Grading;