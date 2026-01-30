from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from api.rbac import get_current_active_user
from api.auth_utils import User
from api.interview_db import save_interview, get_interviews_db

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

class InterviewCreate(BaseModel):
    candidate_name: str
    job_id: str
    date: str
    time: str
    meeting_type: str

class InterviewResponse(BaseModel):
    id: int
    candidate_name: str
    date: str
    time: str
    meeting_type: str
    status: str
    job_id: Optional[str] = None

@router.post("")
async def schedule_interview(
    interview: InterviewCreate,
    current_user: User = Depends(get_current_active_user)
):
    save_interview(
        current_user.email,
        interview.candidate_name,
        interview.job_id,
        interview.date,
        interview.time,
        interview.meeting_type
    )
    return {"message": "Interview scheduled successfully"}

@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    current_user: User = Depends(get_current_active_user)
):
    interviews = get_interviews_db(current_user.email)
    return interviews
