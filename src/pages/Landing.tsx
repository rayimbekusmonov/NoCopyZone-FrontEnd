import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Eye, Lock, Code, BookOpen, Users,
  ChevronRight, CheckCircle2, Zap, BarChart2,
  GraduationCap, Star
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Eye,
      title: 'Real-time Monitoring',
      desc: 'Talaba topshiriq ishlayotganda har bir harakati kuzatiladi. Tab almashtirish, fokus yo\'qotish, copy-paste — hammasi qayd etiladi.',
      color: 'indigo',
    },
    {
      icon: Lock,
      title: 'Anti-Cheat Tizimi',
      desc: 'Fullscreen rejimi, klaviatura bloklash, DevTools oldini olish. 3-tool orqali topshiriq bajarishning iloji yo\'q.',
      color: 'red',
    },
    {
      icon: Code,
      title: 'Monaco Editor',
      desc: 'VS Code kabi brauzer ichida kod yozish. Java, Python, C++, JavaScript va boshqa 8 ta til. Kod to\'g\'ridan-to\'g\'ri compile qilinadi.',
      color: 'green',
    },
    {
      icon: BarChart2,
      title: 'Halollik Bali',
      desc: 'Har bir talabaga 100 balldan boshlanuvchi halollik indeksi. Qoidabuzarlik bo\'lsa avtomatik ayriladi. Ustoz buni ko\'radi.',
      color: 'amber',
    },
    {
      icon: BookOpen,
      title: 'Ma\'ruza Materiallari',
      desc: 'Ustoz matn, PDF va video materiallarini kurs ichida joylaydi. Talabalar bir joydan hamma narsani ko\'radi.',
      color: 'blue',
    },
    {
      icon: Users,
      title: 'Guruh Tizimi',
      desc: 'Admin guruh yaratadi, talabalarni biriktiradi. Ustoz butun guruhni bir tugma bilan kursga qo\'shadi.',
      color: 'purple',
    },
  ];

  const stats = [
    { value: '100%', label: 'Brauzer ichida' },
    { value: '3', label: 'Rol: Admin, Ustoz, Talaba' },
    { value: '8+', label: 'Dasturlash tillari' },
    { value: '0', label: '3-tool imkoniyat' },
  ];

  const roles = [
    {
      icon: GraduationCap,
      title: 'Talaba',
      color: 'green',
      items: [
        'Guruh orqali biriktirilgan kurslarni ko\'rish',
        'Ma\'ruzalarni o\'qish',
        'Topshiriqlarni brauzerda bajarish',
        'Natijalar va progress ko\'rish',
      ],
    },
    {
      icon: BookOpen,
      title: 'Ustoz',
      color: 'indigo',
      items: [
        'Kurs yaratish va boshqarish',
        'Ma\'ruza materiallari qo\'shish',
        'Topshiriq va test yaratish',
        'Talabalarni baholash va monitoring',
      ],
    },
    {
      icon: Shield,
      title: 'Admin',
      color: 'amber',
      items: [
        'Barcha foydalanuvchilarni boshqarish',
        'Guruhlar yaratish',
        'Talabalarni guruhga biriktirish',
        'Tizim ustidan to\'liq nazorat',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield size={20} className="text-indigo-400" />
            </div>
            <span className="font-bold text-xl">NoCopy<span className="text-indigo-400">Zone</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-white text-sm transition px-4 py-2">
              Kirish
            </button>
            <button onClick={() => navigate('/register')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition">
              Ro'yxatdan o'tish
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm px-4 py-2 rounded-full mb-8">
              <Zap size={14} /> O'zbekiston xalqaro islom akademiyasi
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Akademik halollik
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                yangi darajada
              </span>
            </h1>

            <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Talabalar topshiriqlarni to'g'ridan-to'g'ri brauzerda bajaradi.
              Real-time monitoring, anti-cheat tizimi va avtomatik baholash.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => navigate('/register')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition shadow-lg shadow-indigo-500/25">
                Boshlash <ChevronRight size={20} />
              </button>
              <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-lg transition">
                Imkoniyatlar
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mock UI preview */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass rounded-3xl p-1 shadow-2xl shadow-indigo-500/10">
            <div className="bg-slate-900 rounded-2xl p-4">
              {/* Mock topbar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="text-slate-400 text-sm">Algoritmlar — Oraliq Nazorat · QUIZ</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-lg font-mono">
                    <Eye size={12} /> 23:45
                  </div>
                  <div className="bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-lg">
                    95% halollik
                  </div>
                </div>
              </div>
              {/* Mock quiz */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                  <div className="text-white font-medium">Savol 3 / 20</div>
                  <div className="text-slate-300 text-sm">Quyidagi algoritmlardan qaysi biri O(n log n) vaqt murakkabligiga ega?</div>
                  {[
                    { l: 'A', t: 'Bubble Sort', selected: false },
                    { l: 'B', t: 'Merge Sort', selected: true },
                    { l: 'C', t: 'Selection Sort', selected: false },
                    { l: 'D', t: 'Insertion Sort', selected: false },
                  ].map(opt => (
                    <div key={opt.l} className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition ${
                      opt.selected ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-400'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        opt.selected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>{opt.l}</div>
                      {opt.t}
                      {opt.selected && <CheckCircle2 size={14} className="text-indigo-400 ml-auto" />}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="text-slate-400 text-xs font-medium">Savollar</div>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className={`aspect-square rounded-lg text-xs flex items-center justify-center font-medium ${
                        i < 2 ? 'bg-green-500/20 text-green-400' :
                        i === 2 ? 'bg-indigo-600 text-white' :
                        'bg-slate-800 text-slate-500'
                      }`}>{i + 1}</div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-red-400 text-xs font-medium mb-1 flex items-center gap-1">
                      <Eye size={10} /> Nazorat jurnali
                    </div>
                    <div className="text-red-400/70 text-xs">TAB_SWITCH · 14:23</div>
                    <div className="text-amber-400/70 text-xs">RIGHT_CLICK · 14:21</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Asosiy imkoniyatlar</h2>
            <p className="text-slate-400 text-lg">Akademik halollikni ta'minlash uchun zarur barcha vositalar</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-slate-600 transition group">
                <div className={`w-12 h-12 rounded-2xl bg-${f.color}-500/20 flex items-center justify-center mb-4`}>
                  <f.icon size={24} className={`text-${f.color}-400`} />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Kim uchun?</h2>
            <p className="text-slate-400 text-lg">Har bir rol uchun maxsus imkoniyatlar</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-6">
                <div className={`w-12 h-12 rounded-2xl bg-${r.color}-500/20 flex items-center justify-center mb-4`}>
                  <r.icon size={24} className={`text-${r.color}-400`} />
                </div>
                <h3 className="font-bold text-white text-xl mb-4">{r.title}</h3>
                <ul className="space-y-2.5">
                  {r.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-slate-300 text-sm">
                      <CheckCircle2 size={16} className={`text-${r.color}-400 shrink-0 mt-0.5`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
              <Star size={32} className="text-indigo-400" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Boshlashga tayyormisiz?</h2>
            <p className="text-slate-400 text-lg mb-8">
              Akademik halollikni ta'minlash — bitta platforma bilan
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/register')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition shadow-lg shadow-indigo-500/25">
                Ro'yxatdan o'tish <ChevronRight size={20} />
              </button>
              <button onClick={() => navigate('/login')}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-lg transition">
                Kirish
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-400" />
            <span className="font-bold text-white">NoCopyZone</span>
          </div>
          <p className="text-slate-500 text-sm">O'zbekiston xalqaro islom akademiyasi · 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;