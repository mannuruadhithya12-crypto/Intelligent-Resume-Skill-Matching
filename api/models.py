"""
Pydantic Models for API Request/Response Validation
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class UploadResponse(BaseModel):
    """Response after file upload"""
    job_id: str
    message: str
    files_uploaded: int

class CandidateScore(BaseModel):
    """Individual candidate scoring result"""
    filename: str
    final_score: float = Field(..., ge=0, le=100, description="Final matching score (0-100)")
    semantic_score: float = Field(..., ge=0, le=100)
    experience_score: float = Field(..., ge=0, le=100)
    education_score: float = Field(..., ge=0, le=100)
    match_classification: Optional[str] = "Partial Fit"
    confidence_score: Optional[str] = "Medium"
    matched_skills: List[str]
    missing_skills: List[str]
    skill_recommendations: Optional[Dict[str, str]] = None
    learning_paths: Optional[List[Dict[str, Any]]] = None
    recommended_roles: Optional[List[Any]] = None
    rank: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    interview_questions: Optional[List[str]] = None
    status: Optional[str] = "new" 
    categorized_skills: Optional[Dict[str, List[str]]] = None

class AnalysisResult(BaseModel):
    """Complete analysis result"""
    job_id: str
    jd_filename: str
    candidates: List[CandidateScore]
    total_candidates: int
    processing_time: float
    timestamp: datetime

class StatusUpdate(BaseModel):
    status: str

class JobStatus(BaseModel):
    """Job processing status"""
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int  # 0-100
    message: Optional[str] = None
    
class HealthResponse(BaseModel):
    """API health check response"""
    status: str
    version: str
    model_loaded: bool
    timestamp: datetime


class Notification(BaseModel):
    id: int
    category: str
    title: Optional[str] = None
    content: str
    timestamp: Any
    is_read: bool
    meta: Optional[Dict] = None

class NotificationReadRequest(BaseModel):
    ids: Optional[List[int]] = None

class UserSettings(BaseModel):
    notifications: Optional[Dict[str, bool]] = None
    theme: Optional[str] = None
