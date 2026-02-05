import React, { useState, useRef, useEffect } from 'react';
import {
    FiFileText, FiClipboard, FiUploadCloud, FiActivity, FiSun, FiCheck, FiArrowRight, FiZap, FiX, FiShield,
    FiCpu
} from 'react-icons/fi';
import { uploadFiles, startAnalysis, getHistory } from '../api';
import { useNavigate } from 'react-router-dom';

export default function ResumeAnalysisPage({ onAnalysisStart }) {
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);

    // JD States
    const [jdFile, setJdFile] = useState(null);
    const [jdText, setJdText] = useState('');
    const [jdMode, setJdMode] = useState('upload'); // 'upload' | 'text'

    const [uploading, setUploading] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);

    // Real History Data
    const [recentHistory, setRecentHistory] = useState([]);

    useEffect(() => {
        getHistory().then(setRecentHistory).catch(console.error);
    }, []);

    const handleResumeChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setResumes(Array.from(e.target.files));
        }
    };

    const handleJDChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setJdFile(e.target.files[0]);
        }
    };

    const handleRunAnalysis = async () => {
        let finalJd = jdFile;
        if (jdMode === 'text') {
            if (!jdText.trim()) {
                alert("Please enter job description text.");
                return;
            }
            const blob = new Blob([jdText], { type: 'text/plain' });
            finalJd = new File([blob], "Job_Description_Pasted.txt", { type: "text/plain" });
        }

        if (!resumes.length || !finalJd) return;

        setUploading(true);
        try {
            const uploadRes = await uploadFiles(resumes, finalJd);
            const jobRes = await startAnalysis(uploadRes.job_id);
            onAnalysisStart(jobRes.job_id);
        } catch (err) {
            console.error(err);
            setUploading(false);
            alert("Analysis failed. Please try again.");
        }
    };

    const isReady = resumes.length > 0 && ((jdMode === 'upload' && jdFile) || (jdMode === 'text' && jdText.trim().length > 10));

    return (
        <div className="w-full animate-fade-in content-center relative">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none -z-10"></div>

            <div className="max-w-6xl mx-auto space-y-12 pb-12">

                {/* Page Header */}
                <header className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary-glow mb-4 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        AI Engine Ready
                    </div>
                    <h2 className="text-5xl font-display font-bold text-white tracking-tight mb-4">
                        Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-secondary">Intelligence</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Upload candidate resumes and job descriptions to generate comprehensive, bias-free suitability reports in seconds.
                    </p>
                </header>

                {/* UPLOAD GRID */}
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <UploadCard
                            title="Candidate Resume"
                            icon={<FiFileText />}
                            hint="Drop PDF or DOCX here"
                            sub="Maximum file size 10MB"
                            accept=".pdf,.docx,.doc"
                            onChange={handleResumeChange}
                            file={resumes[0]}
                        />

                        {/* JD Card with Toggle */}
                        <div className="glass-panel rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl text-primary-glow shadow-inner border border-white/5"><FiClipboard size={24} /></div>
                                    <h3 className="font-display font-bold text-xl text-white">Job Description</h3>
                                </div>
                                <div className="flex bg-bg-deep p-1 rounded-xl border border-white/10">
                                    <button
                                        onClick={() => setJdMode('upload')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${jdMode === 'upload' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setJdMode('text')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${jdMode === 'text' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Paste Text
                                    </button>
                                </div>
                            </div>

                            {jdMode === 'upload' ? (
                                <UploadArea
                                    hint="Paste JD or upload file"
                                    sub="Supports TXT, PDF, or text paste"
                                    accept=".txt,.pdf,.docx"
                                    onChange={handleJDChange}
                                    file={jdFile}
                                />
                            ) : (
                                <div className="border border-white/10 rounded-2xl p-4 bg-bg-deep/50 focus-within:border-primary/50 transition-colors h-56 relative group/text">
                                    <textarea
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        className="w-full h-full bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-600 resize-none font-sans leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-600 group-focus-within/text:text-primary transition-colors">
                                        {jdText.length} chars
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-panel p-10 rounded-3xl text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <button
                                onClick={handleRunAnalysis}
                                disabled={!isReady || uploading}
                                className={`relative z-10 w-full py-5 font-display font-bold text-lg rounded-2xl flex items-center justify-center gap-3 mx-auto tracking-wide transition-all uppercase ${isReady && !uploading
                                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-neon hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <FiActivity className="animate-spin" /> Analyzing 140+ Data Points...
                                    </>
                                ) : (
                                    <>
                                        <FiZap className="fill-current" /> Run Intelligence Engine
                                    </>
                                )}
                            </button>
                            <p className="relative z-10 text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em] font-medium">
                                Estimated Processing Time: ~1.2 Seconds
                            </p>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Side Widgets */}
                    <aside className="col-span-12 lg:col-span-4 space-y-6">
                        <RecentPanel history={recentHistory} onJobClick={onAnalysisStart} />
                        <TipsPanel />
                        <SecurityPanel onOpenPolicy={() => setShowPolicy(true)} />
                    </aside>
                </div>
            </div>

            {/* DATA POLICY MODAL */}
            {showPolicy && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-bg-deep w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 animate-fade-in-up flex flex-col overflow-hidden relative">
                        {/* Modal Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary"></div>

                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 text-primary rounded-lg"><FiShield size={22} /></div>
                                <h3 className="font-display font-bold text-white text-xl">Privacy & Security</h3>
                            </div>
                            <button onClick={() => setShowPolicy(false)} className="text-slate-500 hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 text-sm text-slate-400 leading-relaxed font-light">
                            <p><strong className="text-white font-bold block mb-1">1. Military-Grade Encryption</strong> All files uploaded to RecruitAI are encrypted using AES-256 standards both in transit and at rest.</p>
                            <p><strong className="text-white font-bold block mb-1">2. Auto-Purge Protocol</strong> Candidate resumes and job descriptions are stored in a temporary holding area for analysis. Unless explicitly saved, all raw files are automatically purged from our servers after 24 hours.</p>
                            <p><strong className="text-white font-bold block mb-1">3. Bias-Free AI</strong> Our matching algorithms are audited for bias. We do not use PII (Personally Identifiable Information) such as name, gender, or age in the decision-making logic.</p>
                        </div>
                        <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end">
                            <button onClick={() => setShowPolicy(false)} className="px-8 py-3 bg-white text-bg-deep font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

/* ---------- Helper Components ---------- */

function UploadArea({ hint, sub, accept, onChange, file }) {
    const fileInputRef = useRef(null);
    const handleClick = () => fileInputRef.current?.click();

    return (
        <div
            onClick={handleClick}
            className={`group/upload border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer h-56 flex flex-col justify-center items-center relative overflow-hidden ${file ? 'border-success/50 bg-success/5' : 'border-white/10 bg-bg-deep/50 hover:bg-white/5 hover:border-primary/50'
                }`}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                onChange={onChange}
            />

            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] bg-checkered pointer-events-none"></div>

            {file ? (
                <div className="flex flex-col items-center text-success animate-fade-in relative z-10">
                    <div className="size-16 rounded-full bg-success/20 flex items-center justify-center mb-4 shadow-neon">
                        <FiCheck className="text-2xl" />
                    </div>
                    <p className="text-sm font-bold text-white max-w-[200px] truncate">{file.name}</p>
                    <p className="text-xs text-success/80 mt-1 font-medium bg-success/10 px-2 py-0.5 rounded-full mt-2">Ready for analysis</p>
                </div>
            ) : (
                <div className="flex flex-col items-center relative z-10">
                    <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-primary/20 group-hover/upload:text-primary-glow transition-all duration-300">
                        <FiUploadCloud className="text-slate-400 text-2xl group-hover/upload:text-primary-glow" />
                    </div>
                    <p className="font-bold text-white text-lg">{hint}</p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>
                </div>
            )}
        </div>
    );
}

function UploadCard({ title, icon, hint, sub, accept, onChange, file }) {
    return (
        <div className="glass-panel rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-3 bg-white/5 rounded-xl text-primary-glow shadow-inner border border-white/5">
                    {icon}
                </div>
                <h3 className="font-display font-bold text-xl text-white">{title}</h3>
                {file && (
                    <span className="ml-auto text-[10px] font-bold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fade-in">
                        <span className="size-1.5 rounded-full bg-success animate-pulse"></span> Uploaded
                    </span>
                )}
            </div>
            <UploadArea hint={hint} sub={sub} accept={accept} onChange={onChange} file={file} />
        </div>
    );
}

function TipsPanel() {
    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-yellow-500">
                <FiSun size={60} />
            </div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm relative z-10">
                <FiSun className="text-yellow-400" />
                Optimization Tips
            </h4>
            <div className="text-xs text-slate-400 space-y-2 relative z-10 leading-relaxed">
                <p>• <span className="text-slate-300 font-medium">Native PDFs</span> parse 30% faster than scanned images.</p>
                <p>• Ensure the file is not password protected.</p>
            </div>
        </div>
    );
}

function SecurityPanel({ onOpenPolicy }) {
    return (
        <div className="relative p-6 rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-primary opacity-90 transition-opacity group-hover:opacity-100"></div>

            <div className="relative z-10">
                <h4 className="font-display font-bold mb-2 flex items-center gap-2 text-sm text-white"><FiShield className="text-indigo-200" /> Enterprise Security</h4>
                <p className="text-[10px] text-indigo-100 leading-relaxed max-w-[90%]">
                    AES-256 encryption active. Data is strictly processed in ephemeral memory.
                </p>
                <button
                    onClick={onOpenPolicy}
                    className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white hover:translate-x-1 transition-transform"
                >
                    View Compliance <FiArrowRight />
                </button>
            </div>
        </div>
    );
}

function RecentPanel({ history, onJobClick }) {
    const navigate = useNavigate();

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Recent Activity
                </p>
                <button onClick={() => navigate('/candidates')} className="text-[10px] text-primary-glow font-bold hover:text-white transition-colors">VIEW ALL</button>
            </div>

            <div className="space-y-1">
                {history && history.length > 0 ? (
                    history.slice(0, 4).map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => onJobClick(item.job_id)}
                            className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-white/5"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`size-2 rounded-full flex-shrink-0 ${item.status === 'success' || item.status === 'completed' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-warning'}`}></div>
                                <span className="text-sm text-slate-400 font-medium truncate group-hover:text-white transition-colors">{item.jd_filename || item.filename || 'Untitled Analysis'}</span>
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-xs text-slate-600 italic">
                        No recent history found
                    </div>
                )}
            </div>
        </div>
    );
}
