import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Shield, Eye, EyeOff, Loader, GraduationCap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(fullName, email, password, role);
      navigate(role === 'TEACHER' ? '/teacher' : '/student');
      toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield size={48} className="text-indigo-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            NoCopy<span className="text-indigo-400">Zone</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            O'zbekiston xalqaro islom akademiyasining akademik halollik platformasi
          </p>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Ro'yxatdan o'tish</h2>
          <p className="text-slate-400 mb-8">Platformaga kirish uchun akkaunt yarating</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'STUDENT', label: 'Talaba', icon: GraduationCap },
              { value: 'TEACHER', label: 'O\'qituvchi', icon: BookOpen },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition font-medium ${
                  role === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To'liq ism</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ism Familiya"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : 'Ro\'yxatdan o\'tish'}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Akkaunt bormi?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Kirish
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;