import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiCheckCircle, FiFile, FiX } from 'react-icons/fi';
import { BsFileEarmarkPdf } from 'react-icons/bs';

const ResumeUploadCard = ({ resumes = [], setResumes }) => {
    const onDrop = useCallback((acceptedFiles) => {
        setResumes((prev) => [...prev, ...acceptedFiles]);
    }, [setResumes]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    });

    const removeFile = (index) => {
        setResumes(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle h-full flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] shadow-[0_0_10px_rgba(79,70,229,0.2)]">
                    <BsFileEarmarkPdf className="text-xl" />
                </div>
                <h3 className="font-bold text-white">Candidate Resume</h3>
            </div>

            <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer min-h-[220px] group
          ${isDragActive ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-border-subtle hover:border-[#4F46E5]/40 hover:bg-[#1F2937]/50'}`}
            >
                <input {...getInputProps()} />
                <div className="w-14 h-14 bg-[#1F2937] group-hover:bg-[#283245] rounded-full flex items-center justify-center mb-4 text-[#4F46E5] transition-colors border border-border-subtle">
                    <FiUploadCloud className="text-2xl" />
                </div>
                <p className="font-bold text-white mb-2">Drop PDF or DOCX here</p>
                <p className="text-xs text-slate-500 mb-6 font-medium">Maximum file size 10MB</p>
                <button className="bg-[#1F2937] hover:bg-[#374151] text-white text-xs font-bold py-2.5 px-6 rounded-lg border border-[#374151] transition-all uppercase tracking-wide">
                    Browse Files
                </button>
            </div>

            {resumes.length > 0 && (
                <div className="mt-4 space-y-2 animate-fade-in">
                    {resumes.map((file, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-3 bg-[#0B0E14] rounded-lg border border-border-subtle group relative">
                            <div className="flex items-center gap-3 truncate">
                                <FiCheckCircle className="text-emerald-500 flex-shrink-0" />
                                <span className="text-slate-300 truncate font-medium">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-600 font-mono">{(file.size / 1024).toFixed(0)} KB</span>
                                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 p-1"><FiX /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumeUploadCard;
