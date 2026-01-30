"""
Enhanced Authentication System with Role-Based Access Control (RBAC)
Supports: Admin, HR Manager, Recruiter, Viewer roles
"""

import sqlite3
import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from enum import Enum

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-very-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
DB_PATH = "users.db"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- User Roles Enum ---
class UserRole(str, Enum):
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    RECRUITER = "recruiter"
    VIEWER = "viewer"

# Role Permissions Matrix
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        "can_create_users": True,
        "can_delete_users": True,
        "can_update_users": True,
        "can_view_analytics": True,
        "can_analyze_resumes": True,
        "can_view_results": True,
        "can_export_data": True,
        "can_manage_roles": True,
        "can_configure_system": True
    },
    UserRole.HR_MANAGER: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_update_users": False,
        "can_view_analytics": True,
        "can_analyze_resumes": True,
        "can_view_results": True,
        "can_export_data": True,
        "can_manage_roles": False,
        "can_configure_system": False
    },
    UserRole.RECRUITER: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_update_users": False,
        "can_view_analytics": False,
        "can_analyze_resumes": True,
        "can_view_results": True,
        "can_export_data": False,
        "can_manage_roles": False,
        "can_configure_system": False
    },
    UserRole.VIEWER: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_update_users": False,
        "can_view_analytics": False,
        "can_analyze_resumes": False,
        "can_view_results": True,
        "can_export_data": False,
        "can_manage_roles": False,
        "can_configure_system": False
    }
}

# --- Models ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None
    full_name: Optional[str] = None

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.RECRUITER
    company_id: Optional[int] = None

class User(UserBase):
    username: str  # In ours, username IS email
    full_name: Optional[str] = None
    role: UserRole = UserRole.RECRUITER
    company_id: Optional[int] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class UserResponse(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str
    company_id: Optional[int] = None
    disabled: bool = False

# --- Database Utils ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with users and companies tables"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Companies table for multi-tenant support
    c.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
        )
    ''')
    
    # Enhanced users table with RBAC
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT,
            full_name TEXT,
            role TEXT DEFAULT 'recruiter',
            company_id INTEGER,
            disabled INTEGER DEFAULT 0,
            provider TEXT DEFAULT 'local',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
    ''')
    
    # Activity log table
    c.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Retrieve user by email"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user:
        return UserInDB(
            username=user['email'],
            email=user['email'],
            full_name=user['full_name'],
            role=UserRole(user['role']),
            company_id=user['company_id'],
            hashed_password=user['hashed_password'],
            disabled=bool(user['disabled'])
        )
    return None

def get_user_by_id(user_id: int) -> Optional[UserResponse]:
    """Retrieve user by ID"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if user:
        return UserResponse(
            email=user['email'],
            full_name=user['full_name'],
            role=user['role'],
            company_id=user['company_id'],
            disabled=bool(user['disabled'])
        )
    return None

def create_user_db(user: UserCreate) -> bool:
    """Create a new user in the database"""
    hashed_password = pwd_context.hash(user.password) if user.password else None
    conn = get_db_connection()
    
    try:
        conn.execute(
            '''INSERT INTO users (email, hashed_password, full_name, role, company_id) 
               VALUES (?, ?, ?, ?, ?)''',
            (user.email, hashed_password, user.full_name, user.role.value, user.company_id)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def update_password_db(email: str, hashed_password: str) -> bool:
    """Update user password"""
    conn = get_db_connection()
    try:
        conn.execute(
            'UPDATE users SET hashed_password = ? WHERE email = ?',
            (hashed_password, email)
        )
        conn.commit()
        return True
    finally:
        conn.close()

def update_last_login(email: str):
    """Update user's last login timestamp"""
    conn = get_db_connection()
    conn.execute(
        'UPDATE users SET last_login = ? WHERE email = ?',
        (datetime.utcnow(), email)
    )
    conn.commit()
    conn.close()

def log_activity(user_email: str, action: str, details: str = ""):
    """Log user activity"""
    conn = get_db_connection()
    user = conn.execute('SELECT id FROM users WHERE email = ?', (user_email,)).fetchone()
    
    if user:
        conn.execute(
            'INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)',
            (user['id'], action, details)
        )
        conn.commit()
    conn.close()

def get_all_users(company_id: Optional[int] = None) -> List[UserResponse]:
    """Get all users, optionally filtered by company"""
    conn = get_db_connection()
    
    if company_id:
        users = conn.execute(
            'SELECT * FROM users WHERE company_id = ? ORDER BY created_at DESC',
            (company_id,)
        ).fetchall()
    else:
        users = conn.execute('SELECT * FROM users ORDER BY created_at DESC').fetchall()
    
    conn.close()
    
    return [
        UserResponse(
            email=user['email'],
            full_name=user['full_name'],
            role=user['role'],
            company_id=user['company_id'],
            disabled=bool(user['disabled'])
        )
        for user in users
    ]

def create_company(name: str) -> Optional[int]:
    """Create a new company"""
    conn = get_db_connection()
    try:
        cursor = conn.execute('INSERT INTO companies (name) VALUES (?)', (name,))
        company_id = cursor.lastrowid
        conn.commit()
        return company_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

# --- Auth Logic ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def check_permission(user_role: UserRole, permission: str) -> bool:
    """Check if a role has a specific permission"""
    role_perms = ROLE_PERMISSIONS.get(user_role, {})
    return role_perms.get(permission, False)

def create_default_admin():
    """Create default admin user if none exists"""
    conn = get_db_connection()
    admin_count = conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    ).fetchone()['count']
    conn.close()
    
    if admin_count == 0:
        default_admin = UserCreate(
            email="admin@company.com",
            password="admin123",  # Change this in production!
            full_name="System Administrator",
            role=UserRole.ADMIN,
            company_id=None
        )
        if create_user_db(default_admin):
            print("✓ Default admin user created: admin@company.com / admin123")
            print("⚠️  IMPORTANT: Change the default admin password immediately!")

# --- Initialize Database ---
init_db()

# Migrate existing tables (add new columns if they don't exist)
try:
    conn = get_db_connection()
    
    # Try to add new columns (will fail silently if they exist)
    migrations = [
        "ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'",
        "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'recruiter'",
        "ALTER TABLE users ADD COLUMN company_id INTEGER",
        "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE users ADD COLUMN last_login TIMESTAMP"
    ]
    
    for migration in migrations:
        try:
            conn.execute(migration)
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    conn.close()
except Exception as e:
    print(f"Migration note: {e}")

# Create default admin if needed
create_default_admin()
