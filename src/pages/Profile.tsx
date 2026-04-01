import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Shield, Loader, Check } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabels: Record<string, string> = {
    ROLE_ADMIN: 'Administrator', ROLE_TEACHER: 'O\'qituvchi', ROLE_STUDENT: 'Talaba',
  };
  const roleColors: Record<string, string> = {
    ROLE_ADMIN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ROLE_TEACHER: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    ROLE_STUDENT: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Parollar mos kelmadi!'); return; }
    if (newPassword.length < 6) { toast.error('Parol kamida 6 ta belgi bo\'lishi kerak'); return; }
    setLoading(true);
    try {
      await api.post('/users/change-password', { oldPassword, newPassword });
      toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xato yuz berdi');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profil</h1>
          <p className="text-slate-400 mt-1">Shaxsiy ma'lumotlaringiz</p>
        </motion.div>

        <div className="max-w-2xl space-y-6">
          {/* User info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-3xl font-bold text-indigo-400">{user?.fullName?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-slate-400">{user?.email}</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full border ${roleColors[user?.role || ''] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                    {roleLabels[user?.role || ''] || user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-slate-400" />
                  <span className="text-slate-400 text-sm">To'liq ism</span>
                </div>
                <p className="text-white font-medium">{user?.fullName}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-slate-400" />
                  <span className="text-slate-400 text-sm">Rol</span>
                </div>
                <p className="text-white font-medium">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
            </div>
          </motion.div>

          {/* Change password */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Lock size={18} className="text-indigo-400" /> Parolni o'zgartirish
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Joriy parol</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Yangi parol</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  placeholder="Kamida 6 ta belgi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Parolni tasdiqlang</label>
                <div className="relative">
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="••••••••"
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition pr-10 ${
                      confirmPassword && newPassword === confirmPassword ? 'border-green-500' : 'border-slate-700 focus:border-indigo-500'
                    }`} />
                  {confirmPassword && newPassword === confirmPassword && (
                    <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                {loading ? <Loader size={18} className="animate-spin" /> : 'Parolni o\'zgartirish'}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;