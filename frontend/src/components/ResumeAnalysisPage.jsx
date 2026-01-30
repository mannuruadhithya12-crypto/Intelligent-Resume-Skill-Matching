import React, { useState, useRef, useEffect } from 'react';
import {
    FiFileText, FiClipboard, FiUploadCloud, FiActivity, FiSun, FiCheck, FiArrowRight, FiZap, FiX, FiShield
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
        <div className="w-full animate-fade-in content-center">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* Page Header */}
                <header>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Resume Analysis Workspace
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Upload a candidate resume and job description to generate an
                        AI-powered suitability report.
                    </p>
                </header>

                {/* UPLOAD GRID */}
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-8">
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
                        <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-xl hover:border-primary/30 transition-colors group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><FiClipboard /></div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Job Description</h3>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-bg-deep p-1 rounded-lg border border-slate-200 dark:border-border-subtle">
                                    <button
                                        onClick={() => setJdMode('upload')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${jdMode === 'upload' ? 'bg-white dark:bg-bg-card text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'}`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setJdMode('text')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${jdMode === 'text' ? 'bg-white dark:bg-bg-card text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'}`}
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
                                <div className="border-2 border-slate-200 dark:border-border-subtle rounded-xl p-4 bg-slate-50 dark:bg-bg-deep/40 focus-within:border-primary/50 transition-colors h-48">
                                    <textarea
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        className="w-full h-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-gray-300 placeholder-slate-400 dark:placeholder-gray-600 resize-none font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-bg-card p-10 rounded-2xl border border-slate-200 dark:border-border-subtle text-center shadow-lg">
                            <button
                                onClick={handleRunAnalysis}
                                disabled={!isReady || uploading}
                                className={`px-16 py-4 font-black rounded-xl flex items-center justify-center gap-3 mx-auto uppercase tracking-wide transition-all ${isReady && !uploading
                                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-105'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <FiActivity className="animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <FiZap /> Run AI Matching Engine
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-gray-500 mt-6 uppercase tracking-[0.2em]">
                                Estimated time: ~5 seconds
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
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border-subtle animate-fade-in-up max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <FiShield className="text-primary" size={20} />
                                <h3 className="font-bold text-white text-lg">Data & Privacy Policy</h3>
                            </div>
                            <button onClick={() => setShowPolicy(false)} className="text-gray-500 hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-400 leading-relaxed">
                            <p><strong className="text-white">1. Data Encryption:</strong> All files uploaded to RecruitAI are encrypted using AES-256 standards both in transit and at rest.</p>
                            <p><strong className="text-white">2. Automatic Deletion:</strong> Candidate resumes and job descriptions are stored in a temporary holding area for analysis. Unless explicitly saved to the "Candidates" permanent database by a recruiter, all raw files are automatically purged from our servers after 24 hours.</p>
                            <p><strong className="text-white">3. Ethical AI:</strong> Our matching algorithms are audited for bias. We do not use PII (Personally Identifiable Information) such as name, gender, or age in the decision-making logic of the relevance score.</p>
                            <p><strong className="text-white">4. GDPR Compliance:</strong> You maintain full ownership of your data. You may request a full data export or deletion at any time via the Settings panel.</p>
                        </div>
                        <div className="p-6 border-t border-border-subtle flex justify-end">
                            <button onClick={() => setShowPolicy(false)} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors">
                                I Understand
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
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer h-48 flex flex-col justify-center items-center ${file ? 'border-green-500/30 bg-green-500/5' : 'border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-bg-deep/40 hover:bg-primary/5 hover:border-primary/50'
                }`}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                onChange={onChange}
            />

            {file ? (
                <div className="flex flex-col items-center text-green-400 animate-fade-in">
                    <FiFileText className="text-4xl mb-2" />
                    <p className="text-sm font-bold text-white max-w-[200px] truncate">{file.name}</p>
                    <p className="text-xs text-green-500 mt-1">Ready for analysis</p>
                    <button className="mt-4 px-4 py-1.5 bg-bg-card border border-green-500/30 rounded-lg text-xs font-semibold hover:text-white transition-colors">
                        Change File
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <FiUploadCloud className="text-primary text-4xl mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{hint}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">{sub}</p>
                    <button className="mt-5 px-5 py-2 bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-lg text-xs font-semibold hover:border-primary/50 hover:text-blue-600 dark:hover:text-white transition-colors">
                        Browse Files
                    </button>
                </div>
            )}
        </div>
    );
}

function UploadCard({ title, icon, hint, sub, accept, onChange, file }) {
    return (
        <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-xl hover:border-primary/30 transition-colors group">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                {file && (
                    <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded flex items-center gap-1 animate-fade-in">
                        <FiCheck /> Uploaded
                    </span>
                )}
            </div>
            <UploadArea hint={hint} sub={sub} accept={accept} onChange={onChange} file={file} />
        </div>
    );
}

function TipsPanel() {
    return (
        <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm">
            <h4 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2 text-sm">
                <FiSun className="text-primary" />
                Pro Tips for Accuracy
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Text-based PDFs yield higher accuracy than scanned resumes. Ensure the file is not password protected.
            </p>
        </div>
    );
}

function SecurityPanel({ onOpenPolicy }) {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm"><FiCheck className="bg-white/20 rounded-full p-0.5" /> GDPR Compliant</h4>
                <p className="text-[10px] text-white/80 leading-relaxed">
                    All documents are encrypted via AES-256 and auto-deleted after 24h.
                </p>
                <div
                    onClick={onOpenPolicy}
                    className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:underline"
                >
                    Read Data Policy <FiArrowRight />
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
    );
}

function RecentPanel({ history, onJobClick }) {
    const navigate = useNavigate();

    return (
        <div className="p-6 bg-white/60 dark:bg-bg-card/40 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    Recently Analyzed
                </p>
                <span onClick={() => navigate('/candidates')} className="text-[10px] text-primary cursor-pointer hover:underline">View All</span>
            </div>

            <div className="space-y-3">
                {history && history.length > 0 ? (
                    history.slice(0, 3).map((item, idx) => (
                        <div
                            onClick={() => onJobClick(item.job_id)}
                            className="flex justify-between items-center text-sm text-slate-700 dark:text-gray-300 py-2 border-b border-slate-200 dark:border-border-subtle/50 last:border-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 rounded px-2 -mx-2 transition-colors group"
                        >
                            <span className="flex items-center gap-2 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'success' || item.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                <span className="truncate max-w-[150px] group-hover:text-blue-600 dark:group-hover:text-white transition-colors">{item.jd_filename || item.filename || 'Untitled Analysis'}</span>
                            </span>
                            <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-xs text-gray-500">
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}
