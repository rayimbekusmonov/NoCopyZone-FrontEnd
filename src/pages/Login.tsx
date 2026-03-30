import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Shield, Eye, EyeOff, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'ROLE_TEACHER' ? '/teacher' : '/student');
      toast.success('Xush kelibsiz!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login xatosi');
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
          <p className="text-slate-400 text-xl leading-relaxed max-w-md">
            Academic Integrity Starts Here
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Talabalar', value: '1,200+' },
              { label: 'Fanlar', value: '48' },
              { label: 'Aniqlik', value: '99%' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
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
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Shield size={32} className="text-indigo-400" />
            <span className="text-2xl font-bold text-white">NoCopyZone</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Kirish</h2>
          <p className="text-slate-400 mb-8">Platformaga kirish uchun ma'lumotlaringizni kiriting</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : 'Kirish'}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Akkaunt yo'qmi?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;