import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiFileText, FiTrash2, FiPaperclip, FiEdit3 } from 'react-icons/fi';
import { BsFileEarmarkText } from 'react-icons/bs';

const JobDescriptionCard = ({ jdFile, setJdFile, jdText, setJdText }) => {
    const [jdMode, setJdMode] = useState('text'); // Default to text to match intuitive flow

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) setJdFile(acceptedFiles[0]);
    }, [setJdFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }
    });

    return (
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <BsFileEarmarkText className="text-xl" />
                    </div>
                    <h3 className="font-bold text-white">Job Description</h3>
                </div>

                {/* Styled Toggle */}
                <div className="flex bg-[#0B0E14] p-1 rounded-lg border border-border-subtle">
                    <button
                        onClick={() => setJdMode('text')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${jdMode === 'text' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FiEdit3 /> Paste
                    </button>
                    <button
                        onClick={() => setJdMode('upload')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${jdMode === 'upload' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FiPaperclip /> Upload
                    </button>
                </div>
            </div>

            {jdMode === 'upload' ? (
                <div
                    {...getRootProps()}
                    className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer min-h-[220px] group
            ${isDragActive ? 'border-[#10B981] bg-[#10B981]/5' : 'border-border-subtle hover:border-[#10B981]/40 hover:bg-[#1F2937]/50'}`}
                >
                    <input {...getInputProps()} />
                    <div className="w-14 h-14 bg-[#1F2937] group-hover:bg-[#283245] rounded-full flex items-center justify-center mb-4 text-[#10B981] transition-colors border border-border-subtle">
                        <FiFileText className="text-2xl" />
                    </div>

                    {!jdFile ? (
                        <>
                            <p className="font-bold text-white mb-2">Paste JD or upload file</p>
                            <p className="text-xs text-slate-500 mb-6 font-medium">Supports TXT, PDF, or text paste</p>
                            <button className="bg-[#1F2937] hover:bg-[#374151] text-white text-xs font-bold py-2.5 px-6 rounded-lg border border-[#374151] transition-all uppercase tracking-wide">
                                Paste Content
                            </button>
                        </>
                    ) : (
                        <div className="text-center w-full animate-fade-in">
                            <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 mb-4 flex items-center flex-col">
                                <FiFileText className="text-3xl text-[#10B981] mb-2" />
                                <p className="text-white font-bold truncate max-w-[200px]">{jdFile.name}</p>
                                <p className="text-[10px] text-[#10B981] mt-1 font-mono uppercase tracking-wide">Ready for Analysis</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setJdFile(null) }} className="text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 mx-auto font-bold uppercase tracking-wide">
                                <FiTrash2 /> Remove File
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col h-full">
                    <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste complete job description here..."
                        className="flex-1 w-full bg-[#0B0E14] border border-2 border-border-subtle rounded-xl p-5 text-sm text-gray-300 focus:outline-none focus:border-[#10B981] resize-none mb-2 placeholder-slate-600 font-mono leading-relaxed transition-colors"
                    ></textarea>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Plain Text Mode</span>
                        <span className={`text-[10px] font-mono ${jdText.length > 50 ? 'text-[#10B981]' : 'text-slate-600'}`}>
                            {jdText.length} chars
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDescriptionCard;
