import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Loader, Shield, ShieldOff, Key, Trash2, RefreshCw } from 'lucide-react';

interface UserDetail {
  id: number; fullName: string; email: string; role: string;
  active: boolean; blocked: boolean; blockedReason: string; createdAt: string;
}

const roleColors: Record<string, string> = {
  ROLE_ADMIN: 'bg-amber-500/20 text-amber-400',
  ROLE_TEACHER: 'bg-indigo-500/20 text-indigo-400',
  ROLE_STUDENT: 'bg-green-500/20 text-green-400',
};

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: 'Admin', ROLE_TEACHER: 'Ustoz', ROLE_STUDENT: 'Talaba',
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState<UserDetail | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post('/admin/users', { fullName, email, password, role });
      toast.success('Foydalanuvchi yaratildi!');
      setShowCreateModal(false);
      setFullName(''); setEmail(''); setPassword(''); setRole('STUDENT');
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Xato'); }
    finally { setCreateLoading(false); }
  };

  const blockUser = async () => {
    if (!showBlockModal) return;
    try {
      await api.post(`/admin/users/${showBlockModal.id}/block`, { reason: blockReason });
      toast.success('Foydalanuvchi bloklandi');
      setShowBlockModal(null); setBlockReason('');
      fetchUsers();
    } catch { toast.error('Xato'); }
  };

  const unblockUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/unblock`);
      toast.success('Blok olib tashlandi');
      fetchUsers();
    } catch { toast.error('Xato'); }
  };

  const changeRole = async (userId: number, newRole: string) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Rol o\'zgartirildi');
      fetchUsers();
    } catch { toast.error('Xato'); }
  };

  const resetPassword = async (userId: number) => {
    const newPass = prompt('Yangi parolni kiriting:');
    if (!newPass) return;
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { password: newPass });
      toast.success('Parol tiklandi');
    } catch { toast.error('Xato'); }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Foydalanuvchini o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('O\'chirildi');
      fetchUsers();
    } catch { toast.error('Xato'); }
  };

  const filtered = filter === 'ALL' ? users : users.filter(u => u.role === `ROLE_${filter}`);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Foydalanuvchilar</h1>
            <p className="text-slate-400 mt-1">Jami: {users.length} ta</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchUsers} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"><RefreshCw size={18} /></button>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition">
              <Plus size={18} /> Foydalanuvchi qo'shish
            </button>
          </div>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'ALL', label: `Hammasi (${users.length})` },
            { key: 'STUDENT', label: `Talabalar (${users.filter(u => u.role === 'ROLE_STUDENT').length})` },
            { key: 'TEACHER', label: `Ustozlar (${users.filter(u => u.role === 'ROLE_TEACHER').length})` },
            { key: 'ADMIN', label: `Adminlar (${users.filter(u => u.role === 'ROLE_ADMIN').length})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`glass rounded-2xl p-4 flex items-center justify-between ${user.blocked ? 'border-red-500/30 opacity-70' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.blocked ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{user.fullName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
                      {user.blocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Bloklangan</span>}
                    </div>
                    <div className="text-slate-400 text-sm">{user.email}</div>
                    {user.blockedReason && <div className="text-red-400 text-xs mt-0.5">Sabab: {user.blockedReason}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Role change */}
                  <select onChange={e => changeRole(user.id, e.target.value)} value={user.role.replace('ROLE_', '')}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none">
                    <option value="STUDENT">Talaba</option>
                    <option value="TEACHER">Ustoz</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button onClick={() => resetPassword(user.id)} title="Parol tiklash"
                    className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition">
                    <Key size={14} />
                  </button>
                  {user.blocked ? (
                    <button onClick={() => unblockUser(user.id)} title="Blokdan chiqarish"
                      className="text-slate-400 hover:text-green-400 p-1.5 rounded-lg hover:bg-green-500/10 transition">
                      <ShieldOff size={14} />
                    </button>
                  ) : (
                    <button onClick={() => setShowBlockModal(user)} title="Bloklash"
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition">
                      <Shield size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteUser(user.id)} title="O'chirish"
                    className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Yangi foydalanuvchi</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={createUser} className="space-y-4">
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="To'liq ism"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Parol"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
                    <option value="STUDENT">Talaba</option>
                    <option value="TEACHER">Ustoz</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit" disabled={createLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                    {createLoading ? <Loader size={18} className="animate-spin" /> : 'Yaratish'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Block Modal */}
        <AnimatePresence>
          {showBlockModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-2">Bloklash</h3>
                <p className="text-slate-400 text-sm mb-4">{showBlockModal.fullName} — {showBlockModal.email}</p>
                <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={3}
                  placeholder="Bloklash sababi (ixtiyoriy)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none transition mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => setShowBlockModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition">Bekor</button>
                  <button onClick={blockUser} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl transition">Bloklash</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminUsers;