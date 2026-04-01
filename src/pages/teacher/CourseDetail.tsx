import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, BookOpen, ClipboardList, Plus, X,
  Loader, Trash2, UserPlus, UserMinus, FileText,
  Link2, Video, ChevronDown, ChevronUp, Eye
} from 'lucide-react';

interface Course { id: number; name: string; description: string; teacherName: string; }
interface Student { id: number; fullName: string; email: string; role: string; }
interface Enrollment { id: number; studentId: number; studentName: string; studentEmail: string; enrolledAt: string; }
interface Task { id: number; title: string; type: string; maxScore: number; deadline: string; }
interface Lecture { id: number; title: string; description: string; content: string; fileUrl: string; videoUrl: string; orderNum: number; }
interface SubmissionStat { submissionId: number; studentName: string; studentEmail: string; integrityScore: number; status: string; score?: number; highRiskEvents: number; }

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400', EXAM: 'bg-red-500/20 text-red-400',
  CODE: 'bg-green-500/20 text-green-400', QUIZ: 'bg-amber-500/20 text-amber-400',
  ESSAY: 'bg-teal-500/20 text-teal-400', PRESENTATION: 'bg-purple-500/20 text-purple-400',
  FILE: 'bg-slate-500/20 text-slate-400',
};

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [activeTab, setActiveTab] = useState<'lectures' | 'tasks' | 'students' | 'monitoring'>('lectures');
  const [loading, setLoading] = useState(true);
  const [allGroups, setAllGroups] = useState<{id: number; name: string; faculty: string; studentCount: number}[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [editLecture, setEditLecture] = useState<Lecture | null>(null);
  const [expandedLecture, setExpandedLecture] = useState<number | null>(null);

  // Monitoring
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionStat[]>([]);

  // Lecture form
  const [lTitle, setLTitle] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lContent, setLContent] = useState('');
  const [lFileUrl, setLFileUrl] = useState('');
  const [lVideoUrl, setLVideoUrl] = useState('');
  const [lLoading, setLLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseRes, enrollRes, tasksRes, lecturesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/enrollments/course/${courseId}/students`),
        api.get(`/tasks/course/${courseId}`),
        api.get(`/lectures/course/${courseId}`),
      ]);
      setCourse(courseRes.data);
      setEnrollments(enrollRes.data);
      setTasks(tasksRes.data);
      setLectures(lecturesRes.data);
    } finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAddStudent = async () => {
    const res = await api.get('/users/students');
    const enrolledEmails = enrollments.map(e => e.studentEmail);
    setAllStudents(res.data.filter((s: Student) => !enrolledEmails.includes(s.email)));
    setShowAddStudentModal(true);
  };

  const openGroupModal = async () => {
    const res = await api.get('/groups');
    setAllGroups(res.data);
    setShowGroupModal(true);
  };

  const enrollGroup = async (groupId: number) => {
    try {
      const res = await api.post(`/enrollments/course/${courseId}/group/${groupId}`);
      toast.success(`${res.data.groupName}: ${res.data.enrolled} talaba qo'shildi, ${res.data.skipped} allaqachon bor edi`);
      setShowGroupModal(false);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
  };

  const addStudent = async (studentId: number) => {
    try {
      await api.post(`/enrollments/course/${courseId}/student/${studentId}`);
      toast.success('Talaba qo\'shildi!');
      setShowAddStudentModal(false);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
  };

  const removeStudent = async (studentId: number) => {
    try {
      await api.delete(`/enrollments/course/${courseId}/student/${studentId}`);
      toast.success('Talaba chiqarildi');
      fetchAll();
    } catch { toast.error('Xato'); }
  };

  const saveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLLoading(true);
    try {
      if (editLecture) {
        await api.put(`/lectures/${editLecture.id}`, { title: lTitle, description: lDesc, content: lContent, fileUrl: lFileUrl, videoUrl: lVideoUrl });
        toast.success('Ma\'ruza yangilandi!');
      } else {
        await api.post(`/lectures/course/${courseId}`, { title: lTitle, description: lDesc, content: lContent, fileUrl: lFileUrl, videoUrl: lVideoUrl, orderNum: lectures.length });
        toast.success('Ma\'ruza qo\'shildi!');
      }
      setShowLectureModal(false);
      resetLectureForm();
      fetchAll();
    } catch { toast.error('Xato'); } finally { setLLoading(false); }
  };

  const deleteLecture = async (id: number) => {
    await api.delete(`/lectures/${id}`);
    toast.success('O\'chirildi');
    fetchAll();
  };

  const openEditLecture = (l: Lecture) => {
    setEditLecture(l);
    setLTitle(l.title); setLDesc(l.description); setLContent(l.content);
    setLFileUrl(l.fileUrl || ''); setLVideoUrl(l.videoUrl || '');
    setShowLectureModal(true);
  };

  const resetLectureForm = () => {
    setEditLecture(null); setLTitle(''); setLDesc('');
    setLContent(''); setLFileUrl(''); setLVideoUrl('');
  };

  const loadSubmissions = async (task: Task) => {
    setSelectedTask(task);
    const res = await api.get(`/proctor/task/${task.id}`);
    setSubmissions(res.data);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Yuklanmoqda...</div></div>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/teacher/courses')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Kurslarga qaytish
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{course?.name}</h1>
              <p className="text-slate-400 mt-1">{course?.description}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Users size={14} /> {enrollments.length} talaba</span>
              <span className="flex items-center gap-1.5"><ClipboardList size={14} /> {tasks.length} topshiriq</span>
              <span className="flex items-center gap-1.5"><BookOpen size={14} /> {lectures.length} ma'ruza</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'lectures', label: `Ma'ruzalar (${lectures.length})`, icon: BookOpen },
            { key: 'tasks', label: `Topshiriqlar (${tasks.length})`, icon: ClipboardList },
            { key: 'students', label: `Talabalar (${enrollments.length})`, icon: Users },
            { key: 'monitoring', label: 'Monitoring', icon: Eye },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ===== LECTURES TAB ===== */}
        {activeTab === 'lectures' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => { resetLectureForm(); setShowLectureModal(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm transition">
                <Plus size={16} /> Ma'ruza qo'shish
              </button>
            </div>
            {lectures.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Hali ma'ruza yo'q. Birinchi ma'ruzani qo'shing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lectures.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-5 cursor-pointer"
                      onClick={() => setExpandedLecture(expandedLecture === l.id ? null : l.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">{i + 1}</div>
                        <div>
                          <h3 className="font-semibold text-white">{l.title}</h3>
                          <p className="text-slate-400 text-sm line-clamp-1">{l.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.fileUrl && <FileText size={14} className="text-indigo-400" />}
                        {l.videoUrl && <Video size={14} className="text-green-400" />}
                        <button onClick={e => { e.stopPropagation(); openEditLecture(l); }} className="text-slate-400 hover:text-white p-1"><FileText size={14} /></button>
                        <button onClick={e => { e.stopPropagation(); deleteLecture(l.id); }} className="text-slate-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                        {expandedLecture === l.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedLecture === l.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-800 px-5 pb-5 pt-4">
                          {l.content && <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">{l.content}</p>}
                          <div className="flex gap-3">
                            {l.fileUrl && (
                              <a href={l.fileUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                                <FileText size={14} /> Faylni ochish
                              </a>
                            )}
                            {l.videoUrl && (
                              <a href={l.videoUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm">
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
            )}
          </div>
        )}

        {/* ===== TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => navigate('/teacher/courses')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm transition">
                <Plus size={16} /> Topshiriq qo'shish
              </button>
            </div>
            {tasks.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Hali topshiriq yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                      <span className="text-white font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {task.deadline && <span>{new Date(task.deadline).toLocaleDateString()}</span>}
                      <span>{task.maxScore} ball</span>
                      <button onClick={() => { loadSubmissions(task); setActiveTab('monitoring'); }}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition">
                        <Eye size={14} /> Ko'rish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== STUDENTS TAB ===== */}
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openAddStudent}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm transition">
                <UserPlus size={16} /> Talaba qo'shish
              </button>
              <button onClick={openGroupModal}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-sm transition">
                <Users size={16} /> Guruh biriktirish
              </button>
            </div>
            {enrollments.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Users size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Hali talaba yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {e.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{e.studentName}</div>
                        <div className="text-slate-400 text-sm">{e.studentEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                      <button onClick={() => removeStudent(e.studentId)}
                        className="text-slate-500 hover:text-red-400 transition p-1">
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MONITORING TAB ===== */}
        {activeTab === 'monitoring' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {tasks.map(task => (
                <button key={task.id} onClick={() => loadSubmissions(task)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${selectedTask?.id === task.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {task.title}
                </button>
              ))}
            </div>
            {!selectedTask ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Eye size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Topshiriq tanlang</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-slate-400">Hali submission yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map(s => (
                  <div key={s.submissionId} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                        {s.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{s.studentName}</div>
                        <div className="text-slate-400 text-sm">{s.studentEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-xs px-2 py-1 rounded-lg ${s.integrityScore >= 80 ? 'bg-green-500/20 text-green-400' : s.integrityScore >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.integrityScore}% halollik
                      </div>
                      {s.highRiskEvents > 0 && <span className="text-xs text-red-400">{s.highRiskEvents} qoidabuzarlik</span>}
                      {s.score != null ? (
                        <span className="text-green-400 font-bold">{s.score}/{selectedTask.maxScore}</span>
                      ) : (
                        <span className="text-slate-500 text-xs">{s.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lecture Modal */}
        <AnimatePresence>
          {showLectureModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editLecture ? 'Ma\'ruzani tahrirlash' : 'Yangi ma\'ruza'}</h3>
                  <button onClick={() => { setShowLectureModal(false); resetLectureForm(); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={saveLecture} className="space-y-4">
                  <input value={lTitle} onChange={e => setLTitle(e.target.value)} required placeholder="Ma'ruza nomi"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <textarea value={lDesc} onChange={e => setLDesc(e.target.value)} placeholder="Qisqa tavsif" rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none" />
                  <textarea value={lContent} onChange={e => setLContent(e.target.value)} placeholder="Ma'ruza matni (ixtiyoriy)" rows={5}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none" />
                  <div className="flex items-center gap-3">
                    <Link2 size={16} className="text-indigo-400 shrink-0" />
                    <input value={lFileUrl} onChange={e => setLFileUrl(e.target.value)} placeholder="Fayl URL (PDF, DOCX...)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Video size={16} className="text-green-400 shrink-0" />
                    <input value={lVideoUrl} onChange={e => setLVideoUrl(e.target.value)} placeholder="Video URL (YouTube, Drive...)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <button type="submit" disabled={lLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                    {lLoading ? <Loader size={18} className="animate-spin" /> : editLecture ? 'Saqlash' : 'Qo\'shish'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Student Modal */}
        <AnimatePresence>
          {showAddStudentModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Talaba qo'shish</h3>
                  <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {allStudents.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Qo'shish mumkin bo'lgan talaba yo'q</p>
                  ) : allStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
                      <div>
                        <div className="text-white font-medium">{student.fullName}</div>
                        <div className="text-slate-400 text-sm">{student.email}</div>
                      </div>
                      <button onClick={() => addStudent(student.id)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-sm transition">
                        <UserPlus size={14} /> Qo'shish
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showGroupModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Guruh biriktirish</h3>
                  <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <p className="text-slate-400 text-sm mb-4">Guruhni tanlang — barcha talabalar avtomatik qo'shiladi</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {allGroups.map(group => (
                    <div key={group.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                      <div>
                        <div className="text-white font-medium">{group.name}</div>
                        <div className="text-slate-400 text-sm">{group.faculty} · {group.studentCount} talaba</div>
                      </div>
                      <button onClick={() => enrollGroup(group.id)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-sm transition">
                        <Users size={14} /> Biriktirish
                      </button>
                    </div>
                  ))}
                  {allGroups.length === 0 && <p className="text-slate-400 text-center py-8">Guruhlar yo'q</p>}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CourseDetail;