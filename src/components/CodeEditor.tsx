import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader, ChevronDown, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}

const LANGUAGES = [
  { id: 62,  name: 'Java',       monaco: 'java',       template: 'public class Main {\n    public static void main(String[] args) {\n        // Kodingizni shu yerga yozing\n        System.out.println("Hello, World!");\n    }\n}' },
  { id: 71,  name: 'Python',     monaco: 'python',     template: '# Kodingizni shu yerga yozing\nprint("Hello, World!")' },
  { id: 54,  name: 'C++',        monaco: 'cpp',        template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Kodingizni shu yerga yozing\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { id: 50,  name: 'C',          monaco: 'c',          template: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
  { id: 63,  name: 'JavaScript', monaco: 'javascript', template: '// Kodingizni shu yerga yozing\nconsole.log("Hello, World!");' },
  { id: 60,  name: 'Go',         monaco: 'go',         template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}' },
  { id: 72,  name: 'Ruby',       monaco: 'ruby',       template: '# Kodingizni yozing\nputs "Hello, World!"' },
  { id: 73,  name: 'Rust',       monaco: 'rust',       template: 'fn main() {\n    println!("Hello, World!");\n}' },
];

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = 'your-rapidapi-key'; // RapidAPI dan bepul kalit oling

const CodeEditor: React.FC<Props> = ({ value, onChange, readOnly }) => {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout?: string; stderr?: string; status?: string; time?: string; memory?: string } | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [stdin, setStdin] = useState('');
  const editorRef = useRef<any>(null);

  const handleLangChange = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setShowLangMenu(false);
    if (!value || value === selectedLang.template) {
      onChange(lang.template);
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    if (!value) onChange(selectedLang.template);
  };

  const runCode = async () => {
    setRunning(true);
    setShowOutput(true);
    setOutput(null);

    try {
      // Submit
      const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
          source_code: value,
          language_id: selectedLang.id,
          stdin: stdin,
        }),
      });

      if (!submitRes.ok) {
        // Fallback: judge0 public instance
        const fallbackRes = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_code: value, language_id: selectedLang.id, stdin }),
        });
        const data = await fallbackRes.json();
        setOutput({ stdout: data.stdout, stderr: data.stderr || data.compile_output, status: data.status?.description, time: data.time, memory: data.memory });
        return;
      }

      const { token } = await submitRes.json();

      // Poll result
      let attempts = 0;
      while (attempts < 15) {
        await new Promise(r => setTimeout(r, 1000));
        const res = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false`, {
          headers: { 'X-RapidAPI-Key': JUDGE0_KEY, 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' },
        });
        const data = await res.json();
        if (data.status?.id > 2) {
          setOutput({ stdout: data.stdout, stderr: data.stderr || data.compile_output, status: data.status?.description, time: data.time, memory: data.memory });
          break;
        }
        attempts++;
      }
    } catch (err) {
      setOutput({ stderr: 'Kod ishga tushirishda xato. Judge0 API kalitini tekshiring.' });
    } finally {
      setRunning(false);
    }
  };

  const isSuccess = output?.status === 'Accepted';
  const hasError = output?.stderr;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 border-b border-slate-800 shrink-0">
        {/* Language selector */}
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
            <span className="text-indigo-400 font-mono">{selectedLang.name}</span>
            <ChevronDown size={14} className={`text-slate-400 transition ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {LANGUAGES.map(lang => (
                  <button key={lang.id} onClick={() => handleLangChange(lang)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-700 ${selectedLang.id === lang.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}>
                    {lang.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Run button */}
        {!readOnly && (
          <button onClick={runCode} disabled={running || !value.trim()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
            {running ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Ishga tushirilmoqda...' : 'Ishga tushirish'}
          </button>
        )}

        <button onClick={() => setShowOutput(!showOutput)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${showOutput ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          <Terminal size={14} /> Natija
        </button>
      </div>

      {/* Editor + Output */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div className={`flex flex-col ${showOutput ? 'w-1/2' : 'w-full'} transition-all`}>
          <Editor
            height="100%"
            language={selectedLang.monaco}
            value={value || selectedLang.template}
            onChange={val => onChange(val || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              readOnly: readOnly,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
            }}
          />
        </div>

        {/* Output panel */}
        <AnimatePresence>
          {showOutput && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-1/2 flex flex-col border-l border-slate-800 bg-slate-950">
              {/* Stdin */}
              <div className="border-b border-slate-800 p-3">
                <div className="text-xs text-slate-400 mb-1.5 font-medium">Input (stdin)</div>
                <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={3}
                  placeholder="Kirish ma'lumotlari (ixtiyoriy)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition" />
              </div>

              {/* Output */}
              <div className="flex-1 p-4 overflow-y-auto">
                {running ? (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader size={16} className="animate-spin" />
                    <span className="text-sm">Kod ishga tushirilmoqda...</span>
                  </div>
                ) : output ? (
                  <div className="space-y-3">
                    {/* Status */}
                    <div className={`flex items-center gap-2 text-sm font-medium ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                      {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {output.status}
                      {output.time && <span className="text-slate-400 font-normal ml-2">{output.time}s</span>}
                      {output.memory && <span className="text-slate-400 font-normal">{output.memory}KB</span>}
                    </div>

                    {/* Stdout */}
                    {output.stdout && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1.5">Natija:</div>
                        <pre className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{output.stdout}</pre>
                      </div>
                    )}

                    {/* Stderr */}
                    {hasError && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1.5">Xato:</div>
                        <pre className="bg-slate-900 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{output.stderr}</pre>
                      </div>
                    )}

                    {!output.stdout && !hasError && (
                      <p className="text-slate-400 text-sm">Natija yo'q</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Terminal size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Kodni ishga tushiring</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CodeEditor;