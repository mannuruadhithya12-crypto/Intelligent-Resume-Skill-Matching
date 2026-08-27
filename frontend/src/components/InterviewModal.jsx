import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { scheduleInterview } from '../api';

export default function InterviewModal({ candidate, jobId, onClose, onSuccess }) {
    // Body scroll lock
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const [date, setDate] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [period, setPeriod] = useState(''); // 'AM' or 'PM'
    const [format, setFormat] = useState('video'); // 'video' or 'phone'
    const [phone, setPhone] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Close on Escape unless loading
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading && !success) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, loading, success]);

    if (!candidate) return null;

    // Validation
    const isPhoneValid = phone.replace(/[^0-9]/g, '').length >= 10;
    const isLinkValid = meetingLink.startsWith('http://') || meetingLink.startsWith('https://');
    
    const isValid = date && hour && minute && period && format && 
        (format === 'phone' ? phone && isPhoneValid : true) && 
        (format === 'video' ? meetingLink && isLinkValid : true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError(null);

        // Convert 12h to 24h format for the API backward compatibility
        let h = parseInt(hour, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const apiTime = `${h.toString().padStart(2, '0')}:${minute}`;

        const payload = {
            job_id: jobId,
            candidate_name: candidate.filename,
            date: date,
            time: apiTime,
            meeting_type: format,
            phone: format === 'phone' ? phone : undefined,
            meeting_link: format === 'video' ? meetingLink : undefined,
        };

        try {
            const result = await scheduleInterview(payload);
            setSuccess(true);
            setLoading(false);
            if (onSuccess) {
                // Delay to show success screen before bubbling up
                setTimeout(() => {
                    onSuccess(result);
                }, 2000);
            }
        } catch (err) {
            console.error(err);
            setError("Unable to schedule interview. Please try again.");
            setLoading(false);
        }
    };

    const displayName = candidate.filename ? candidate.filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "Candidate";
    const minDate = new Date().toISOString().split('T')[0];
    const roleTitle = Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
        ? (Array.isArray(candidate.recommended_roles[0]) ? candidate.recommended_roles[0][0] : candidate.recommended_roles[0])
        : "Candidate";

    // Format Date for Summary (e.g. 27 Aug 2026)
    const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const formattedTimeStr = hour && minute && period ? `${hour}:${minute} ${period}` : '';

    const modalContent = (
        <div 
            className="fixed inset-0 z-[100] bg-[#181D1A]/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading && !success) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-[#FFFDF9] border border-[#E5DED4] w-full max-w-[600px] rounded-[20px] shadow-[0_24px_70px_rgba(33,31,27,0.18)] flex flex-col relative z-[110]"
                style={{ width: 'min(600px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 48px)' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="interview-title"
            >
                {/* Header */}
                <div className="flex-shrink-0 h-[88px] px-[28px] py-[20px] border-b border-[#E5DED4] bg-[#FFFDF9] rounded-t-[20px] flex justify-between items-center z-[120]">
                    <div>
                        <h2 id="interview-title" className="text-[28px] font-serif font-semibold text-[#211F1B] leading-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#3F7655]">calendar_month</span>
                            Schedule Interview
                        </h2>
                        <p className="text-[14px] text-[#746E66] mt-0.5">
                            Arrange an interview with this candidate
                        </p>
                    </div>
                    {!loading && !success && (
                        <button
                            onClick={onClose}
                            aria-label="Close schedule interview"
                            className="w-[40px] h-[40px] flex items-center justify-center rounded-xl bg-transparent hover:bg-[#F2EEE7] active:bg-[#EAE4DB] transition-all text-[#211F1B] focus:outline-none focus:ring-2 focus:ring-[#3F7655]/50"
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    )}
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-[#FFFDF9] px-[28px] py-[24px] scrollbar-thin scrollbar-thumb-[#D9D2C8] scrollbar-track-transparent">
                    
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
                            <div className="w-16 h-16 bg-[#EDF5E8] rounded-full flex items-center justify-center mb-6 border border-[#C9DEC2]">
                                <span className="material-symbols-outlined text-[32px] text-[#3F7655]">check</span>
                            </div>
                            <h3 className="text-[22px] font-serif font-bold text-[#211F1B] mb-6">Interview scheduled</h3>
                            
                            <div className="bg-white border border-[#E5DED4] rounded-xl p-4 w-full max-w-sm mb-6 text-left">
                                <div className="text-[14px] font-semibold text-[#211F1B] mb-1">{displayName}</div>
                                <div className="text-[13px] text-[#746E66] mb-3">{formattedDate} · {formattedTimeStr}</div>
                                <div className="inline-flex items-center gap-1.5 bg-[#F7F3EC] px-2.5 py-1 rounded text-[12px] font-semibold text-[#514C45]">
                                    <span className="material-symbols-outlined text-[16px]">{format === 'phone' ? 'call' : 'videocam'}</span>
                                    {format === 'phone' ? 'Phone' : 'Video meeting'}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => { if (onSuccess) onSuccess(); else onClose(); }}
                                className="h-[44px] px-8 bg-[#3F7655] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#315F44] transition-all"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form id="schedule-form" onSubmit={handleSubmit} className="space-y-[20px]">
                            {error && (
                                <div className="p-4 bg-[#FFF4F4] text-[#C63B3B] border border-[#F2D7D7] rounded-[10px] text-[14px] font-medium flex items-start gap-2">
                                    <span className="material-symbols-outlined text-[20px]">error</span>
                                    <div>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Candidate Card */}
                            <div>
                                <div className="bg-white border border-[#E5DED4] rounded-[12px] p-4 flex items-center gap-4 shadow-sm">
                                    <div className="w-[44px] h-[44px] rounded-full bg-[#F0E9E1] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#E5DED4]">
                                        {candidate.email ?
                                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.email}`} alt="Avatar" className="w-full h-full object-cover" />
                                            : <span className="text-[#746E66] font-semibold text-[15px]">{candidate.filename?.substring(0,2).toUpperCase()}</span>
                                        }
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[15px] font-semibold text-[#211F1B] leading-tight">{displayName}</div>
                                        <div className="text-[13px] text-[#706A62] mt-0.5 font-normal flex items-center gap-2">
                                            {roleTitle} <span className="text-[#D9D2C8]">•</span> <span className="uppercase text-[12px]">#{candidate.filename?.substring(0,5).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                {/* Date */}
                                <div>
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                        Interview Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            min={minDate}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full h-[48px] bg-white border border-[#DCD5CC] rounded-[10px] px-4 text-[14px] font-medium text-[#211F1B] hover:bg-[#F8F4EE] focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 transition-all cursor-pointer"
                                            style={{ color: date ? '#211F1B' : '#9B958D' }}
                                        />
                                    </div>
                                </div>

                                {/* Time (12-hour Custom) */}
                                <div>
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                        Interview Time <span className="normal-case tracking-normal font-normal text-[#9B958D] ml-1">Local time</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={hour} 
                                            onChange={(e) => setHour(e.target.value)}
                                            className="flex-1 h-[48px] bg-white border border-[#DCD5CC] rounded-[10px] px-2 text-[14px] font-medium text-[#211F1B] hover:bg-[#F8F4EE] focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 cursor-pointer appearance-none text-center"
                                            style={{ color: hour ? '#211F1B' : '#9B958D' }}
                                        >
                                            <option value="" disabled>HH</option>
                                            {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                                <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="flex items-center text-[#211F1B] font-bold">:</span>
                                        <select 
                                            value={minute} 
                                            onChange={(e) => setMinute(e.target.value)}
                                            className="flex-1 h-[48px] bg-white border border-[#DCD5CC] rounded-[10px] px-2 text-[14px] font-medium text-[#211F1B] hover:bg-[#F8F4EE] focus:outline-none focus:border-[#3F7655] focus:ring-[3px] focus:ring-[#3F7655]/20 cursor-pointer appearance-none text-center"
                                            style={{ color: minute ? '#211F1B' : '#9B958D' }}
                                        >
                                            <option value="" disabled>MM</option>
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>
                                        <div className="flex rounded-[10px] overflow-hidden border border-[#DCD5CC] ml-1">
                                            <button
                                                type="button"
                                                onClick={() => setPeriod('AM')}
                                                className={`px-3 text-[13px] font-bold transition-colors ${period === 'AM' ? 'bg-[#3F7655] text-white' : 'bg-[#F7F3EC] text-[#514C45] hover:bg-[#EAE4DB]'}`}
                                            >
                                                AM
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPeriod('PM')}
                                                className={`px-3 text-[13px] font-bold transition-colors border-l border-[#DCD5CC] ${period === 'PM' ? 'bg-[#3F7655] text-white border-l-transparent' : 'bg-[#F7F3EC] text-[#514C45] hover:bg-[#EAE4DB]'}`}
                                            >
                                                PM
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Format */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                    Interview Format
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                                    <button
                                        type="button"
                                        onClick={() => { setFormat('phone'); setMeetingLink(''); }}
                                        className={`flex items-start gap-3 p-4 rounded-[12px] text-left transition-all border ${
                                            format === 'phone' 
                                                ? 'bg-[#EDF5E8] border-[#3F7655] shadow-[0_2px_8px_rgba(63,118,85,0.12)]' 
                                                : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined mt-0.5 ${format === 'phone' ? 'text-[#3F7655]' : 'text-[#746E66]'}`}>call</span>
                                        <div>
                                            <div className={`text-[14px] font-semibold mb-0.5 ${format === 'phone' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Phone</div>
                                            <div className="text-[13px] text-[#746E66]">Voice interview</div>
                                        </div>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => { setFormat('video'); setPhone(''); }}
                                        className={`flex items-start gap-3 p-4 rounded-[12px] text-left transition-all border ${
                                            format === 'video' 
                                                ? 'bg-[#EDF5E8] border-[#3F7655] shadow-[0_2px_8px_rgba(63,118,85,0.12)]' 
                                                : 'bg-white border-[#DED7CE] hover:bg-[#F7F3EC]'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined mt-0.5 ${format === 'video' ? 'text-[#3F7655]' : 'text-[#746E66]'}`}>videocam</span>
                                        <div>
                                            <div className={`text-[14px] font-semibold mb-0.5 ${format === 'video' ? 'text-[#315C43]' : 'text-[#211F1B]'}`}>Video meeting</div>
                                            <div className="text-[13px] text-[#746E66]">Google Meet / Teams</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Inputs */}
                            {format === 'phone' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-[#9B958D] text-[20px]">phone_enabled</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter phone number"
                                            className={`w-full h-[48px] pl-11 pr-4 bg-white border ${phone && !isPhoneValid ? 'border-[#C63B3B] focus:ring-[#C63B3B]/20' : 'border-[#DCD5CC] focus:border-[#3F7655] focus:ring-[#3F7655]/20'} rounded-[10px] text-[14px] font-medium text-[#211F1B] placeholder-[#9B958D] focus:outline-none focus:ring-[3px] transition-all`}
                                        />
                                    </div>
                                    {phone && !isPhoneValid && (
                                        <p className="mt-1.5 text-[12px] text-[#C63B3B] font-medium">Please enter a valid phone number.</p>
                                    )}
                                </div>
                            )}

                            {format === 'video' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-[11px] font-bold text-[#625C54] uppercase tracking-[0.08em] mb-2">
                                        Meeting Link
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-[#9B958D] text-[20px]">link</span>
                                        </div>
                                        <input
                                            type="url"
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            placeholder="Paste meeting link (e.g. https://meet.google.com/...)"
                                            className={`w-full h-[48px] pl-11 pr-4 bg-white border ${meetingLink && !isLinkValid ? 'border-[#C63B3B] focus:ring-[#C63B3B]/20' : 'border-[#DCD5CC] focus:border-[#3F7655] focus:ring-[#3F7655]/20'} rounded-[10px] text-[14px] font-medium text-[#211F1B] placeholder-[#9B958D] focus:outline-none focus:ring-[3px] transition-all`}
                                        />
                                    </div>
                                    {meetingLink && !isLinkValid && (
                                        <p className="mt-1.5 text-[12px] text-[#C63B3B] font-medium">Please enter a valid URL.</p>
                                    )}
                                </div>
                            )}

                            {/* Booking Summary */}
                            {isValid && (
                                <div className="bg-[#F7F3EC] border border-[#E5DED4] rounded-[12px] p-4 mt-6 animate-fade-in">
                                    <div className="text-[11px] font-bold text-[#746E66] uppercase tracking-[0.08em] mb-2">
                                        Interview Summary
                                    </div>
                                    <div className="text-[14px] font-medium text-[#211F1B]">
                                        {formattedDate} <br/>
                                        <span className="text-[#514C45]">{formattedTimeStr}</span> <br/>
                                        <span className="text-[#746E66] text-[13px]">{format === 'phone' ? 'Phone interview' : 'Video meeting'}</span>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="flex-shrink-0 px-[28px] py-[20px] bg-[#FFFDF9] border-t border-[#E5DED4] rounded-b-[20px] flex items-center justify-end gap-3 z-[120]">
                        <button 
                            type="button"
                            onClick={onClose} 
                            disabled={loading}
                            className="h-[44px] px-5 bg-white border border-[#D9D2C8] text-[#24221E] text-[14px] font-semibold rounded-[10px] hover:bg-[#F3EFE8] active:bg-[#EAE4DB] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            form="schedule-form"
                            disabled={!isValid || loading}
                            className="h-[44px] px-6 bg-[#3F7655] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#315F44] active:bg-[#284D38] transition-all disabled:bg-[#E7E2DB] disabled:text-[#9B958D] disabled:cursor-not-allowed flex items-center gap-2 shadow-sm disabled:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Scheduling...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
