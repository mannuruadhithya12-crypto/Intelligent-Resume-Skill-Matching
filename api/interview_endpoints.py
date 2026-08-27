"""
Interview Scheduling API Endpoints — Extended with Google Calendar/Meet

Routes:
  POST   /api/interviews           — Schedule an interview (with optional Google Meet)
  GET    /api/interviews           — List recruiter's interviews
  GET    /api/google/auth-url      — Get Google OAuth authorization URL
  GET    /api/google/callback      — Handle OAuth callback (browser redirect)
  GET    /api/google/status        — Check Google Calendar connection status
  POST   /api/google/disconnect    — Disconnect Google Calendar
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from api.rbac import get_current_active_user
from api.auth_utils import User
from api.interview_db import (
    save_interview, get_interviews_db, check_duplicate_interview
)
from api.google_calendar_service import (
    get_google_auth_url, handle_google_callback,
    get_google_status as _get_google_status,
    delete_google_token, create_calendar_event_with_meet,
    GOOGLE_CLIENT_ID
)

router = APIRouter(prefix="/api", tags=["interviews"])


# --- Pydantic Models ---

class InterviewCreate(BaseModel):
    candidate_name: str
    job_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM (24h)
    meeting_type: str  # 'video' or 'phone'
    duration_minutes: int = 30
    timezone: str = "Asia/Kolkata"
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    meeting_provider: str = "none"  # 'google_meet', 'manual', 'none'
    meeting_link: Optional[str] = None  # Only for manual links
    send_invitation: bool = True


class InterviewResponse(BaseModel):
    id: int
    candidate_name: str
    date: str
    time: str
    meeting_type: str
    status: str
    job_id: Optional[str] = None
    duration_minutes: Optional[int] = 30
    timezone: Optional[str] = None
    meeting_link: Optional[str] = None
    calendar_event_id: Optional[str] = None
    invitation_status: Optional[str] = None
    meeting_provider: Optional[str] = None


# --- Interview Endpoints ---

@router.post("/interviews")
async def schedule_interview_endpoint(
    interview: InterviewCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Schedule an interview — optionally creating a Google Calendar event with Meet."""

    # --- Validation ---

    # Date validation: not in the past
    try:
        interview_date = datetime.strptime(interview.date, "%Y-%m-%d").date()
        if interview_date < datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Interview date cannot be in the past."
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD."
        )

    # Time validation
    try:
        datetime.strptime(interview.time, "%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM (24-hour)."
        )

    # Duration validation
    if interview.duration_minutes not in [15, 30, 45, 60, 90, 120]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be 15, 30, 45, 60, 90, or 120 minutes."
        )

    # Phone validation
    if interview.meeting_type == "phone":
        phone = interview.candidate_phone or ""
        digits = ''.join(c for c in phone if c.isdigit())
        if len(digits) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid phone number (minimum 10 digits)."
            )

    # Video + Google Meet: require email
    if interview.meeting_type == "video" and interview.meeting_provider == "google_meet":
        if not interview.candidate_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate email is required for Google Meet invitations."
            )

    # Duplicate check
    if check_duplicate_interview(
        current_user.email, interview.candidate_name,
        interview.job_id, interview.date, interview.time
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An identical interview is already scheduled."
        )

    # --- Google Meet Flow ---
    meeting_link = interview.meeting_link
    calendar_event_id = None
    invitation_status = "pending"

    if interview.meeting_type == "video" and interview.meeting_provider == "google_meet":
        # Check if Google is connected
        google_status = _get_google_status(current_user.email)
        if not google_status["connected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google Calendar is not connected. Please connect your Google account in Settings before scheduling a Google Meet interview."
            )

        # Build datetime strings
        start_dt = f"{interview.date}T{interview.time}:00"
        hour, minute = map(int, interview.time.split(":"))
        end_dt_obj = datetime.strptime(start_dt, "%Y-%m-%dT%H:%M:%S") + timedelta(minutes=interview.duration_minutes)
        end_dt = end_dt_obj.strftime("%Y-%m-%dT%H:%M:%S")

        # Candidate display name from filename
        display_name = interview.candidate_name.replace('.pdf', '').replace('.docx', '').replace('_', ' ').replace('-', ' ')

        result = create_calendar_event_with_meet(
            recruiter_email=current_user.email,
            summary=f"Interview — {display_name}",
            description=f"Interview scheduled via RecruitAI Enterprise.\n\nCandidate: {display_name}\nJob ID: {interview.job_id}\nFormat: Video (Google Meet)\nDuration: {interview.duration_minutes} minutes",
            start_datetime=start_dt,
            end_datetime=end_dt,
            timezone=interview.timezone,
            attendee_email=interview.candidate_email,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=result.get("error", "Failed to create Google Calendar event.")
            )

        meeting_link = result.get("meeting_link")
        calendar_event_id = result.get("calendar_event_id")
        invitation_status = "sent"

    elif interview.meeting_type == "video" and interview.meeting_provider == "manual":
        # Manual link — validate URL
        if not meeting_link or not (meeting_link.startswith("http://") or meeting_link.startswith("https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid meeting URL."
            )
        invitation_status = "pending"

    # --- Save to Database ---
    interview_id = save_interview(
        user_email=current_user.email,
        candidate_name=interview.candidate_name,
        job_id=interview.job_id,
        date=interview.date,
        time=interview.time,
        meeting_type=interview.meeting_type,
        duration_minutes=interview.duration_minutes,
        timezone=interview.timezone,
        meeting_link=meeting_link,
        calendar_event_id=calendar_event_id,
        candidate_email=interview.candidate_email,
        candidate_phone=interview.candidate_phone,
        meeting_provider=interview.meeting_provider,
        invitation_status=invitation_status,
    )

    return {
        "success": True,
        "message": "Interview scheduled successfully",
        "interview": {
            "id": interview_id,
            "status": "scheduled",
            "meeting_link": meeting_link,
            "calendar_event_id": calendar_event_id,
            "invitation_status": invitation_status,
            "meeting_provider": interview.meeting_provider,
        }
    }


@router.get("/interviews", response_model=List[InterviewResponse])
async def list_interviews(
    current_user: User = Depends(get_current_active_user)
):
    """List all interviews for the current recruiter."""
    interviews = get_interviews_db(current_user.email)
    return interviews


# --- Google OAuth Endpoints ---

@router.get("/google/auth-url")
async def google_auth_url(
    current_user: User = Depends(get_current_active_user)
):
    """Generate Google OAuth2 authorization URL for the current user."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google Calendar integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment."
        )
    url = get_google_auth_url(current_user.email)
    if not url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Google authorization URL."
        )
    return {"auth_url": url}


@router.get("/google/callback")
async def google_callback(code: str, state: str):
    """Handle Google OAuth2 callback — exchanges authorization code for tokens."""
    result = handle_google_callback(code, state)
    if result["success"]:
        # Redirect back to settings page with success indicator
        return RedirectResponse(
            url=f"/settings?google_connected=true&email={result.get('google_email', '')}",
            status_code=302
        )
    else:
        return RedirectResponse(
            url=f"/settings?google_connected=false&error={result.get('error', 'unknown')}",
            status_code=302
        )


@router.get("/google/status")
async def google_status(
    current_user: User = Depends(get_current_active_user)
):
    """Check if the current user has Google Calendar connected."""
    status_info = _get_google_status(current_user.email)
    return status_info


@router.post("/google/disconnect")
async def google_disconnect(
    current_user: User = Depends(get_current_active_user)
):
    """Disconnect Google Calendar for the current user."""
    delete_google_token(current_user.email)
    return {"message": "Google Calendar disconnected successfully"}
