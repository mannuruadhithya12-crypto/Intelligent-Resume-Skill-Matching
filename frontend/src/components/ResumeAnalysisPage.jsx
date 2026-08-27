import React, { useState, useRef, useEffect } from 'react';
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
        <div className="w-full animate-fade-in relative max-w-[1200px] mx-auto space-y-10">
            {/* Page Header */}
            <header className="relative max-w-2xl">
                <h2 className="text-[40px] font-serif font-bold text-text-primary tracking-tight mb-3 leading-[1.1]">
                    Start a New Journey
                </h2>
                <p className="text-[16px] text-text-secondary leading-relaxed">
                    Let's find the right people together. Upload your materials below to begin a thoughtful candidate review.
                </p>
            </header>

            {/* UPLOAD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    {/* Resume Upload Card */}
                    <div className="bg-white rounded-[20px] p-8 shadow-paper relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="size-12 rounded-full bg-[#CAECBC]/30 text-primary-sage flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px]">description</span>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-bold text-text-primary font-serif">Candidate Resumes</h3>
                                <p className="text-[13px] text-text-secondary mt-1">Upload PDF or Word documents.</p>
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
                    <div className="bg-white rounded-[20px] p-8 shadow-paper relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">work</span>
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold text-text-primary font-serif">Job Description</h3>
                                    <p className="text-[13px] text-text-secondary mt-1">Define requirements or upload JD</p>
                                </div>
                            </div>
                            <div className="flex bg-[#F5ECE7] p-1 rounded-lg self-start sm:self-auto">
                                <button
                                    onClick={() => setJdMode('upload')}
                                    className={`px-4 py-2 text-[13px] font-bold rounded-[6px] transition-all duration-200 ${jdMode === 'upload' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    Upload File
                                </button>
                                <button
                                    onClick={() => setJdMode('text')}
                                    className={`px-4 py-2 text-[13px] font-bold rounded-[6px] transition-all duration-200 ${jdMode === 'text' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
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
                            <div className="border border-[#E9E1DC] rounded-[16px] p-4 bg-page focus-within:ring-2 focus-within:ring-terracotta/30 transition-colors h-56 relative group/text">
                                <textarea
                                    value={jdText}
                                    onChange={(e) => setJdText(e.target.value)}
                                    placeholder="Paste the full job description here..."
                                    className="w-full h-full bg-transparent border-none outline-none text-[14px] text-text-primary placeholder-outline resize-none leading-relaxed"
                                />
                                <div className="absolute bottom-4 right-4 text-[12px] text-outline group-focus-within/text:text-text-secondary transition-colors">
                                    {jdText.length} chars
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleRunAnalysis}
                            disabled={!isReady || uploading}
                            className={`w-full h-[60px] font-semibold text-[16px] rounded-full flex items-center justify-center gap-3 transition-all duration-300 ${isReady && !uploading
                                ? 'bg-[#3F7655] text-white border border-[#3F7655] shadow-md hover:bg-[#315F44] active:translate-y-[1px] focus:ring-2 focus:ring-[#3F7655]/50 focus:outline-none cursor-pointer opacity-100'
                                : 'bg-[#E9E1DC] text-outline cursor-not-allowed opacity-50'
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span> 
                                    Reviewing your candidates...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[24px]">magic_button</span> 
                                    Begin Thoughtful Review
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL - Side Widgets */}
                <aside className="lg:col-span-4 space-y-6">
                    <RecentPanel history={recentHistory} onJobClick={onAnalysisStart} />
                    <SecurityPanel onOpenPolicy={() => setShowPolicy(true)} />
                </aside>
            </div>

            {/* DATA POLICY MODAL */}
            {showPolicy && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[24px] shadow-paper animate-fade-in-up flex flex-col overflow-hidden relative">
                        <div className="p-6 border-b border-[#E9E1DC] flex justify-between items-center bg-[#F5ECE7]/50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-white rounded-full flex items-center justify-center text-primary-sage shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">shield</span>
                                </div>
                                <h3 className="font-serif font-bold text-text-primary text-[18px]">Privacy & Security</h3>
                            </div>
                            <button onClick={() => setShowPolicy(false)} className="text-outline hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 text-[14px] text-text-secondary leading-relaxed">
                            <p><strong className="text-text-primary font-bold block mb-1">1. Respectful Processing</strong> All files uploaded to RecruitAI are processed securely and respectfully.</p>
                            <p><strong className="text-text-primary font-bold block mb-1">2. Data Sovereignty</strong> Candidate resumes and job descriptions are stored temporarily for analysis.</p>
                            <p><strong className="text-text-primary font-bold block mb-1">3. Objective Matching</strong> Our algorithms focus on skills and experience, stripping away identifying factors during the initial match logic.</p>
                        </div>
                        <div className="p-6 border-t border-[#E9E1DC] bg-[#F5ECE7]/50 flex justify-end">
                            <button onClick={() => setShowPolicy(false)} className="px-6 py-3 bg-primary-sage text-white font-bold rounded-full hover:bg-primary-container transition-colors shadow-sm">
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
            className={`group/upload border-2 border-dashed rounded-[16px] p-6 text-center transition-all duration-300 flex flex-col items-center relative overflow-hidden min-h-[220px] ${files && files.length > 0 ? 'border-[#CAECBC] bg-[#CAECBC]/10' : 'border-[#E9E1DC] bg-[#F5ECE7]/50 hover:bg-[#F5ECE7] hover:border-outline-variant cursor-pointer'
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
                <div className="w-full relative z-10 h-full flex flex-col pt-2">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-[14px] font-bold text-primary-sage flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span> {files.length} {files.length === 1 ? 'Document' : 'Documents'} Attached
                        </span>
                        {!multiple && !uploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(0); }}
                                className="text-outline hover:text-error p-1 transition-all duration-200 bg-white hover:bg-error/10 rounded-full shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 styled-scrollbar max-h-40 mb-4 text-left">
                        {Array.from(files).map((file, idx) => (
                            <div key={idx} className="bg-white border border-[#E9E1DC] p-3 rounded-[12px] flex items-center justify-between shadow-sm hover:border-outline-variant transition-all duration-200">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-[#F5ECE7] rounded-lg text-text-secondary"><span className="material-symbols-outlined text-[18px]">description</span></div>
                                    <div className="truncate">
                                        <p className="text-[13px] text-text-primary font-bold truncate">{file.name}</p>
                                        <p className="text-[11px] text-text-secondary mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {multiple && !uploading && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                                        className="text-outline hover:text-error p-2 rounded-full hover:bg-error/10 transition-all duration-200"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {multiple && !uploading && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClick(); }}
                            className="w-full py-3 bg-white border border-[#E9E1DC] rounded-[12px] text-[13px] font-bold text-text-secondary hover:text-primary-sage hover:border-[#CAECBC] transition-all duration-200 mt-auto flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span> Add More Documents
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full relative z-10 my-auto pointer-events-none">
                    <div className="size-14 bg-white border border-[#E9E1DC] shadow-sm rounded-full flex items-center justify-center mb-4 transition-all duration-300">
                        <span className="material-symbols-outlined text-[28px] text-outline group-hover/upload:text-terracotta transition-colors">cloud_upload</span>
                    </div>
                    <p className="text-[16px] font-bold text-text-primary">{hint}</p>
                    <p className="text-[13px] text-text-secondary mt-1">{sub}</p>

                    <div className="mt-6 px-6 py-2.5 rounded-full bg-white border border-[#E9E1DC] text-text-primary text-[13px] font-bold shadow-sm transition-all duration-200 flex items-center gap-2">
                        Browse Files
                    </div>
                </div>
            )}
        </div>
    );
}

function SecurityPanel({ onOpenPolicy }) {
    return (
        <div className="bg-[#F5ECE7] border border-[#E9E1DC] p-6 rounded-[20px] overflow-hidden relative">
            <div className="relative z-10">
                <h4 className="font-serif font-bold mb-2 flex items-center gap-2 text-[16px] text-text-primary">
                    <span className="material-symbols-outlined text-terracotta text-[20px]">shield</span> Trusted Security
                </h4>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
                    Your data is handled with care. Objective algorithms and secure ephemeral processing.
                </p>
                <button
                    onClick={onOpenPolicy}
                    className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-terracotta hover:text-terracotta-light transition-colors"
                >
                    View Guidelines <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}

function RecentPanel({ history, onJobClick }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white border border-[#E9E1DC] shadow-paper p-6 rounded-[20px]">
            <div className="flex justify-between items-center mb-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">
                    Recent Activity
                </p>
                <button onClick={() => navigate('/history')} className="text-[11px] text-primary-sage font-bold hover:text-primary-container transition-colors uppercase tracking-wider">View All</button>
            </div>

            <div className="space-y-2">
                {history && history.length > 0 ? (
                    history.slice(0, 4).map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => onJobClick(item.job_id)}
                            className="flex justify-between items-center p-3 bg-page hover:bg-[#F5ECE7] rounded-[12px] cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`size-2 rounded-full flex-shrink-0 ${item.status === 'success' || item.status === 'completed' ? 'bg-[#4A6741]' : 'bg-terracotta'}`}></div>
                                <span className="text-[13px] text-text-primary font-medium truncate group-hover:text-primary-sage transition-colors">{item.jd_filename || item.filename || 'Untitled Review'}</span>
                            </div>
                            <span className="text-[11px] text-text-secondary font-mono bg-white px-2 py-1 rounded-md shadow-sm border border-[#E9E1DC]">
                                {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-[13px] text-outline italic bg-page rounded-[12px]">
                        No recent history
                    </div>
                )}
            </div>
        </div>
    );
}
