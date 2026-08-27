import React, { useState, useRef, useEffect } from 'react';
import {
    FiFileText, FiClipboard, FiUploadCloud, FiActivity, FiSun, FiCheck, FiArrowRight, FiZap, FiX, FiShield,
    FiCheckCircle, FiTrash2, FiCpu
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
        <div className="w-full animate-fade-in content-center relative bg-background-light dark:bg-background-dark min-h-screen">
            <div className="max-w-6xl mx-auto space-y-12 pb-12 pt-10 px-6 lg:px-8">

                {/* Page Header */}
                <header className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest text-primary mb-4 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        AI Engine Ready
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-[#111418] dark:text-white tracking-tight mb-4">
                        Resume <span className="text-primary">Intelligence</span>
                    </h2>
                    <p className="text-[#617589] dark:text-gray-400 text-lg max-w-2xl leading-relaxed">
                        Upload candidate resumes and job descriptions to generate comprehensive, bias-free suitability reports in seconds.
                    </p>
                </header>

                {/* UPLOAD GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Resume Upload Card */}
                        <div className="bg-white dark:bg-[#111418] rounded-2xl p-6 border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all duration-300 relative overflow-hidden">

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary"><FiUploadCloud size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Upload Candidates</h3>
                                    <p className="text-sm text-[#617589] dark:text-gray-400 mt-1">Drag and drop resumes for batch processing</p>
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
                        <div className="bg-white dark:bg-[#111418] rounded-2xl p-6 border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all duration-300 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><FiClipboard size={24} /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#111418] dark:text-white">Job Description</h3>
                                        <p className="text-sm text-[#617589] dark:text-gray-400 mt-1">Define requirements or upload JD</p>
                                    </div>
                                </div>
                                <div className="flex bg-[#f0f2f4] dark:bg-gray-800 p-1 rounded-xl shadow-inner self-start sm:self-auto">
                                    <button
                                        onClick={() => setJdMode('upload')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${jdMode === 'upload' ? 'bg-white dark:bg-[#111418] text-primary shadow-sm' : 'text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white'}`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setJdMode('text')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${jdMode === 'text' ? 'bg-white dark:bg-[#111418] text-primary shadow-sm' : 'text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white'}`}
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
                                <div className="border border-[#f0f2f4] dark:border-gray-800 rounded-xl p-4 bg-[#f9fafb] dark:bg-gray-900 focus-within:ring-2 focus-within:ring-primary/50 transition-colors h-56 relative group/text">
                                    <textarea
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        className="w-full h-full bg-transparent border-none outline-none text-sm text-[#111418] dark:text-white placeholder-[#617589] resize-none font-sans leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs font-mono text-[#617589] group-focus-within/text:text-primary transition-colors">
                                        {jdText.length} chars
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111418] p-6 rounded-2xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm text-center relative overflow-hidden transition-all duration-300">

                            <button
                                onClick={handleRunAnalysis}
                                disabled={!isReady || uploading}
                                className={`relative z-10 w-full py-4 font-sans font-bold text-lg rounded-xl flex items-center justify-center gap-3 mx-auto transition-all duration-300 ${isReady && !uploading
                                    ? 'bg-primary text-white shadow-md hover:bg-primary/90 active:scale-95'
                                    : 'bg-[#f0f2f4] dark:bg-gray-800 text-[#617589] dark:text-gray-500 cursor-not-allowed'
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
                                <div className="mt-4 h-1 w-full bg-[#f0f2f4] dark:bg-gray-800 rounded-full overflow-hidden relative z-10">
                                    <div className="h-full bg-primary animate-pulse w-1/2 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL - Side Widgets */}
                    <aside className="lg:col-span-4 space-y-6">
                        <RecentPanel history={recentHistory} onJobClick={onAnalysisStart} />
                        <TipsPanel />
                        <SecurityPanel onOpenPolicy={() => setShowPolicy(true)} />
                    </aside>
                </div>
            </div>

            {/* DATA POLICY MODAL */}
            {showPolicy && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111418] w-full max-w-lg rounded-3xl shadow-xl border border-[#f0f2f4] dark:border-gray-800 animate-fade-in-up flex flex-col overflow-hidden relative">

                        <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center bg-[#f9fafb] dark:bg-gray-900">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg"><FiShield size={22} /></div>
                                <h3 className="font-display font-bold text-[#111418] dark:text-white text-xl">Privacy & Security</h3>
                            </div>
                            <button onClick={() => setShowPolicy(false)} className="text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 text-sm text-[#617589] dark:text-gray-300 leading-relaxed font-normal">
                            <p><strong className="text-[#111418] dark:text-white font-bold block mb-1">1. Military-Grade Encryption</strong> All files uploaded to RecruitAI are encrypted using AES-256 standards both in transit and at rest.</p>
                            <p><strong className="text-[#111418] dark:text-white font-bold block mb-1">2. Auto-Purge Protocol</strong> Candidate resumes and job descriptions are stored in a temporary holding area for analysis. Unless explicitly saved, all raw files are automatically purged from our servers after 24 hours.</p>
                            <p><strong className="text-[#111418] dark:text-white font-bold block mb-1">3. Bias-Free AI</strong> Our matching algorithms are audited for bias. We do not use PII (Personally Identifiable Information) such as name, gender, or age in the decision-making logic.</p>
                        </div>
                        <div className="p-6 border-t border-[#f0f2f4] dark:border-gray-800 bg-[#f9fafb] dark:bg-gray-900 flex justify-end">
                            <button onClick={() => setShowPolicy(false)} className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
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
            className={`group/upload border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 flex flex-col items-center relative overflow-hidden min-h-[14rem] ${files && files.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-[#f0f2f4] dark:border-gray-800 bg-[#f9fafb] dark:bg-gray-900 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 hover:border-primary/50 cursor-pointer'
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
                        <span className="text-sm font-bold text-primary flex items-center gap-2">
                            <FiCheckCircle /> {files.length} {files.length === 1 ? 'File' : 'Files'} Attached
                        </span>
                        {!multiple && !uploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(0); }}
                                className="text-[#617589] hover:text-red-500 p-1 transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                                <FiX size={18} />
                            </button>
                        )}
                    </div>

                    {uploading && multiple && (
                        <div className="mb-4 w-full bg-[#f0f2f4] dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full animate-pulse w-3/4 rounded-full"></div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 styled-scrollbar max-h-40 mb-4 text-left">
                        {Array.from(files).map((file, idx) => (
                            <div key={idx} className="bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-primary/30 transition-all duration-200">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2.5 bg-primary/10 rounded-lg"><FiFileText className="text-primary" size={18} /></div>
                                    <div className="truncate">
                                        <p className="text-sm text-[#111418] dark:text-white font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-[#617589] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {multiple && !uploading && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                                        className="text-[#617589] hover:text-red-500 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
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
                            className="w-full py-3 bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 rounded-xl text-sm font-bold text-[#617589] hover:text-primary hover:border-primary/30 transition-all duration-200 mt-auto flex items-center justify-center gap-2 shadow-sm"
                        >
                            <FiUploadCloud /> Add More Files
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full relative z-10 my-auto pointer-events-none">
                    <div className="w-16 h-16 bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 shadow-sm rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
                        <FiUploadCloud size={32} className="text-[#617589] group-hover/upload:text-primary transition-colors" />
                    </div>
                    <p className="text-lg font-bold text-[#111418] dark:text-white">{hint}</p>
                    <p className="text-sm text-[#617589] mt-2">{sub}</p>

                    <div className="mt-6 px-6 py-2.5 rounded-xl bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 text-[#111418] dark:text-white text-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2">
                        Browse Files
                    </div>
                </div>
            )}
        </div>
    );
}

function TipsPanel() {
    return (
        <div className="bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 shadow-sm p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-yellow-500">
                <FiSun size={60} />
            </div>
            <h4 className="text-[#111418] dark:text-white font-bold mb-3 flex items-center gap-2 text-sm relative z-10">
                <FiSun className="text-yellow-500" />
                Optimization Tips
            </h4>
            <div className="text-xs text-[#617589] space-y-2 relative z-10 leading-relaxed">
                <p>• <span className="text-[#111418] dark:text-gray-300 font-medium">Native PDFs</span> parse 30% faster than scanned images.</p>
                <p>• Ensure the file is not password protected.</p>
            </div>
        </div>
    );
}

function SecurityPanel({ onOpenPolicy }) {
    return (
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl overflow-hidden relative">
            <div className="relative z-10">
                <h4 className="font-display font-bold mb-2 flex items-center gap-2 text-sm text-[#111418] dark:text-white"><FiShield className="text-primary" /> Enterprise Security</h4>
                <p className="text-xs text-[#617589] leading-relaxed mb-4">
                    AES-256 encryption active. Data is strictly processed in ephemeral memory.
                </p>
                <button
                    onClick={onOpenPolicy}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
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
        <div className="bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 shadow-sm p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] uppercase tracking-widest text-[#617589] font-bold">
                    Recent Activity
                </p>
                <button onClick={() => navigate('/candidates')} className="text-[10px] text-primary font-bold hover:text-primary/80 transition-colors">VIEW ALL</button>
            </div>

            <div className="space-y-1">
                {history && history.length > 0 ? (
                    history.slice(0, 4).map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => onJobClick(item.job_id)}
                            className="flex justify-between items-center p-3 hover:bg-[#f9fafb] dark:hover:bg-gray-900 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-[#f0f2f4] dark:hover:border-gray-800"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`size-2 rounded-full flex-shrink-0 ${item.status === 'success' || item.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-sm text-[#111418] dark:text-gray-300 font-medium truncate group-hover:text-primary transition-colors">{item.jd_filename || item.filename || 'Untitled Analysis'}</span>
                            </div>
                            <span className="text-[10px] text-[#617589] font-mono">
                                {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-xs text-[#617589] italic">
                        No recent history found
                    </div>
                )}
            </div>
        </div>
    );
}
