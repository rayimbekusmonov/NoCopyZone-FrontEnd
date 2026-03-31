import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import IntegrityGauge from '../../components/IntegrityGauge';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield, Clock, Star, X, Loader, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

interface Log { id: number; eventType: string; severity: string; details: string; occurredAt: string; }
interface SubmissionReport {
  submissionId: number; studentName: string; studentEmail: string;
  integrityScore: number; status: string; score?: number;
  highRiskEvents: number; mediumRiskEvents: number; logs: Log[];
}
interface Task { id: number; title: string; type: string; maxScore: number; }

const severityColor: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const TeacherMonitoring: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reports, setReports] = useState<SubmissionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SubmissionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [gradeScore, setGradeScore] = useState('');
  const [grading, setGrading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get(`/tasks/course/${courseId}`).then(res => setTasks(res.data));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [courseId]);

  useEffect(() => {
    if (autoRefresh && selectedTask) {
      intervalRef.current = setInterval(() => loadReports(selectedTask.id), 8000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, selectedTask]);

  const loadReports = async (taskId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/proctor/task/${taskId}`);
      setReports(res.data);
      if (selectedReport) {
        const updated = res.data.find((r: SubmissionReport) => r.submissionId === selectedReport.submissionId);
        if (updated) setSelectedReport(updated);
      }
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  const selectTask = (task: Task) => {
    setSelectedTask(task);
    setSelectedReport(null);
    loadReports(task.id);
  };

  const handleGrade = async () => {
    if (!selectedReport || !gradeScore) return;
    setGrading(true);
    try {
      await api.post(`/submissions/${selectedReport.submissionId}/grade`, {
        score: parseInt(gradeScore), feedback: ''
      });
      toast.success(`Ball qo'yildi: ${gradeScore}`);
      setGradeScore('');
      loadReports(selectedTask!.id);
    } catch { toast.error('Xato yuz berdi'); }
    finally { setGrading(false); }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Orqaga
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Real-time Monitoring</h1>
              <p className="text-slate-400 mt-1">Topshiriq tanlang va talabalarni kuzating</p>
            </div>
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${autoRefresh ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Auto-refresh yoqiq' : 'Auto-refresh'}
            </button>
          </div>
        </motion.div>

        {/* Task selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {tasks.map(task => (
            <button key={task.id} onClick={() => selectTask(task)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedTask?.id === task.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              {task.title}
            </button>
          ))}
        </div>

        {!selectedTask ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Shield size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Monitoring uchun topshiriq tanlang</p>
          </div>
        ) : loading && reports.length === 0 ? (
          <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
        ) : reports.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">Hali hech qanday submission yo'q</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Student cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
              {reports.map((report, i) => (
                <motion.div key={report.submissionId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedReport(report)}
                  className={`glass rounded-2xl p-5 cursor-pointer transition ${
                    selectedReport?.submissionId === report.submissionId ? 'border-indigo-500/50 bg-indigo-500/5' :
                    report.integrityScore < 50 ? 'border-red-500/30 hover:border-red-500/50' : 'hover:border-slate-600'
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{report.studentName}</div>
                      <div className="text-xs text-slate-400">{report.studentEmail}</div>
                    </div>
                    <IntegrityGauge score={report.integrityScore} size={52} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {report.highRiskEvents > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                          <AlertTriangle size={10} /> {report.highRiskEvents}
                        </span>
                      )}
                      {report.mediumRiskEvents > 0 && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">{report.mediumRiskEvents} mid</span>
                      )}
                      {report.highRiskEvents === 0 && report.mediumRiskEvents === 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Xavfsiz</span>
                      )}
                    </div>
                    {report.score != null && (
                      <span className="text-green-400 font-bold text-sm">{report.score}/{selectedTask.maxScore}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Detail panel */}
            <AnimatePresence>
              {selectedReport && (
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
                  className="w-80 glass rounded-2xl p-5 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white">{selectedReport.studentName}</h3>
                      <p className="text-slate-400 text-xs">{selectedReport.studentEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IntegrityGauge score={selectedReport.integrityScore} size={44} />
                      <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                  </div>

                  {/* Grading */}
                  {selectedReport.status !== 'GRADED' && (
                    <div className="mb-4 p-3 bg-slate-800/50 rounded-xl">
                      <p className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                        <Star size={14} className="text-amber-400" /> Ball qo'yish
                      </p>
                      <div className="flex gap-2">
                        <input type="number" value={gradeScore} onChange={e => setGradeScore(e.target.value)}
                          min={0} max={selectedTask.maxScore} placeholder={`0-${selectedTask.maxScore}`}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                        <button onClick={handleGrade} disabled={!gradeScore || grading}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center gap-1">
                          {grading ? <Loader size={14} className="animate-spin" /> : 'Qo\'y'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedReport.score != null && (
                    <div className="mb-4 text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="text-2xl font-bold text-green-400">{selectedReport.score}/{selectedTask.maxScore}</div>
                      <div className="text-slate-400 text-xs">Baholangan</div>
                    </div>
                  )}

                  {/* Logs */}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {selectedReport.logs.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">Shubhali harakat yo'q</p>
                    ) : (
                      selectedReport.logs.map(log => (
                        <div key={log.id} className={`border rounded-xl p-3 ${severityColor[log.severity]}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{log.eventType}</span>
                            <span className="text-xs opacity-70">{log.severity}</span>
                          </div>
                          <p className="text-xs opacity-80">{log.details}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-60">
                            <Clock size={10} /> {new Date(log.occurredAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherMonitoring;