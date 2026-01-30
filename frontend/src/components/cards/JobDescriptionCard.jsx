import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiFileText, FiTrash2, FiPaperclip, FiEdit3 } from 'react-icons/fi';
import { BsFileEarmarkText } from 'react-icons/bs';

const JobDescriptionCard = ({ jdFile, setJdFile, jdText, setJdText }) => {
    const [jdMode, setJdMode] = useState('upload'); // 'upload' or 'text'

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) setJdFile(acceptedFiles[0]);
    }, [setJdFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }
    });

    return (
        <div className="bg-[#151A23] border border-[#272E3B] rounded-2xl p-6 flex flex-col h-full card-base relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <BsFileEarmarkText className="text-xl" />
                    </div>
                    <h3 className="font-bold text-white">Job Description</h3>
                </div>

                {/* Toggle Switch */}
                <div className="flex bg-[#1F2937] p-1 rounded-lg border border-[#272E3B]">
                    <button
                        onClick={() => setJdMode('upload')}
                        className={`p-1.5 rounded transition-all ${jdMode === 'upload' ? 'bg-[#272E3B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Upload File"
                    >
                        <FiPaperclip />
                    </button>
                    <button
                        onClick={() => setJdMode('text')}
                        className={`p-1.5 rounded transition-all ${jdMode === 'text' ? 'bg-[#272E3B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Paste Text"
                    >
                        <FiEdit3 />
                    </button>
                </div>
            </div>

            {jdMode === 'upload' ? (
                <div
                    {...getRootProps()}
                    className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer min-h-[240px]
            ${isDragActive ? 'border-[#10B981] bg-[#10B981]/5' : 'border-[#272E3B] hover:border-[#10B981]/50 hover:bg-[#1F2937]'}`}
                >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 bg-[#1F2937] rounded-full flex items-center justify-center mb-4 text-[#10B981]">
                        <FiFileText className="text-2xl" />
                    </div>
                    {!jdFile ? (
                        <>
                            <p className="font-semibold text-white mb-1">Upload JD File</p>
                            <p className="text-xs text-slate-500 mb-6">Supports TXT, PDF</p>
                            <button className="bg-[#1F2937] hover:bg-[#374151] text-white text-sm font-medium py-2 px-6 rounded-lg border border-[#374151] transition-all">
                                Browse
                            </button>
                        </>
                    ) : (
                        <div className="text-center w-full">
                            <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-4 mb-3">
                                <p className="text-emerald-400 font-bold truncate">{jdFile.name}</p>
                                <p className="text-xs text-emerald-500/70 mt-1">Ready for analysis</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setJdFile(null) }} className="text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 mx-auto">
                                <FiTrash2 /> Remove
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste job description text here including requirements, skills, and qualifications..."
                        className="flex-1 w-full bg-[#0B0E14] border border-[#272E3B] rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-[#10B981] resize-none mb-2 placeholder-slate-600 font-mono leading-relaxed"
                    ></textarea>
                    <div className="text-right text-[10px] text-slate-500">
                        {jdText.length} characters
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDescriptionCard;
