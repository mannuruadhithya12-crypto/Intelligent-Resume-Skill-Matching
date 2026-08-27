import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { scheduleInterview, getGoogleStatus } from '../api';

const DURATIONS = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
];

function getBrowserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

function getTimezoneAbbr(tz) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        return tzPart ? tzPart.value : tz;
    } catch {
        return tz;
    }
}

function computeEndTime(hour, minute, period, durationMinutes) {
    if (!hour || !minute || !period || !durationMinutes) return '';
    let h = parseInt(hour, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const totalMin = h * 60 + parseInt(minute, 10) + durationMinutes;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    const display12 = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH;
    return `${display12}:${endM.toString().padStart(2, '0')} ${endPeriod}`;
}

export default function InterviewModal({ candidate, jobId, onClose, onSuccess }) {
    const modalRef = useRef(null);

    // Body scroll lock
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = originalStyle; };
    }, []);

    // State
    const [date, setDate] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [period, setPeriod] = useState('');
    const [duration, setDuration] = useState(30);
    const [format, setFormat] = useState('video');
    const [meetingProvider, setMeetingProvider] = useState('google_meet');
    const [phone, setPhone] = useState(candidate?.phone || '');
    const [manualLink, setManualLink] = useState('');
    const [sendInvitation, setSendInvitation] = useState(true);
    const timezone = getBrowserTimezone();
    const tzAbbr = getTimezoneAbbr(timezone);

    // Google status
    const [googleStatus, setGoogleStatus] = useState({ connected: false, google_email: null });
    const [googleLoading, setGoogleLoading] = useState(true);

    // Submission
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    // Escape key
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape' && !loading && !successData) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, loading, successData]);

    // Fetch Google status
    useEffect(() => {
        (async () => {
            try {
                const status = await getGoogleStatus();
                setGoogleStatus(status);
            } catch {
                setGoogleStatus({ connected: false, google_email: null });
            } finally {
                setGoogleLoading(false);
            }
        })();
    }, []);

    if (!candidate) return null;

    // Derived
    const displayName = candidate.filename ? candidate.filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "Candidate";
    const candidateEmail = candidate.email || '';
    const candidatePhone = candidate.phone || phone;
    const roleTitle = Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
        ? (Array.isArray(candidate.recommended_roles[0]) ? candidate.recommended_roles[0][0] : candidate.recommended_roles[0])
        : "Candidate";
    const minDate = new Date().toISOString().split('T')[0];
    const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const formattedTime = hour && minute && period ? `${hour}:${minute} ${period}` : '';
    const endTime = computeEndTime(hour, minute, period, duration);

    // Validation
    const isPhoneDigits = (candidatePhone || '').replace(/[^0-9]/g, '').length >= 10;
    const isManualLinkValid = manualLink.startsWith('http://') || manualLink.startsWith('https://');

    const isValid = (() => {
        if (!date || !hour || !minute || !period) return false;
        if (format === 'phone') {
            return isPhoneDigits;
        }
        if (format === 'video') {
            if (meetingProvider === 'google_meet') {
                return googleStatus.connected && !!candidateEmail;
            }
            if (meetingProvider === 'manual') {
                return !!manualLink && isManualLinkValid;
            }
        }
        return false;
    })();

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid || loading) return;

        setLoading(true);
        setError(null);

        let h = parseInt(hour, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const apiTime = `${h.toString().padStart(2, '0')}:${minute}`;

        const payload = {
            job_id: jobId,
            candidate_name: candidate.filename,
            date,
            time: apiTime,
            meeting_type: format,
            duration_minutes: duration,
            timezone,
            candidate_email: candidateEmail || null,
            candidate_phone: candidatePhone || null,
            meeting_provider: format === 'video' ? meetingProvider : 'none',
            meeting_link: format === 'video' && meetingProvider === 'manual' ? manualLink : null,
            send_invitation: sendInvitation,
        };

        try {
            const result = await scheduleInterview(payload);
            setSuccessData(result);
            setLoading(false);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail || "Unable to schedule interview. Please try again.");
            setLoading(false);
        }
    };

    const handleDone = () => {
        if (onSuccess) onSuccess(successData);
        else onClose();
    };

    const copyMeetingLink = () => {
        const link = successData?.interview?.meeting_link;
        if (link) navigator.clipboard.writeText(link);
    };

    // ── Render ──

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
            style={{ background: 'rgba(24,29,26,0.48)', backdropFilter: 'blur(2px)' }}
            onClick={(e) => { if (e.target === e.currentTarget && !loading && !successData) onClose(); }}
        >
            <div
                ref={modalRef}
                className="bg-[#FFFDF9] border border-[#E5DED4] w-full max-w-[640px] rounded-[20px] flex flex-col relative z-[110]"
                style={{ width: 'min(640px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 48px)', boxShadow: '0 24px 70px rgba(33,31,27,.18)' }}
                role="dialog" aria-modal="true" aria-labelledby="interview-modal-title"
            >
                {/* ─── HEADER ─── */}
                <div className="flex-shrink-0 px-7 py-5 border-b border-[#E5DED4] bg-[#FFFDF9] rounded-t-[20px] flex justify-between items-start">
                    <div>
                        <h2 id="interview-modal-title" className="text-[26px] font-serif font-semibold text-[#211F1B] leading-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#3F7655] text-[28px]">calendar_month</span>
                            Schedule Interview
                        </h2>
                        <p className="text-[14px] text-[#746E66] mt-1">Set up an interview and send the candidate an invitation.</p>
                    </div>
                    {!loading && !successData && (
                        <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2EEE7] active:bg-[#E9E3DA] transition-all text-[#211F1B] focus:outline-none focus:ring-2 focus:ring-[#3F7655]/40 mt-1">
                            <span className="material-symbols-outlined text-[22px]">close</span>
                        </button>
                    )}
                </div>

                {/* ─── BODY (scrollable) ─── */}
                <div className="flex-1 overflow-y-auto min-h-0 px-7 py-6">

                    {/* ══ SUCCESS STATE ══ */}
                    {successData ? (
                        <div className="flex flex-col items-center py-6 text-center animate-fade-in-up">
                            <div className="w-16 h-16 bg-[#EDF5E8] rounded-full flex items-center justify-center mb-5 border border-[#C9DEC2]">
                                <span className="material-symbols-outlined text-[32px] text-[#3F7655]">check</span>
                            </div>
                            <h3 className="text-[22px] font-serif font-bold text-[#211F1B] mb-2">Interview Scheduled</h3>
                            <p className="text-[14px] text-[#746E66] mb-6">The interview has been scheduled successfully.</p>

                            <div className="bg-white border border-[#E5DED4] rounded-xl p-5 w-full max-w-sm text-left space-y-3 mb-6">
                                <div>
                                    <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-wider mb-0.5">Candidate</div>
                                    <div className="text-[14px] font-semibold text-[#211F1B]">{displayName}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-wider mb-0.5">Date & Time</div>
                                    <div className="text-[14px] text-[#211F1B]">{formattedDate}</div>
                                    <div className="text-[13px] text-[#514C45]">{formattedTime} – {endTime} {tzAbbr}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-wider mb-0.5">Format</div>
                                    <div className="flex items-center gap-1.5 text-[14px] text-[#211F1B]">
                                        <span className="material-symbols-outlined text-[16px] text-[#3F7655]">{format === 'phone' ? 'call' : 'videocam'}</span>
                                        {format === 'phone' ? 'Phone' : meetingProvider === 'google_meet' ? 'Google Meet' : 'Video meeting'}
                                    </div>
                                </div>

                                {successData?.interview?.meeting_link && (
                                    <div>
                                        <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-wider mb-1">Meeting Link</div>
                                        <div className="flex items-center gap-2">
                                            <a href={successData.interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#3F7655] underline truncate max-w-[240px]">{successData.interview.meeting_link}</a>
                                            <button onClick={copyMeetingLink} className="text-[12px] px-2.5 py-1 bg-[#F7F3EC] rounded-md hover:bg-[#EAE4DB] text-[#514C45] font-semibold flex items-center gap-1 transition-colors" title="Copy link">
                                                <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {successData?.interview?.invitation_status === 'sent' && candidateEmail && (
                                    <div className="flex items-center gap-2 pt-1 text-[13px] text-[#3F7655]">
                                        <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
                                        Invitation sent to {candidateEmail}
                                    </div>
                                )}
                            </div>

                            {successData?.interview?.meeting_link && (
                                <a href={successData.interview.meeting_link} target="_blank" rel="noopener noreferrer"
                                    className="h-[40px] px-5 mb-3 bg-white border border-[#3F7655] text-[#3F7655] text-[13px] font-semibold rounded-[10px] hover:bg-[#EDF5E8] transition-all inline-flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open Meeting
                                </a>
                            )}

                            <button onClick={handleDone} className="h-[44px] px-8 bg-[#3F7655] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#315F44] transition-all">
                                Done
                            </button>
                        </div>
                    ) : (
                        /* ══ FORM ══ */
                        <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">

                            {error && (
                                <div className="p-4 bg-[#FFF4F4] text-[#C63B3B] border border-[#F2D7D7] rounded-[10px] text-[14px] font-medium flex items-start gap-2">
                                    <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">error</span>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* ── Candidate Card ── */}
                            <div className="bg-white border border-[#E5DED4] rounded-[12px] p-4 flex items-center gap-4 shadow-sm">
                                <div className="w-11 h-11 rounded-full bg-[#F0E9E1] flex items-center justify-center flex-shrink-0 border border-[#E5DED4] text-[#746E66] font-semibold text-[14px]">
                                    {displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[15px] font-semibold text-[#211F1B] leading-tight">{displayName}</div>
                                    <div className="text-[13px] text-[#706A62] mt-0.5">{roleTitle}</div>
                                    {candidateEmail && (
                                        <div className="text-[12px] text-[#9B958D] mt-0.5 flex items-center gap-1 truncate">
                                            <span className="material-symbols-outlined text-[14px]">mail</span> {candidateEmail}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Format Selection ── */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">Interview Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => { setFormat('phone'); setMeetingProvider('none'); }}
                                        className={`flex items-start gap-3 p-4 rounded-[12px] text-left transition-all border ${format === 'phone' ? 'bg-[#EDF5E8] border-[#3F7655] shadow-[0_2px_8px_rgba(63,118,85,0.12)]' : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'}`}>
                                        <span className={`material-symbols-outlined mt-0.5 ${format === 'phone' ? 'text-[#3F7655]' : 'text-[#746E66]'}`}>call</span>
                                        <div>
                                            <div className={`text-[14px] font-semibold mb-0.5 ${format === 'phone' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Phone</div>
                                            <div className="text-[12px] text-[#746E66]">Voice interview</div>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => { setFormat('video'); setMeetingProvider(googleStatus.connected ? 'google_meet' : 'manual'); }}
                                        className={`flex items-start gap-3 p-4 rounded-[12px] text-left transition-all border ${format === 'video' ? 'bg-[#EDF5E8] border-[#3F7655] shadow-[0_2px_8px_rgba(63,118,85,0.12)]' : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'}`}>
                                        <span className={`material-symbols-outlined mt-0.5 ${format === 'video' ? 'text-[#3F7655]' : 'text-[#746E66]'}`}>videocam</span>
                                        <div>
                                            <div className={`text-[14px] font-semibold mb-0.5 ${format === 'video' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Video Interview</div>
                                            <div className="text-[12px] text-[#746E66]">Google Meet / Custom</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* ── VIDEO: Meeting Provider ── */}
                            {format === 'video' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">Meeting Provider</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setMeetingProvider('google_meet')}
                                            className={`p-3 rounded-[10px] text-left transition-all border flex items-center gap-3 ${meetingProvider === 'google_meet' ? 'bg-[#EDF5E8] border-[#3F7655]' : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'}`}>
                                            <span className="text-[20px]">🎥</span>
                                            <div>
                                                <div className={`text-[13px] font-semibold ${meetingProvider === 'google_meet' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Google Meet</div>
                                                <div className="text-[11px] text-[#9B958D]">Auto-created</div>
                                            </div>
                                        </button>
                                        <button type="button" onClick={() => setMeetingProvider('manual')}
                                            className={`p-3 rounded-[10px] text-left transition-all border flex items-center gap-3 ${meetingProvider === 'manual' ? 'bg-[#EDF5E8] border-[#3F7655]' : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'}`}>
                                            <span className="material-symbols-outlined text-[20px] text-[#746E66]">link</span>
                                            <div>
                                                <div className={`text-[13px] font-semibold ${meetingProvider === 'manual' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Custom Link</div>
                                                <div className="text-[11px] text-[#9B958D]">Paste your own</div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Google Meet status messages */}
                                    {meetingProvider === 'google_meet' && !googleLoading && (
                                        <div className="mt-3">
                                            {googleStatus.connected ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[12px] text-[#3F7655] font-medium">
                                                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Google Calendar connected
                                                    </div>
                                                    {candidateEmail ? (
                                                        <div className="flex items-center gap-1.5 text-[12px] text-[#3F7655] font-medium">
                                                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Invitation will be sent to {candidateEmail}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[12px] text-[#C63B3B] font-medium">
                                                            <span className="material-symbols-outlined text-[14px]">error</span> Candidate email unavailable — cannot send invitation
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-[#FFF8F0] border border-[#F0DCC8] rounded-[10px]">
                                                    <div className="flex items-start gap-2 text-[13px] text-[#8B6914]">
                                                        <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
                                                        <div>
                                                            <p className="font-semibold mb-1">Google Calendar not connected</p>
                                                            <p className="text-[12px] text-[#A07D2E]">Go to Settings → Integrations to connect your Google Calendar, or use a custom link instead.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Manual link input */}
                                    {meetingProvider === 'manual' && (
                                        <div className="mt-3">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="material-symbols-outlined text-[#9B958D] text-[18px]">link</span>
                                                </div>
                                                <input type="url" value={manualLink} onChange={(e) => setManualLink(e.target.value)}
                                                    placeholder="Paste meeting link (e.g. https://meet.google.com/...)"
                                                    className={`w-full h-[44px] pl-10 pr-4 bg-white border ${manualLink && !isManualLinkValid ? 'border-[#C63B3B]' : 'border-[#DCD5CC] focus:border-[#3F7655]'} rounded-[10px] text-[14px] text-[#211F1B] placeholder-[#9B958D] focus:outline-none focus:ring-[3px] focus:ring-[#3F7655]/20 transition-all`} />
                                            </div>
                                            {manualLink && !isManualLinkValid && (
                                                <p className="mt-1 text-[12px] text-[#C63B3B] font-medium">Please enter a valid URL.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PHONE: Phone Number ── */}
                            {format === 'phone' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-[#9B958D] text-[18px]">phone_enabled</span>
                                        </div>
                                        <input type="tel" value={phone || candidatePhone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter phone number"
                                            className={`w-full h-[44px] pl-10 pr-4 bg-white border ${(phone || candidatePhone) && !isPhoneDigits ? 'border-[#C63B3B]' : 'border-[#DCD5CC] focus:border-[#3F7655]'} rounded-[10px] text-[14px] text-[#211F1B] placeholder-[#9B958D] focus:outline-none focus:ring-[3px] focus:ring-[#3F7655]/20 transition-all`} />
                                    </div>
                                    {(phone || candidatePhone) && !isPhoneDigits && (
                                        <p className="mt-1 text-[12px] text-[#C63B3B] font-medium">Please enter a valid phone number (minimum 10 digits).</p>
                                    )}
                                </div>
                            )}

                            {/* ── Date / Time / Duration ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">Interview Date</label>
                                    <input type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)}
                                        className="w-full h-[44px] bg-white border border-[#DCD5CC] rounded-[10px] px-4 text-[14px] font-medium text-[#211F1B] hover:bg-[#F8F4EE] focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 transition-all cursor-pointer"
                                        style={{ color: date ? '#211F1B' : '#9B958D' }} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                        Interview Time <span className="normal-case tracking-normal font-normal text-[#9B958D] ml-1">{tzAbbr}</span>
                                    </label>
                                    <div className="flex gap-1.5">
                                        <select value={hour} onChange={(e) => setHour(e.target.value)}
                                            className="flex-1 h-[44px] bg-white border border-[#DCD5CC] rounded-[10px] px-1 text-[14px] font-medium text-center focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 cursor-pointer appearance-none"
                                            style={{ color: hour ? '#211F1B' : '#9B958D' }}>
                                            <option value="" disabled>HH</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="flex items-center text-[#211F1B] font-bold text-[16px]">:</span>
                                        <select value={minute} onChange={(e) => setMinute(e.target.value)}
                                            className="flex-1 h-[44px] bg-white border border-[#DCD5CC] rounded-[10px] px-1 text-[14px] font-medium text-center focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 cursor-pointer appearance-none"
                                            style={{ color: minute ? '#211F1B' : '#9B958D' }}>
                                            <option value="" disabled>MM</option>
                                            <option value="00">00</option><option value="15">15</option>
                                            <option value="30">30</option><option value="45">45</option>
                                        </select>
                                        <div className="flex rounded-[10px] overflow-hidden border border-[#DCD5CC]">
                                            <button type="button" onClick={() => setPeriod('AM')}
                                                className={`px-3 h-[44px] text-[12px] font-bold transition-colors ${period === 'AM' ? 'bg-[#3F7655] text-white' : 'bg-[#F7F3EC] text-[#514C45] hover:bg-[#EAE4DB]'}`}>AM</button>
                                            <button type="button" onClick={() => setPeriod('PM')}
                                                className={`px-3 h-[44px] text-[12px] font-bold transition-colors border-l border-[#DCD5CC] ${period === 'PM' ? 'bg-[#3F7655] text-white border-l-transparent' : 'bg-[#F7F3EC] text-[#514C45] hover:bg-[#EAE4DB]'}`}>PM</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Duration ── */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">Duration</label>
                                <div className="flex flex-wrap gap-2">
                                    {DURATIONS.map(d => (
                                        <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                                            className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all border ${duration === d.value ? 'bg-[#3F7655] text-white border-[#3F7655]' : 'bg-white border-[#DED7CE] text-[#514C45] hover:bg-[#F7F3EC]'}`}>
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Summary ── */}
                            {isValid && (
                                <div className="bg-[#F7F3EC] border border-[#E5DED4] rounded-[12px] p-4 animate-fade-in">
                                    <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-[0.08em] mb-2">Interview Summary</div>
                                    <div className="space-y-1 text-[14px]">
                                        <div className="font-medium text-[#211F1B]">{formattedDate}</div>
                                        <div className="text-[#514C45]">{formattedTime} – {endTime} {tzAbbr}</div>
                                        <div className="text-[#746E66] text-[13px] flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-[14px]">{format === 'phone' ? 'call' : 'videocam'}</span>
                                            {format === 'phone' ? 'Phone interview' : meetingProvider === 'google_meet' ? 'Google Meet' : 'Video meeting'}
                                            <span className="text-[#D9D2C8] mx-1">·</span>
                                            {duration} min
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* ─── FOOTER ─── */}
                {!successData && (
                    <div className="flex-shrink-0 px-7 py-5 bg-[#FFFDF9] border-t border-[#E5DED4] rounded-b-[20px] flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={loading}
                            className="h-[44px] px-5 bg-white border border-[#D9D2C8] text-[#24221E] text-[14px] font-semibold rounded-[10px] hover:bg-[#F3EFE8] active:bg-[#EAE4DB] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            Cancel
                        </button>
                        <button type="submit" form="schedule-form" disabled={!isValid || loading}
                            className="h-[44px] px-6 bg-[#3F7655] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#315F44] active:bg-[#284D38] transition-all disabled:bg-[#E7E2DB] disabled:text-[#9B958D] disabled:cursor-not-allowed flex items-center gap-2 shadow-sm disabled:shadow-none">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Scheduling...
                                </>
                            ) : (
                                format === 'video' && meetingProvider === 'google_meet'
                                    ? 'Schedule & Send Invitation'
                                    : 'Confirm Booking'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
