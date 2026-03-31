import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, ClipboardList, ChevronDown, ChevronUp, FileText, Video, ChevronRight, Calendar } from 'lucide-react';

interface Lecture { id: number; title: string; description: string; content: string; fileUrl: string; videoUrl: string; orderNum: number; }
interface Task { id: number; title: string; type: string; maxScore: number; deadline: string; courseName: string; }
interface Submission { id: number; taskId: number; status: string; score?: number; integrityScore: number; }

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400', EXAM: 'bg-red-500/20 text-red-400',
  CODE: 'bg-green-500/20 text-green-400', QUIZ: 'bg-amber-500/20 text-amber-400',
  ESSAY: 'bg-teal-500/20 text-teal-400', PRESENTATION: 'bg-purple-500/20 text-purple-400',
  FILE: 'bg-slate-500/20 text-slate-400',
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  SUBMITTED: 'bg-blue-500/20 text-blue-400',
  GRADED: 'bg-green-500/20 text-green-400',
};

const CoursePage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courseName, setCourseName] = useState('');
  const [activeTab, setActiveTab] = useState<'lectures' | 'tasks'>('lectures');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseRes, lecturesRes, tasksRes, subsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/lectures/course/${courseId}`),
        api.get(`/tasks/course/${courseId}`),
        api.get('/submissions/my'),
      ]);
      setCourseName(courseRes.data.name);
      setLectures(lecturesRes.data);
      setTasks(tasksRes.data);
      setSubmissions(subsRes.data);
    } finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getSub = (taskId: number) => submissions.find(s => s.taskId === taskId);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Yuklanmoqda...</div></div>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Orqaga
          </button>
          <h1 className="text-2xl font-bold text-white">{courseName}</h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'lectures', label: `Ma'ruzalar (${lectures.length})`, icon: BookOpen },
            { key: 'tasks', label: `Topshiriqlar (${tasks.length})`, icon: ClipboardList },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Lectures */}
        {activeTab === 'lectures' && (
          lectures.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hali ma'ruza yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lectures.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">{i + 1}</div>
                      <div>
                        <h3 className="font-semibold text-white">{l.title}</h3>
                        {l.description && <p className="text-slate-400 text-sm">{l.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.fileUrl && <FileText size={14} className="text-indigo-400" />}
                      {l.videoUrl && <Video size={14} className="text-green-400" />}
                      {expanded === l.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {expanded === l.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-800 px-5 pb-5 pt-4">
                        {l.content && <p className="text-slate-300 text-sm whitespace-pre-wrap mb-4 leading-relaxed">{l.content}</p>}
                        <div className="flex gap-4">
                          {l.fileUrl && (
                            <a href={l.fileUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-3 py-2 rounded-xl text-sm transition">
                              <FileText size={14} /> Faylni ochish
                            </a>
                          )}
                          {l.videoUrl && (
                            <a href={l.videoUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-2 rounded-xl text-sm transition">
                              <Video size={14} /> Videoni ko'rish
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          tasks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hali topshiriq yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => {
                const sub = getSub(task.id);
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/student/task/${task.id}`)}
                    className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                          <ClipboardList size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{task.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                            {sub && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>}
                          </div>
                          {task.deadline && (
                            <span className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                              <Calendar size={11} /> {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {sub?.score != null && <span className="text-green-400 font-bold">{sub.score}/{task.maxScore}</span>}
                        <span className="text-slate-500 text-sm">{task.maxScore} ball</span>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default CoursePage;