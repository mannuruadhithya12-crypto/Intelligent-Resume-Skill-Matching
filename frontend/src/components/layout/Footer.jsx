import React from 'react';

export default function Footer() {
    return (
        <footer className="border-t border-[#E9E1DC] px-8 py-8 text-xs text-outline text-center bg-page">
            © {new Date().getFullYear()} RecruitAI Enterprise. Designed for human-centric recruitment.
        </footer>
    );
}
