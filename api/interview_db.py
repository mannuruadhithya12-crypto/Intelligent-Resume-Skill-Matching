"""
Interview Database — Extended Schema
Stores interview scheduling data with Google Calendar integration support.
"""

import sqlite3
from typing import List, Dict, Optional
from datetime import datetime
from api.history_db import DB_PATH


def init_interview_table():
    """Initialize the interviews table with full schema."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            candidate_name TEXT NOT NULL,
            job_id TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            meeting_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'scheduled'
        )
    ''')
    conn.commit()

    # Migrations — add new columns safely (matching existing codebase pattern)
    migrations = [
        "ALTER TABLE interviews ADD COLUMN duration_minutes INTEGER DEFAULT 30",
        "ALTER TABLE interviews ADD COLUMN timezone TEXT DEFAULT 'UTC'",
        "ALTER TABLE interviews ADD COLUMN meeting_link TEXT",
        "ALTER TABLE interviews ADD COLUMN calendar_event_id TEXT",
        "ALTER TABLE interviews ADD COLUMN candidate_email TEXT",
        "ALTER TABLE interviews ADD COLUMN candidate_phone TEXT",
        "ALTER TABLE interviews ADD COLUMN recruiter_email TEXT",
        "ALTER TABLE interviews ADD COLUMN invitation_status TEXT DEFAULT 'pending'",
        "ALTER TABLE interviews ADD COLUMN meeting_provider TEXT DEFAULT 'none'",
        "ALTER TABLE interviews ADD COLUMN updated_at TIMESTAMP",
    ]

    for migration in migrations:
        try:
            conn.execute(migration)
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists

    conn.close()


def save_interview(
    user_email: str,
    candidate_name: str,
    job_id: str,
    date: str,
    time: str,
    meeting_type: str,
    duration_minutes: int = 30,
    timezone: str = "UTC",
    meeting_link: str = None,
    calendar_event_id: str = None,
    candidate_email: str = None,
    candidate_phone: str = None,
    meeting_provider: str = "none",
    invitation_status: str = "pending",
) -> int:
    """Save interview and return the new row ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('''
        INSERT INTO interviews (
            user_email, candidate_name, job_id, date, time, meeting_type,
            duration_minutes, timezone, meeting_link, calendar_event_id,
            candidate_email, candidate_phone, recruiter_email,
            meeting_provider, invitation_status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_email, candidate_name, job_id, date, time, meeting_type,
        duration_minutes, timezone, meeting_link, calendar_event_id,
        candidate_email, candidate_phone, user_email,
        meeting_provider, invitation_status, datetime.now(), datetime.now()
    ))
    interview_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return interview_id


def get_interviews_db(user_email: str) -> List[Dict]:
    """Get all interviews for a recruiter."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        'SELECT * FROM interviews WHERE user_email = ? ORDER BY date DESC, time DESC',
        (user_email,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_interview_by_id(interview_id: int) -> Optional[Dict]:
    """Get a single interview by ID."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM interviews WHERE id = ?', (interview_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def check_duplicate_interview(
    user_email: str, candidate_name: str, job_id: str, date: str, time: str
) -> bool:
    """Check if an identical interview already exists (duplicate prevention)."""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute('''
        SELECT COUNT(*) as cnt FROM interviews 
        WHERE user_email = ? AND candidate_name = ? AND job_id = ? 
              AND date = ? AND time = ? AND status = 'scheduled'
    ''', (user_email, candidate_name, job_id, date, time)).fetchone()
    conn.close()
    return row[0] > 0 if row else False


def update_interview_status(interview_id: int, status: str):
    """Update interview status (scheduled, cancelled, completed, rescheduled)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        'UPDATE interviews SET status = ?, updated_at = ? WHERE id = ?',
        (status, datetime.now(), interview_id)
    )
    conn.commit()
    conn.close()


# Initialize on import
init_interview_table()
