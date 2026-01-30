import React from 'react';

const AccuracyTips = () => {
    return (
        <div className="bg-[#151A23] border border-[#272E3B] rounded-2xl p-6 hover:border-[#6366F1]/30 transition-colors">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-[#4F46E5] text-lg">💡</span> Pro Tips for Accuracy
            </h3>

            <div className="space-y-6">
                <TipItem
                    icon="❝"
                    title="Format matters"
                    text="Text-based PDFs are 30% more accurate than scanned images."
                />
                <TipItem
                    icon="🔑"
                    title="Include Keywords"
                    text="The AI looks for specific technology stacks and soft skill mentions."
                />
                <TipItem
                    icon="⚖️"
                    title="Job Requirements"
                    text="Highlight 'Must Have' vs 'Nice to Have' for better weighting."
                />
            </div>
        </div>
    );
};

const TipItem = ({ icon, title, text }) => (
    <div className="flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#1F2937] flex-shrink-0 flex items-center justify-center text-slate-400 font-serif border border-[#272E3B]">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-sm text-slate-200 mb-1">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
        </div>
    </div>
);

export default AccuracyTips;
