import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Users, BookOpen, Layers, Plus, X, Loader,
  UserPlus, UserMinus, Link2, Unlink, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Group { id: number; name: string; faculty: string; year: number; studentCount: number; courseCount: number; }
interface User { id: number; fullName: string; email: string; role: string; }
interface Course { id: number; name: string; description: string; teacherName: string; }

const AdminDashboard: React.FC = () => {
  useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'courses'>('groups');

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);

  // Form
  const [groupName, setGroupName] = useState('');
  const [groupFaculty, setGroupFaculty] = useState('');
  const [groupYear, setGroupYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const groupsRes = await api.get('/groups');
      setGroups(groupsRes.data);
      console.log('groups OK');
    } catch(e) { console.error('groups XATO', e); }
  
    try {
      const studentsRes = await api.get('/users/students');
      setStudents(studentsRes.data);
      console.log('students OK');
    } catch(e) { console.error('students XATO', e); }
  
    try {
      const coursesRes = await api.get('/courses');
      setCourses(coursesRes.data);
      console.log('courses OK');
    } catch(e) { console.error('courses XATO', e); }
  };

  const fetchGroupStudents = async (groupId: number) => {
    const res = await api.get(`/groups/${groupId}/students`);
    setGroupStudents(res.data);
  };

  const selectGroup = (group: Group) => {
    setSelectedGroup(group);
    fetchGroupStudents(group.id);
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/groups', { name: groupName, faculty: groupFaculty, year: groupYear });
      toast.success('Guruh yaratildi!');
      setShowGroupModal(false);
      setGroupName(''); setGroupFaculty('');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
    finally { setLoading(false); }
  };

  const addStudentToGroup = async (studentId: number) => {
    if (!selectedGroup) return;
    try {
      await api.post(`/groups/${selectedGroup.id}/students/${studentId}`);
      toast.success('Talaba qo\'shildi!');
      fetchGroupStudents(selectedGroup.id);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
  };

  const removeStudentFromGroup = async (studentId: number) => {
    if (!selectedGroup) return;
    try {
      await api.delete(`/groups/${selectedGroup.id}/students/${studentId}`);
      toast.success('Talaba guruhdan chiqarildi');
      fetchGroupStudents(selectedGroup.id);
      fetchAll();
    } catch { toast.error('Xato'); }
  };

  const assignCourseToGroup = async (courseId: number) => {
    if (!selectedGroup) return;
    try {
      await api.post(`/groups/${selectedGroup.id}/courses/${courseId}`);
      toast.success('Kurs biriktirildi! Guruh talabalari endi bu kursni ko\'radi.');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
  };

  const removeCourseFromGroup = async (courseId: number) => {
    if (!selectedGroup) return;
    try {
      await api.delete(`/groups/${selectedGroup.id}/courses/${courseId}`);
      toast.success('Kurs guruhdan olib tashlandi');
      fetchAll();
    } catch { toast.error('Xato'); }
  };

  const groupStudentIds = groupStudents.map(s => s.id);
  const availableStudents = students.filter(s => !groupStudentIds.includes(s.id));

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel 👑</h1>
          <p className="text-slate-400 mt-1">Guruhlar, talabalar va kurslarni boshqaring</p>
        </motion.div>

        {/* Quick links */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition">
            <Users size={16} /> Foydalanuvchilarni boshqarish <ArrowRight size={14} />
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Guruhlar', value: groups.length, icon: Layers, color: 'indigo' },
            { label: 'Talabalar', value: students.length, icon: Users, color: 'green' },
            { label: 'Kurslar', value: courses.length, icon: BookOpen, color: 'amber' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center mb-3`}>
                <s.icon size={20} className={`text-${s.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left: Groups list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Guruhlar</h2>
              <button onClick={() => setShowGroupModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm transition">
                <Plus size={16} /> Guruh yaratish
              </button>
            </div>

            <div className="space-y-3">
              {groups.map((group, i) => (
                <motion.div key={group.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => selectGroup(group)}
                  className={`glass rounded-2xl p-5 cursor-pointer transition ${
                    selectedGroup?.id === group.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'hover:border-slate-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{group.name}</h3>
                      <p className="text-slate-400 text-sm">{group.faculty} · {group.year}-yil</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Users size={14} /> {group.studentCount} talaba
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <BookOpen size={14} /> {group.courseCount} kurs
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {groups.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <Layers size={48} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Hali guruh yo'q. Birinchi guruhni yarating!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Group details */}
          <AnimatePresence>
            {selectedGroup && (
              <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
                className="w-96 space-y-4">
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-lg">{selectedGroup.name}</h3>
                    <button onClick={() => setSelectedGroup(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    {(['students', 'courses'] as const).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {tab === 'students' ? `Talabalar (${groupStudents.length})` : 'Kurslar'}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'students' ? (
                    <>
                      <button onClick={() => setShowAddStudentModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm transition mb-3">
                        <UserPlus size={14} /> Talaba qo'shish
                      </button>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {groupStudents.length === 0 ? (
                          <p className="text-slate-500 text-xs text-center py-4">Guruhda talaba yo'q</p>
                        ) : groupStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5">
                            <div>
                              <div className="text-white text-sm font-medium">{student.fullName}</div>
                              <div className="text-slate-400 text-xs">{student.email}</div>
                            </div>
                            <button onClick={() => removeStudentFromGroup(student.id)} className="text-slate-500 hover:text-red-400 transition">
                              <UserMinus size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShowAssignCourseModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm transition mb-3">
                        <Link2 size={14} /> Kurs biriktirish
                      </button>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {courses.length === 0 ? (
                          <p className="text-slate-500 text-xs text-center py-4">Kurslar yo'q</p>
                        ) : courses.map(course => (
                          <div key={course.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5">
                            <div>
                              <div className="text-white text-sm font-medium">{course.name}</div>
                              <div className="text-slate-400 text-xs">{course.teacherName}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => assignCourseToGroup(course.id)} className="text-green-400 hover:text-green-300 transition" title="Biriktirish">
                                <Link2 size={14} />
                              </button>
                              <button onClick={() => removeCourseFromGroup(course.id)} className="text-slate-500 hover:text-red-400 transition" title="Olib tashlash">
                                <Unlink size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Group Modal */}
        <AnimatePresence>
          {showGroupModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Yangi guruh</h3>
                  <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={createGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Guruh nomi</label>
                    <input value={groupName} onChange={e => setGroupName(e.target.value)} required placeholder="AXB-4, CSB-2..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Fakultet</label>
                    <input value={groupFaculty} onChange={e => setGroupFaculty(e.target.value)} placeholder="Axborot texnologiyalari"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">O'quv yili</label>
                    <input type="number" value={groupYear} onChange={e => setGroupYear(+e.target.value)} min={2020} max={2030}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                    {loading ? <Loader size={18} className="animate-spin" /> : 'Yaratish'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Student Modal */}
        <AnimatePresence>
          {showAddStudentModal && selectedGroup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{selectedGroup.name} — talaba qo'shish</h3>
                  <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableStudents.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Barcha talabalar allaqachon guruhda</p>
                  ) : availableStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                      <div>
                        <div className="text-white font-medium">{student.fullName}</div>
                        <div className="text-slate-400 text-sm">{student.email}</div>
                      </div>
                      <button onClick={() => { addStudentToGroup(student.id); setShowAddStudentModal(false); }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm transition">
                        <UserPlus size={14} /> Qo'shish
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Assign Course Modal */}
        <AnimatePresence>
          {showAssignCourseModal && selectedGroup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{selectedGroup.name} — kurs biriktirish</h3>
                  <button onClick={() => setShowAssignCourseModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <p className="text-slate-400 text-sm mb-4">Kurs biriktirilgandan so'ng guruh talabalari uni avtomatik ko'radi</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {courses.map(course => (
                    <div key={course.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                      <div>
                        <div className="text-white font-medium">{course.name}</div>
                        <div className="text-slate-400 text-sm">{course.teacherName}</div>
                      </div>
                      <button onClick={() => { assignCourseToGroup(course.id); setShowAssignCourseModal(false); }}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm transition">
                        <Link2 size={14} /> Biriktirish
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;