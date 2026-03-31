import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Plus, Trash2, X, Loader } from 'lucide-react';

interface Question {
  id: number; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; orderNum: number;
}

interface Props { taskId: number; taskTitle: string; onClose: () => void; }

const QuizManager: React.FC<Props> = ({ taskId, taskTitle, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState('A');

  const fetchQuestions = useCallback(async () => {
    const res = await api.get(`/quiz/task/${taskId}/questions/admin`);
    setQuestions(res.data);
  }, [taskId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/quiz/task/${taskId}/questions`, {
        questionText: qText, optionA: optA, optionB: optB,
        optionC: optC, optionD: optD, correctAnswer: correct,
        orderNum: questions.length,
      });
      toast.success('Savol qo\'shildi!');
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect('A');
      fetchQuestions();
    } catch { toast.error('Xato'); } finally { setLoading(false); }
  };

  const deleteQuestion = async (id: number) => {
    await api.delete(`/quiz/questions/${id}`);
    toast.success('O\'chirildi');
    fetchQuestions();
  };

  const correctColors: Record<string, string> = {
    A: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    B: 'bg-green-500/20 text-green-400 border-green-500/30',
    C: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    D: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">Quiz savollarini boshqarish</h3>
            <p className="text-slate-400 text-sm">{taskTitle} · {questions.length} savol</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-slate-800 p-5 overflow-y-auto shrink-0">
            <h4 className="text-sm font-medium text-white mb-4">Yangi savol</h4>
            <form onSubmit={addQuestion} className="space-y-3">
              <textarea value={qText} onChange={e => setQText(e.target.value)} required rows={3}
                placeholder="Savol matni..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition" />
              {['A', 'B', 'C', 'D'].map((label, idx) => {
                const val = [optA, optB, optC, optD][idx];
                const setter = [setOptA, setOptB, setOptC, setOptD][idx];
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${correctColors[label]}`}>{label}</span>
                    <input value={val} onChange={e => setter(e.target.value)} required placeholder={`${label} variant...`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                );
              })}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">To'g'ri javob</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map(l => (
                    <button key={l} type="button" onClick={() => setCorrect(l)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition border ${correct === l ? correctColors[l] : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                {loading ? <Loader size={16} className="animate-spin" /> : <><Plus size={16} /> Qo'shish</>}
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {questions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Hali savol yo'q</div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500">{i + 1}.</span>
                          <p className="text-white text-sm font-medium">{q.questionText}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['A', 'B', 'C', 'D'].map((l, idx) => {
                            const opt = [q.optionA, q.optionB, q.optionC, q.optionD][idx];
                            const isCorrect = q.correctAnswer === l;
                            return (
                              <div key={l} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                                <span className="font-bold">{l}.</span> {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-red-400 transition shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizManager;