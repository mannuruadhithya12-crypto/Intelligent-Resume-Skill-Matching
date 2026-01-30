"""
FastAPI Main Application with RBAC
REST API for Resume Matching System
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import uuid
import time
from datetime import datetime, timedelta
from pathlib import Path

# Import internal modules
from api.models import (
    UploadResponse, AnalysisResult, CandidateScore,
    JobStatus, HealthResponse, StatusUpdate, Notification, NotificationReadRequest, UserSettings
)
from api.inference import inference_engine
from api.history_db import (
    save_analysis_job, update_job_completion, save_candidate_results,
    get_all_jobs, delete_job, get_analytics_stats, get_job_results, get_job_by_id,
    update_candidate_status, add_notification, get_notifications, mark_notifications_read,
    get_user_settings, update_user_settings
)
from src.matching.role_weights import detect_role_from_jd

# Import RBAC system
from api.auth_endpoints import router as auth_router
from api.interview_endpoints import router as interview_router
from api.rbac import (
    get_current_active_user,
    require_recruiter_or_above,
    require_permission,
    log_user_action
)
from api.auth_utils import User, UserRole

# Initialize FastAPI app
app = FastAPI(
    title="Resume Matching API with RBAC",
    description="AI-powered resume matching system with role-based access control",
    version="2.0.0"
)

# Include authentication router
app.include_router(auth_router)
app.include_router(interview_router)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        "http://localhost:5176"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory job storage (use Redis/DB in production)
jobs = {}

# In-memory history and usage tracking
analysis_history = []
usage_limit = 1000
usage_count = 0 # Start with 0 usage

def add_to_history(filename: str, status: str, job_id: str):
    """Add item to analysis history"""
    analysis_history.append({
        'filename': filename,
        'status': status,
        'timestamp': datetime.now(),
        'id': job_id  # Added ID to link to results
    })
    # Keep only last 50 items
    if len(analysis_history) > 50:
        analysis_history.pop(0)

# --- GENERAL ENDPOINTS ---

@app.get("/", response_model=HealthResponse)
async def root():
    """API health check"""
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        model_loaded=inference_engine.is_model_loaded(),
        timestamp=datetime.now()
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check"""
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        model_loaded=inference_engine.is_model_loaded(),
        timestamp=datetime.now()
    )

# --- UPLOAD & ANALYSIS ENDPOINTS ---

@app.post("/api/upload", response_model=UploadResponse)
async def upload_files(
    resumes: List[UploadFile] = File(...),
    job_description: UploadFile = File(...),
    current_user: User = Depends(require_recruiter_or_above)
):

    """
    Upload resumes and job description
    Returns job_id for tracking analysis
    """
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Create job directory
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(exist_ok=True)
    
    # Save job description
    jd_path = job_dir / job_description.filename
    with open(jd_path, "wb") as f:
        content = await job_description.read()
        f.write(content)
    
    # Save resumes
    resume_paths = []
    for resume in resumes:
        resume_path = job_dir / resume.filename
        with open(resume_path, "wb") as f:
            content = await resume.read()
            f.write(content)
        resume_paths.append(str(resume_path))
    
    # Store job metadata
    jobs[job_id] = {
        'status': 'uploaded',
        'jd_path': str(jd_path),
        'resume_paths': resume_paths,
        'jd_filename': job_description.filename,
        'created_at': datetime.now()
    }

    # Save to persistent database
    save_analysis_job(
        job_id=job_id,
        user_email=current_user.email,
        jd_filename=job_description.filename,
        resume_count=len(resumes)
    )
    
    return UploadResponse(
        job_id=job_id,
        message="Files uploaded successfully",
        files_uploaded=len(resumes)
    )

def process_analysis(job_id: str):
    """Background task to process analysis"""
    try:
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['progress'] = 10
        
        # Read JD text
        jd_path = jobs[job_id]['jd_path']
        with open(jd_path, 'r', encoding='utf-8', errors='ignore') as f:
            jd_text = f.read()
        
        jobs[job_id]['progress'] = 30
        
        # Analyze resumes
        # Analyze resumes
        # ATS ALIGNMENT: Detect Job Role for Weighting
        job_role = detect_role_from_jd(jd_text)
        
        start_time = time.time()
        results = inference_engine.batch_analyze(
            jobs[job_id]['resume_paths'],
            jd_text,
            job_role=job_role
        )
        processing_time = time.time() - start_time
        
        jobs[job_id]['progress'] = 90
        
        # Store results
        jobs[job_id]['results'] = results
        jobs[job_id]['processing_time'] = processing_time
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['progress'] = 100
        
        # Calculate statistics
        avg_score = float(sum(r['final_score'] for r in results) / len(results)) if results else 0.0
        top_candidate = results[0]['filename'] if results else None
        
        # Save to persistent database
        update_job_completion(
            job_id=job_id,
            status='completed',
            processing_time=float(processing_time),
            avg_score=avg_score,
            top_candidate=top_candidate
        )
        save_candidate_results(job_id, results)

        # NOTIFICATIONS: Real-time alerts
        add_notification(
            category='alert',
            title='Analysis Complete',
            content=f"Analysis detailed report for {len(results)} candidates is ready.",
            meta={'job_id': job_id, 'type': 'job_complete'}
        )

        # Check for top talent to send a 'Message'
        top_talent = [c for c in results if c['final_score'] >= 85]
        if top_talent:
            add_notification(
                category='message',
                title='System AI Agent',
                content=f"I found {len(top_talent)} candidates with a generic match score above 85%. You should review them immediately.",
                meta={'job_id': job_id, 'count': len(top_talent), 'type': 'insight'}
            )
        
        # MONITORING: Log predictions for drift detection
        from src.monitoring.drift_monitor import drift_monitor
        for r in results:
            drift_monitor.log_prediction(r['final_score'])
        
    except Exception as e:
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['error'] = str(e)
        
        # Update database with failure
        update_job_completion(
            job_id=job_id,
            status='failed',
            processing_time=0,
            error_message=str(e)
        )
        
        # NOTIFICATION: Failure
        add_notification(
            category='alert',
            title='Analysis Failed',
            content=f"Job processing failed: {str(e)}",
            meta={'job_id': job_id, 'type': 'job_failed'}
        )

@app.post("/api/analyze/{job_id}")
async def start_analysis(
    job_id: str, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_recruiter_or_above)
):

    """ Start analysis for uploaded files """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if jobs[job_id]['status'] != 'uploaded':
        raise HTTPException(status_code=400, detail="Job already processing or completed")
    
    # Start background processing
    background_tasks.add_task(process_analysis, job_id)
    
    return {"message": "Analysis started", "job_id": job_id}

@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get job processing status"""
    # 1. Check In-Memory Cache
    if job_id in jobs:
        job = jobs[job_id]
        return JobStatus(
            job_id=job_id,
            status=job['status'],
            progress=job.get('progress', 0),
            message=job.get('error', None)
        )
        
    # 2. Check Database (Persistence Fallback)
    db_job = get_job_by_id(job_id)
    if db_job:
        status = db_job.get('status', 'completed')
        progress = 100 if status == 'completed' else 0
        return JobStatus(
            job_id=job_id,
            status=status,
            progress=progress,
            message=db_job.get('error_message')
        )
        
    raise HTTPException(status_code=404, detail="Job not found")

@app.get("/api/results/{job_id}", response_model=AnalysisResult)
async def get_results(
    job_id: str,
    current_user: User = Depends(require_recruiter_or_above)
):
    """Get analysis results"""
    # 1. Check in-memory first (fastest)
    if job_id in jobs:
        job = jobs[job_id]
        
        if job['status'] != 'completed':
            raise HTTPException(status_code=400, detail=f"Job status: {job['status']}")
        
        # Convert results to Pydantic models
        candidates = [
            CandidateScore(
                filename=r['filename'],
                final_score=r['final_score'],
                semantic_score=r['semantic_score'],
                experience_score=r['experience_score'],
                education_score=r['education_score'],
                matched_skills=r['matched_skills'],
                missing_skills=r.get('missing_skills', []),
                recommended_roles=r.get('recommended_roles', []),
                match_classification=r.get('match_classification', None),
                confidence_score=r.get('confidence_score', None),
                rank=r.get('rank'),
                email=r.get('email'),
                phone=r.get('phone'),
                summary=r.get('summary'),
                interview_questions=r.get('interview_questions', []),
                status=r.get('status', 'new')
            ) for r in job['results']
        ]
        
        # In-memory 'started_at' might be missing in some paths, but 'created_at' exists
        timestamp = job['created_at']
        
        return AnalysisResult(
            job_id=job_id,
            jd_filename=job['jd_filename'],
            candidates=candidates,
            total_candidates=len(candidates),
            processing_time=job.get('processing_time', 0.0),
            timestamp=timestamp
        )
    
    # 2. Fallback to Database
    db_job = get_job_by_id(job_id)
    if db_job:
        db_results = get_job_results(job_id)
        if db_results:
             candidates = [
                CandidateScore(
                    filename=r['filename'],
                    final_score=r['final_score'],
                    semantic_score=r['semantic_score'],
                    experience_score=r['experience_score'],
                    education_score=r['education_score'],
                    matched_skills=r['matched_skills'],
                    missing_skills=r['missing_skills'],
                    recommended_roles=r.get('recommended_roles', []),
                    match_classification=r.get('match_classification', None),
                    confidence_score=None, # Not stored in DB
                    rank=r.get('rank'),
                    email=r.get('email'),
                    phone=r.get('phone'),
                    summary=r.get('summary'),
                    interview_questions=r.get('interview_questions', []),
                    status=r.get('status', 'new')
                ) for r in db_results
            ]
             
             # DB timestamp is string
             ts = db_job['created_at']
             if isinstance(ts, str):
                 try:
                     ts = datetime.fromisoformat(ts)
                 except:
                     ts = datetime.now()
             
             return AnalysisResult(
                job_id=job_id,
                jd_filename=db_job['jd_filename'],
                candidates=candidates,
                total_candidates=len(candidates),
                processing_time=db_job.get('processing_time', 0.0),
                timestamp=ts
            )

    raise HTTPException(status_code=404, detail="Job not found")

@app.put("/api/results/{job_id}/{filename}/status")
async def update_status(
    job_id: str,
    filename: str,
    update: StatusUpdate,
    current_user: User = Depends(require_recruiter_or_above)
):
    """Update candidate status (shortlisted/rejected)"""
    # 1. Update Persistent DB
    update_candidate_status(job_id, filename, update.status)
    
    # 2. Update In-Memory Cache (if job is fresh)
    if job_id in jobs:
        for result in jobs[job_id]['results']:
            if result['filename'] == filename:
                result['status'] = update.status
                break
                
    # NOTIFICATION: Status Update
    add_notification(
        category='alert',
        title='Candidate Update',
        content=f"Candidate {filename} was marked as '{update.status}'.",
        meta={'job_id': job_id, 'filename': filename, 'type': 'status_update'}
    )
                
    return {"message": "Status updated"}

# --- HISTORY & USAGE ---

@app.get("/api/history")
async def get_history(
    current_user: User = Depends(get_current_active_user),
    limit: int = 50
):
    """Get analysis history for current user (last 24 hours)"""
    # Admin sees all, others see only their own
    user_email = None if current_user.role == UserRole.ADMIN else current_user.email
    jobs_list = get_all_jobs(user_email=user_email, limit=limit)
    return jobs_list

@app.delete("/api/history/{job_id}")
async def delete_analysis(
    job_id: str,
    current_user: User = Depends(require_recruiter_or_above)
):
    """Delete an analysis job"""
    # Check if job exists in memory
    if job_id in jobs:
        del jobs[job_id]
    
    # Delete from database
    deleted = delete_job(job_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Analysis deleted successfully", "job_id": job_id}

from src.recommendation.learning_path import recommend_learning_path
from src.monitoring.drift_monitor import drift_monitor

class LearningResource(BaseModel):
    name: str
    provider: str
    type: str

class SkillRecommendation(BaseModel):
    skill: str
    resources: List[LearningResource]

class AnalyticsResponse(BaseModel):
    total_analyses: int
    avg_score: float
    top_skills_demand: List[str]
    model_health: Dict[str, Any]

from api.rbac import require_hr_manager_or_above

@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(require_hr_manager_or_above),
    days: int = 7
):
    """Get recruitment analytics dashboard data"""
    # Get comprehensive stats from database
    stats = get_analytics_stats(days=days)
    drift_stats = drift_monitor.check_drift()
    
    overall = stats.get('overall', {})
    
    return AnalyticsResponse(
        total_analyses=overall.get('total_jobs', 0),
        avg_score=overall.get('overall_avg_score', 0) or 0,
        top_skills_demand=["Python", "React", "AWS", "Machine Learning"],
        model_health={
            **drift_stats,
            'success_rate': (overall.get('success_count') or 0) / max((overall.get('total_jobs') or 1), 1),
            'avg_processing_time': overall.get('avg_processing_time') or 0,
            'total_resumes_processed': overall.get('total_resumes') or 0
        }
    )

@app.get("/api/analytics/detailed")
async def get_detailed_analytics(
    current_user: User = Depends(require_hr_manager_or_above),
    days: int = 7
):
    """Get detailed analytics with charts data"""
    return get_analytics_stats(days=days)

@app.get("/api/learning-path/{job_id}/{candidate_filename}", response_model=List[SkillRecommendation])
async def get_learning_path(
    job_id: str, 
    candidate_filename: str,
    current_user: User = Depends(require_recruiter_or_above)
):
    """Get learning path for a specific candidate in a job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs[job_id]
    candidate = next((r for r in job['results'] if r['filename'] == candidate_filename), None)
    
    if not candidate:
         raise HTTPException(status_code=404, detail="Candidate not found")
         
    # Generate recommendations for top 3 missing skills
    missing = candidate.get('missing_skills', {}).get('all', [])[:3] 
    return recommend_learning_path(missing)

@app.get("/api/notifications", response_model=List[Notification])
async def get_user_notifications(
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Get real-time notifications and messages"""
    return get_notifications(limit=limit, unread_only=unread_only)

@app.post("/api/notifications/read")
async def read_notifications(
    request: NotificationReadRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Mark notifications as read"""
    mark_notifications_read(request.ids)
    return {"success": True}

@app.get("/api/settings", response_model=UserSettings)
async def get_settings(current_user: User = Depends(get_current_active_user)):
    """Get user settings"""
    settings = get_user_settings(current_user.email)
    return settings

@app.post("/api/settings")
async def update_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_active_user)
):
    """Update user settings"""
    update_user_settings(current_user.email, settings.dict(exclude_unset=True))
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
