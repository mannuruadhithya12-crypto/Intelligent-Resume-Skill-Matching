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
            setResumes(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveResume = (index) => {
        setResumes(prev => prev.filter((_, i) => i !== index));
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
                        {/* Resume Upload Card */}
                        <div className="bg-[#0f172a] rounded-2xl p-6 border border-gray-800 shadow-card hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-110"></div>

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="p-3 bg-primary/10 rounded-xl text-secondary border border-primary/20 shadow-neon"><FiUploadCloud size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Upload Candidates</h3>
                                    <p className="text-sm text-gray-400 mt-1">Drag and drop resumes for batch processing</p>
                                </div>
                            </div>
                            <UploadArea
                                hint="Drag & drop resumes here"
                                sub="Bulk upload supported (Max 10MB per file)"
                                accept=".pdf,.docx,.doc"
                                onChange={handleResumeChange}
                                files={resumes}
                                onRemove={handleRemoveResume}
                                multiple={true}
                                uploading={uploading}
                            />
                        </div>

                        {/* JD Card with Toggle */}
                        <div className="bg-[#0f172a] rounded-2xl p-6 border border-gray-800 shadow-card hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-110"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary-glow border border-primary/20 shadow-neon"><FiClipboard size={24} /></div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Job Description</h3>
                                        <p className="text-sm text-gray-400 mt-1">Define requirements or upload JD document</p>
                                    </div>
                                </div>
                                <div className="flex bg-bg-deep p-1 rounded-xl border border-gray-800 shadow-inner">
                                    <button
                                        onClick={() => setJdMode('upload')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${jdMode === 'upload' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setJdMode('text')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${jdMode === 'text' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Paste Text
                                    </button>
                                </div>
                            </div>

                            {jdMode === 'upload' ? (
                                <UploadArea
                                    hint="Upload Job Description"
                                    sub="Supports TXT, PDF, or DOCX"
                                    accept=".txt,.pdf,.docx"
                                    onChange={handleJDChange}
                                    files={jdFile ? [jdFile] : []}
                                    onRemove={() => setJdFile(null)}
                                    multiple={false}
                                    uploading={uploading}
                                />
                            ) : (
                                <div className="border border-gray-700 rounded-xl p-4 bg-[#050B14] focus-within:border-primary/50 transition-colors h-56 relative group/text">
                                    <textarea
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-600 resize-none font-sans leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-600 group-focus-within/text:text-primary transition-colors">
                                        {jdText.length} chars
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#0f172a] p-6 rounded-2xl border border-gray-800 shadow-card text-center relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse-glow transition-all duration-700"></div>

                            <button
                                onClick={handleRunAnalysis}
                                disabled={!isReady || uploading}
                                className={`relative z-10 w-full py-4 font-sans font-bold text-lg rounded-xl flex items-center justify-center gap-3 mx-auto transition-all duration-300 ${isReady && !uploading
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-neon hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] active:scale-95'
                                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <FiActivity className="animate-spin" /> Running AI Analysis...
                                    </>
                                ) : (
                                    <>
                                        <FiZap className="fill-current" /> Run Intelligence Engine
                                    </>
                                )}
                            </button>
                            {uploading && (
                                <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden relative z-10">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-skeleton w-1/2 rounded-full"></div>
                                </div>
                            )}
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

function UploadArea({ hint, sub, accept, onChange, files, onRemove, multiple, uploading = false }) {
    const fileInputRef = useRef(null);
    const handleClick = () => fileInputRef.current?.click();

    return (
        <div
            className={`group/upload border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 flex flex-col items-center relative overflow-hidden min-h-[14rem] ${files && files.length > 0 ? 'border-primary/30 bg-primary/5' : 'border-gray-700 bg-[#050B14] hover:bg-[#1e293b]/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] cursor-pointer'
                }`}
            onClick={files && files.length > 0 ? undefined : handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                onChange={onChange}
                multiple={multiple}
            />

            {files && files.length > 0 ? (
                <div className="w-full relative z-10 h-full flex flex-col pt-3">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-sm font-bold text-primary-glow flex items-center gap-2">
                            <FiCheckCircle /> {files.length} {files.length === 1 ? 'File' : 'Files'} Attached
                        </span>
                        {!multiple && !uploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(0); }}
                                className="text-gray-400 hover:text-red-400 p-1 transition-all duration-200 hover:scale-110 hover:bg-red-500/10 rounded"
                            >
                                <FiX size={18} />
                            </button>
                        )}
                    </div>

                    {uploading && multiple && (
                        <div className="mb-4 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full animate-skeleton w-3/4 rounded-full"></div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 styled-scrollbar max-h-40 mb-4 text-left">
                        {Array.from(files).map((file, idx) => (
                            <div key={idx} className="bg-[#0f172a] border border-gray-800 p-4 rounded-xl flex items-center justify-between group/item shadow-sm hover:border-primary/30 transition-all duration-200">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2.5 bg-blue-500/10 rounded-lg"><FiFileText className="text-blue-400" size={18} /></div>
                                    <div className="truncate">
                                        <p className="text-sm text-gray-200 font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {multiple && !uploading && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                                        className="text-gray-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-all duration-200"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {multiple && !uploading && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClick(); }}
                            className="w-full py-3 bg-gray-800/50 border border-gray-700 border-dashed rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 mt-auto flex items-center justify-center gap-2"
                        >
                            <FiUploadCloud /> Add More Files
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full relative z-10 my-auto pointer-events-none">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-primary/20 group-hover/upload:rotate-3 transition-all duration-300">
                        <FiUploadCloud size={32} className="text-gray-400 group-hover/upload:text-primary-glow transition-colors" />
                    </div>
                    <p className="text-lg font-bold text-gray-200">{hint}</p>
                    <p className="text-sm text-gray-500 mt-2">{sub}</p>

                    <div className="mt-6 px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2">
                        Browse Files
                    </div>
                </div>
            )}
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
                                {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
