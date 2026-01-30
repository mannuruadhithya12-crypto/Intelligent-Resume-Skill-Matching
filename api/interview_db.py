import sqlite3
from typing import List, Dict
from datetime import datetime
from api.history_db import DB_PATH

def init_interview_table():
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
    conn.close()

def save_interview(user_email: str, candidate_name: str, job_id: str, date: str, time: str, meeting_type: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        INSERT INTO interviews (user_email, candidate_name, job_id, date, time, meeting_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_email, candidate_name, job_id, date, time, meeting_type, datetime.now()))
    conn.commit()
    conn.close()

def get_interviews_db(user_email: str) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute('SELECT * FROM interviews WHERE user_email = ? ORDER BY date, time', (user_email,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Initialize on import
init_interview_table()
