import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiCheckCircle } from 'react-icons/fi';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeUploadCard = ({ resumes, setResumes }) => {
    const onDrop = useCallback((acceptedFiles) => {
        setResumes((prev) => [...prev, ...acceptedFiles]);
    }, [setResumes]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    });

    return (
        <div className="bg-[#151A23] border border-[#272E3B] rounded-2xl p-6 flex flex-col h-full card-base">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] shadow-[0_0_10px_rgba(79,70,229,0.2)]">
                    <BsFileEarmarkPdf className="text-xl" />
                </div>
                <h3 className="font-bold text-white">Candidate Resume</h3>
            </div>

            <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer min-h-[240px]
          ${isDragActive ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#272E3B] hover:border-[#4F46E5]/50 hover:bg-[#1F2937]'}`}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-[#1F2937] rounded-full flex items-center justify-center mb-4 text-[#4F46E5]">
                    <FiUploadCloud className="text-2xl" />
                </div>
                <p className="font-semibold text-white mb-1">Drop PDF or DOCX here</p>
                <p className="text-xs text-slate-500 mb-6">Maximum file size 10MB</p>
                <button className="bg-[#1F2937] hover:bg-[#374151] text-white text-sm font-medium py-2 px-6 rounded-lg border border-[#374151] transition-all">
                    Browse Files
                </button>
            </div>

            <AnimatePresence>
                {resumes.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-2">
                        {resumes.map((file, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-[#1F2937] rounded border border-[#272E3B] group relative overflow-hidden">
                                <div className="flex items-center gap-2 truncate">
                                    <FiCheckCircle className="text-emerald-500" />
                                    <span className="text-slate-300 truncate">{file.name}</span>
                                </div>
                                <span className="text-slate-600">{(file.size / 1024).toFixed(0)} KB</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResumeUploadCard;
