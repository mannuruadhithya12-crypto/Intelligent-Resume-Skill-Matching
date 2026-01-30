import React from 'react';

export default function AccuracyTips() {
    return (
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
            <h4 className="font-bold mb-4 text-white flex items-center gap-2">
                <span className="text-primary">💡</span> Pro Tips for Accuracy
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex gap-3">
                    <span className="w-6 h-6 rounded bg-bg-deep flex items-center justify-center text-gray-500 text-xs flex-shrink-0">1</span>
                    <span>Use text-based PDFs for 30% better accuracy</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-6 h-6 rounded bg-bg-deep flex items-center justify-center text-gray-500 text-xs flex-shrink-0">2</span>
                    <span>Include specific technology keywords</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-6 h-6 rounded bg-bg-deep flex items-center justify-center text-gray-500 text-xs flex-shrink-0">3</span>
                    <span>Separate Must-Have vs Nice-to-Have skills</span>
                </li>
            </ul>
        </div>
    );
}
