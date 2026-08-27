"""
Google Calendar + Meet Integration Service for RecruitAI Enterprise

Handles:
- Google OAuth2 flow (authorization, token exchange, refresh)
- Google Calendar event creation with Meet conference
- Attendee management
- Encrypted token storage per recruiter

Security:
- Tokens encrypted at rest using Fernet symmetric encryption
- Minimum OAuth scopes
- Per-user token isolation
- Automatic token refresh
"""

import os
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

# --- Configuration from environment ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/google/callback")

# Encryption key for token storage — generate once and store in env
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
TOKEN_ENCRYPTION_KEY = os.getenv("GOOGLE_TOKEN_ENCRYPTION_KEY", "")

# Minimum scopes for Calendar event + Meet conference creation
# openid + email are needed to retrieve the user's Google email during OAuth
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]

# Database path (same as interview_db)
from api.history_db import DB_PATH


def _get_fernet() -> Optional[Fernet]:
    """Get Fernet cipher for token encryption. Returns None if key not configured."""
    if not TOKEN_ENCRYPTION_KEY:
        logger.warning("GOOGLE_TOKEN_ENCRYPTION_KEY not set. Token encryption disabled.")
        return None
    try:
        return Fernet(TOKEN_ENCRYPTION_KEY.encode() if isinstance(TOKEN_ENCRYPTION_KEY, str) else TOKEN_ENCRYPTION_KEY)
    except Exception as e:
        logger.error(f"Invalid GOOGLE_TOKEN_ENCRYPTION_KEY: {e}")
        return None


def _encrypt_token(token_data: dict) -> str:
    """Encrypt token data before storage."""
    raw = json.dumps(token_data)
    fernet = _get_fernet()
    if fernet:
        return fernet.encrypt(raw.encode()).decode()
    # Fallback: base64-like obfuscation (not secure, but better than plaintext)
    import base64
    return "UNENCRYPTED:" + base64.b64encode(raw.encode()).decode()


def _decrypt_token(encrypted: str) -> Optional[dict]:
    """Decrypt stored token data."""
    if not encrypted:
        return None
    try:
        if encrypted.startswith("UNENCRYPTED:"):
            import base64
            raw = base64.b64decode(encrypted[12:]).decode()
            return json.loads(raw)
        fernet = _get_fernet()
        if fernet:
            raw = fernet.decrypt(encrypted.encode()).decode()
            return json.loads(raw)
        return None
    except Exception as e:
        logger.error(f"Token decryption failed: {e}")
        return None


# --- Token Storage (SQLite) ---

def init_google_tokens_table():
    """Create google_tokens table if not exists."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS google_tokens (
            user_email TEXT PRIMARY KEY,
            encrypted_token TEXT NOT NULL,
            google_email TEXT,
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def store_google_token(user_email: str, token_data: dict, google_email: str = None):
    """Store encrypted Google OAuth token for a user."""
    encrypted = _encrypt_token(token_data)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        INSERT INTO google_tokens (user_email, encrypted_token, google_email, connected_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_email) DO UPDATE SET 
            encrypted_token = excluded.encrypted_token,
            google_email = excluded.google_email,
            updated_at = excluded.updated_at
    ''', (user_email, encrypted, google_email, datetime.now(), datetime.now()))
    conn.commit()
    conn.close()


def get_google_token(user_email: str) -> Optional[dict]:
    """Retrieve and decrypt Google OAuth token for a user."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        'SELECT encrypted_token FROM google_tokens WHERE user_email = ?',
        (user_email,)
    ).fetchone()
    conn.close()
    if row:
        return _decrypt_token(row['encrypted_token'])
    return None


def get_google_status(user_email: str) -> dict:
    """Check if a user has Google Calendar connected."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        'SELECT google_email, connected_at FROM google_tokens WHERE user_email = ?',
        (user_email,)
    ).fetchone()
    conn.close()
    if row:
        return {
            "connected": True,
            "google_email": row['google_email'],
            "connected_at": row['connected_at']
        }
    return {"connected": False, "google_email": None, "connected_at": None}


def delete_google_token(user_email: str):
    """Remove Google OAuth token for a user (disconnect)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('DELETE FROM google_tokens WHERE user_email = ?', (user_email,))
    conn.commit()
    conn.close()


# --- Google OAuth2 Flow ---

def get_google_auth_url(user_email: str) -> Optional[str]:
    """Generate Google OAuth2 authorization URL."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return None

    try:
        from google_auth_oauthlib.flow import Flow

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                }
            },
            scopes=GOOGLE_SCOPES,
        )
        flow.redirect_uri = GOOGLE_REDIRECT_URI

        authorization_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=user_email,  # Pass user email as state for callback association
        )
        return authorization_url
    except Exception as e:
        logger.error(f"Failed to generate Google auth URL: {e}")
        return None


def handle_google_callback(code: str, state: str) -> dict:
    """Handle Google OAuth2 callback — exchange code for tokens."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return {"success": False, "error": "Google credentials not configured"}

    try:
        from google_auth_oauthlib.flow import Flow

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                }
            },
            scopes=GOOGLE_SCOPES,
        )
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        flow.fetch_token(code=code)

        credentials = flow.credentials
        token_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else GOOGLE_SCOPES,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
        }

        # Get the Google user's email
        from googleapiclient.discovery import build
        service = build("oauth2", "v2", credentials=credentials)
        user_info = service.userinfo().get().execute()
        google_email = user_info.get("email", "")

        # state = recruiter's RecruitAI email
        user_email = state
        store_google_token(user_email, token_data, google_email)

        return {"success": True, "google_email": google_email}

    except Exception as e:
        logger.error(f"Google OAuth callback failed: {e}")
        return {"success": False, "error": str(e)}


def _get_google_credentials(user_email: str):
    """Build Google credentials from stored token, refreshing if needed."""
    token_data = get_google_token(user_email)
    if not token_data:
        return None

    try:
        from google.oauth2.credentials import Credentials

        creds = Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=token_data.get("client_id", GOOGLE_CLIENT_ID),
            client_secret=token_data.get("client_secret", GOOGLE_CLIENT_SECRET),
            scopes=token_data.get("scopes", GOOGLE_SCOPES),
        )

        # Check if token needs refresh
        if creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            # Store refreshed token
            refreshed_data = {
                "token": creds.token,
                "refresh_token": creds.refresh_token,
                "token_uri": creds.token_uri,
                "client_id": creds.client_id,
                "client_secret": creds.client_secret,
                "scopes": list(creds.scopes) if creds.scopes else GOOGLE_SCOPES,
                "expiry": creds.expiry.isoformat() if creds.expiry else None,
            }
            store_google_token(user_email, refreshed_data)

        return creds

    except Exception as e:
        logger.error(f"Failed to build/refresh Google credentials for {user_email}: {e}")
        # If refresh fails, the connection is stale
        return None


# --- Google Calendar + Meet ---

def create_calendar_event_with_meet(
    recruiter_email: str,
    summary: str,
    description: str,
    start_datetime: str,  # ISO format
    end_datetime: str,  # ISO format
    timezone: str,
    attendee_email: str,
) -> dict:
    """
    Create a Google Calendar event with Google Meet conference.
    
    Returns:
        {
            "success": True/False,
            "meeting_link": "https://meet.google.com/...",
            "calendar_event_id": "...",
            "html_link": "https://calendar.google.com/...",
            "error": "..." (if failed)
        }
    """
    creds = _get_google_credentials(recruiter_email)
    if not creds:
        return {
            "success": False,
            "error": "Google Calendar connection expired. Please reconnect in Settings.",
        }

    try:
        from googleapiclient.discovery import build
        import uuid

        service = build("calendar", "v3", credentials=creds)

        event_body = {
            "summary": summary,
            "description": description,
            "start": {
                "dateTime": start_datetime,
                "timeZone": timezone,
            },
            "end": {
                "dateTime": end_datetime,
                "timeZone": timezone,
            },
            "attendees": [
                {"email": attendee_email},
            ],
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {
                        "type": "hangoutsMeet",
                    },
                },
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 60},
                    {"method": "popup", "minutes": 15},
                ],
            },
        }

        event = service.events().insert(
            calendarId="primary",
            body=event_body,
            conferenceDataVersion=1,
            sendUpdates="all",  # Send invitation to attendees
        ).execute()

        # Extract Meet link
        meeting_link = None
        conference_data = event.get("conferenceData")
        if conference_data:
            entry_points = conference_data.get("entryPoints", [])
            for ep in entry_points:
                if ep.get("entryPointType") == "video":
                    meeting_link = ep.get("uri")
                    break

        return {
            "success": True,
            "meeting_link": meeting_link,
            "calendar_event_id": event.get("id"),
            "html_link": event.get("htmlLink"),
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Google Calendar event creation failed: {error_msg}")

        # Check for specific error types
        if "invalid_grant" in error_msg.lower() or "token" in error_msg.lower():
            return {
                "success": False,
                "error": "Google Calendar connection expired. Please reconnect in Settings.",
            }

        return {
            "success": False,
            "error": f"Failed to create Google Calendar event: {error_msg}",
        }


# Initialize table on import
init_google_tokens_table()
