"""
Analysis History Database
Stores analysis jobs with 24-hour retention and detailed metrics
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

DB_PATH = "analysis_history.db"

def init_history_db():
    """Initialize analysis history database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Analysis jobs table
    c.execute('''
        CREATE TABLE IF NOT EXISTS analysis_jobs (
            job_id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            jd_filename TEXT NOT NULL,
            resume_count INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            completed_at TIMESTAMP,
            processing_time REAL,
            avg_score REAL,
            top_candidate TEXT,
            error_message TEXT
        )
    ''')
    
    # Detailed candidate results table
    c.execute('''
        CREATE TABLE IF NOT EXISTS candidate_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            final_score REAL NOT NULL,
            semantic_score REAL,
            experience_score REAL,
            education_score REAL,
            rank INTEGER,
            
            email TEXT,
            phone TEXT,
            matched_skills TEXT,  -- JSON list
            missing_skills TEXT,  -- JSON list
            recommended_roles TEXT, -- JSON list
            match_classification TEXT,
            summary TEXT,
            interview_questions TEXT, -- JSON list
            status TEXT DEFAULT 'new',
            
            FOREIGN KEY (job_id) REFERENCES analysis_jobs(job_id)
        )
    ''')

    # Migration: Add interview_questions content if missing
    try:
        c.execute("ALTER TABLE candidate_results ADD COLUMN interview_questions TEXT")
    except sqlite3.OperationalError:
        pass 
        
    # Migration: Add status if missing
    try:
        c.execute("ALTER TABLE candidate_results ADD COLUMN status TEXT DEFAULT 'new'")
    except sqlite3.OperationalError:
        pass 
    
    # Migration: Add new detailed fields if missing
    new_columns = [
        ("linkedin_url", "TEXT"),
        ("github_url", "TEXT"), 
        ("portfolio_url", "TEXT"),
        ("location", "TEXT"),
        ("education_history", "TEXT"), # JSON
        ("experience_history", "TEXT"), # JSON
        ("projects", "TEXT"), # JSON
        ("certifications", "TEXT") # JSON
    ]
    
    for col_name, col_type in new_columns:
        try:
            c.execute(f"ALTER TABLE candidate_results ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass
            
    # Analytics aggregation table
    c.execute('''
        CREATE TABLE IF NOT EXISTS analytics_summary (
            date TEXT PRIMARY KEY,
            total_analyses INTEGER DEFAULT 0,
            total_resumes INTEGER DEFAULT 0,
            avg_score REAL DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            failure_count INTEGER DEFAULT 0
        )
    ''')
    
    
    # Notifications Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,  -- 'alert' or 'message'
            title TEXT,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0,
            meta TEXT -- Optional JSON metadata
        )
    ''')

    
    # User Settings Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            user_email TEXT PRIMARY KEY,
            settings_json TEXT NOT NULL
        )
    ''')

    # Login Activity Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS login_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            location TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'success' -- 'success', 'failed', 'logout'
        )
    ''')
    
    conn.commit()
    conn.close()

def cleanup_old_jobs():
    """Remove jobs older than 24 hours"""
    conn = sqlite3.connect(DB_PATH)
    cutoff = datetime.now() - timedelta(hours=24)
    conn.execute('DELETE FROM analysis_jobs WHERE created_at < ?', (cutoff,))
    conn.execute('DELETE FROM candidate_results WHERE job_id NOT IN (SELECT job_id FROM analysis_jobs)')
    conn.commit()
    conn.close()

def save_analysis_job(job_id: str, user_email: str, jd_filename: str, resume_count: int):
    """Save new analysis job"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        INSERT INTO analysis_jobs (job_id, user_email, jd_filename, resume_count, status, created_at)
        VALUES (?, ?, ?, ?, 'processing', ?)
    ''', (job_id, user_email, jd_filename, resume_count, datetime.now()))
    conn.commit()
    conn.close()

def update_job_completion(job_id: str, status: str, processing_time: float, 
                          avg_score: float = None, top_candidate: str = None, 
                          error_message: str = None):
    """Update job with completion details"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        UPDATE analysis_jobs 
        SET status = ?, completed_at = ?, processing_time = ?, 
            avg_score = ?, top_candidate = ?, error_message = ?
        WHERE job_id = ?
    ''', (status, datetime.now(), processing_time, avg_score, top_candidate, error_message, job_id))
    conn.commit()
    conn.close()

def save_candidate_results(job_id: str, results: List[Dict]):
    """Save candidate results for a job"""
    conn = sqlite3.connect(DB_PATH)
    for r in results:
        # Serialize complex fields
        matched_skills = json.dumps(r.get('matched_skills', []))
        missing_skills = json.dumps(r.get('missing_skills', []))
        recommended_roles = json.dumps(r.get('recommended_roles', []))
        interview_questions = json.dumps(r.get('interview_questions', []))
        
        # New fields serialization
        edu_history = json.dumps(r.get('education_history', []))
        exp_history = json.dumps(r.get('experience_history', []))
        projects = json.dumps(r.get('projects', []))
        certs = json.dumps(r.get('certifications', []))
        
        conn.execute('''
            INSERT INTO candidate_results 
            (job_id, filename, final_score, semantic_score, experience_score, education_score, rank,
             email, phone, matched_skills, missing_skills, recommended_roles, match_classification, 
             summary, interview_questions, linkedin_url, github_url, portfolio_url, location,
             education_history, experience_history, projects, certifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job_id, 
            r['filename'], 
            float(r['final_score']), 
            float(r.get('semantic_score', 0)), 
            float(r.get('experience_score', 0)), 
            float(r.get('education_score', 0)), 
            int(r.get('rank', 0)),
            r.get('email'),
            r.get('phone'),
            matched_skills,
            missing_skills,
            recommended_roles,
            r.get('match_classification'),
            r.get('summary'),
            interview_questions,
            r.get('linkedin_url'),
            r.get('github_url'),
            r.get('portfolio_url'),
            r.get('location'),
            edu_history,
            exp_history,
            projects,
            certs
        ))
    conn.commit()
    conn.close()

def update_candidate_status(job_id: str, filename: str, status: str):
    """Update candidate status (shortlisted/rejected)"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        UPDATE candidate_results 
        SET status = ?
        WHERE job_id = ? AND filename = ?
    ''', (status, job_id, filename))
    conn.commit()
    conn.close()

def get_all_jobs(user_email: str = None, limit: int = 50) -> List[Dict]:
    """Get all analysis jobs (optionally filtered by user)"""
    cleanup_old_jobs()  # Clean up before fetching
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    if user_email:
        query = 'SELECT * FROM analysis_jobs WHERE user_email = ? ORDER BY created_at DESC LIMIT ?'
        rows = conn.execute(query, (user_email, limit)).fetchall()
    else:
        query = 'SELECT * FROM analysis_jobs ORDER BY created_at DESC LIMIT ?'
        rows = conn.execute(query, (limit,)).fetchall()
    
    conn.close()
    return [dict(row) for row in rows]

def get_job_results(job_id: str) -> List[Dict]:
    """Get candidate results for a specific job"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    rows = conn.execute('''
        SELECT * FROM candidate_results 
        WHERE job_id = ?
        ORDER BY rank ASC
    ''', (job_id,)).fetchall()
    
    conn.close()
    
    # Convert Row objects to dicts and handle any necessary parsing
    results = []
    for row in rows:
        r = dict(row)
        # Parse potential JSON fields
        try:
            r['matched_skills'] = json.loads(r['matched_skills']) if r.get('matched_skills') else []
            r['missing_skills'] = json.loads(r['missing_skills']) if r.get('missing_skills') else []
            r['recommended_roles'] = json.loads(r['recommended_roles']) if r.get('recommended_roles') else []
            r['interview_questions'] = json.loads(r['interview_questions']) if r.get('interview_questions') else []
            
            # Parse new fields
            r['education_history'] = json.loads(r['education_history']) if r.get('education_history') else []
            r['experience_history'] = json.loads(r['experience_history']) if r.get('experience_history') else []
            r['projects'] = json.loads(r['projects']) if r.get('projects') else []
            r['certifications'] = json.loads(r['certifications']) if r.get('certifications') else []
            
        except:
            # Fallback if parsing fails
            r['matched_skills'] = []
            r['missing_skills'] = []
            r['recommended_roles'] = []
            r['interview_questions'] = []
            r['education_history'] = []
            r['experience_history'] = []
            r['projects'] = []
            r['certifications'] = []
            
        results.append(r)
        
    return results

def get_job_by_id(job_id: str) -> Optional[Dict]:
    """Get job details by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM analysis_jobs WHERE job_id = ?', (job_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_job(job_id: str) -> bool:
    """Delete a specific job and its results"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('DELETE FROM candidate_results WHERE job_id = ?', (job_id,))
    cursor = conn.execute('DELETE FROM analysis_jobs WHERE job_id = ?', (job_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def get_analytics_stats(days: int = 7) -> Dict:
    """Get analytics statistics for the last N days"""
    cleanup_old_jobs()
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    cutoff = datetime.now() - timedelta(days=days)
    
    # Overall stats
    stats = conn.execute('''
        SELECT 
            COUNT(*) as total_jobs,
            SUM(resume_count) as total_resumes,
            AVG(avg_score) as overall_avg_score,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failure_count,
            AVG(processing_time) as avg_processing_time
        FROM analysis_jobs
        WHERE created_at >= ?
    ''', (cutoff,)).fetchone()
    
    # Daily breakdown
    daily = conn.execute('''
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as jobs,
            SUM(resume_count) as resumes,
            AVG(avg_score) as avg_score
        FROM analysis_jobs
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    ''', (cutoff,)).fetchall()
    
    # Hourly breakdown for last 24 hours
    hourly = conn.execute('''
        SELECT 
            strftime('%Y-%m-%d %H:00', created_at) as hour,
            COUNT(*) as jobs,
            SUM(resume_count) as resumes
        FROM analysis_jobs
        WHERE created_at >= datetime('now', '-24 hours')
        GROUP BY hour
        ORDER BY hour DESC
    ''').fetchall()
    
    conn.close()
    
    return {
        'overall': dict(stats) if stats else {},
        'daily': [dict(row) for row in daily],
        'hourly': [dict(row) for row in hourly]
    }

def get_user_settings(user_email: str) -> Dict:
    """Get user settings or return defaults"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT settings_json FROM user_settings WHERE user_email = ?', (user_email,)).fetchone()
    conn.close()
    
    defaults = {
        "notifications": {"email": True, "push": True, "weekly": False},
        "theme": "light"
    }
    
    if row and row['settings_json']:
        try:
            stored = json.loads(row['settings_json'])
            # Merge with defaults
            return {**defaults, **stored}
        except:
            return defaults
    return defaults

def update_user_settings(user_email: str, settings: Dict):
    """Update user settings"""
    conn = sqlite3.connect(DB_PATH)
    # Get existing to merge
    existing = get_user_settings(user_email)
    updated = {**existing, **settings}
    
    conn.execute('''
        INSERT INTO user_settings (user_email, settings_json)
        VALUES (?, ?)
        ON CONFLICT(user_email) DO UPDATE SET settings_json = ?
    ''', (user_email, json.dumps(updated), json.dumps(updated)))
    conn.commit()
    conn.close()

def add_notification(category: str, content: str, title: str = None, meta: Dict = None):
    """Add a new notification"""
    conn = sqlite3.connect(DB_PATH)
    meta_json = json.dumps(meta) if meta else None
    conn.execute('''
        INSERT INTO notifications (category, title, content, timestamp, is_read, meta)
        VALUES (?, ?, ?, ?, 0, ?)
    ''', (category, title, content, datetime.now(), meta_json))
    conn.commit()
    conn.close()

def get_notifications(limit: int = 50, unread_only: bool = False) -> List[Dict]:
    """Get notifications"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    query = 'SELECT * FROM notifications'
    params = []
    
    if unread_only:
        query += ' WHERE is_read = 0'
        
    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.append(limit)
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    results = []
    for row in rows:
        r = dict(row)
        try:
            r['meta'] = json.loads(r['meta']) if r.get('meta') else {}
        except:
            r['meta'] = {}
        # Add relative time string or formatted time here if needed, but frontend can handle it
        r['time'] = r['timestamp'] # Use timestamp for sorting
        results.append(r)
        
    return results

def mark_notifications_read(notification_ids: List[int] = None):
    """Mark specific notifications as read, or all if ids is None"""
    conn = sqlite3.connect(DB_PATH)
    if notification_ids:
        placeholders = ','.join('?' * len(notification_ids))
        conn.execute(f'UPDATE notifications SET is_read = 1 WHERE id IN ({placeholders})', notification_ids)
    else:
        conn.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
    conn.commit()
    conn.commit()
    conn.close()

def record_login_activity(user_email: str, ip_address: str, user_agent: str, location: str = "Unknown", status: str = "success"):
    """Record a login event"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        INSERT INTO login_activity (user_email, ip_address, user_agent, location, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_email, ip_address, user_agent, location, status, datetime.now()))
    conn.commit()
    conn.close()

def get_login_activity(user_email: str, limit: int = 10) -> List[Dict]:
    """Get recent login activity for a user"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute('SELECT * FROM login_activity WHERE user_email = ? ORDER BY timestamp DESC LIMIT ?', (user_email, limit)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Initialize database on import
init_history_db()
