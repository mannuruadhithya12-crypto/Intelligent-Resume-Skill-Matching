# 🔐 Role-Based Access Control (RBAC) Documentation

## Overview

The Intelligent Resume Matching System implements enterprise-grade Role-Based Access Control (RBAC) to ensure secure, scalable, and compliant access management for company users.

---

## 👥 User Roles

### 1. **Admin** 🔴
**Full system access with administrative privileges**

**Permissions:**
- ✅ Create, update, and delete users
- ✅ Manage user roles
- ✅ Create and manage companies
- ✅ View all analytics across companies
- ✅ Analyze resumes
- ✅ View all results
- ✅ Export data
- ✅ Configure system settings
- ✅ Access audit logs

**Use Cases:**
- System administrators
- IT managers
- Platform owners

---

### 2. **HR Manager** 🟡
**Comprehensive recruitment management**

**Permissions:**
- ✅ View analytics (company-specific)
- ✅ Analyze resumes
- ✅ View all results (company-specific)
- ✅ Export data
- ❌ Cannot create/delete users
- ❌ Cannot manage roles
- ❌ Cannot configure system

**Use Cases:**
- HR department heads
- Talent acquisition managers
- Recruitment team leaders

---

### 3. **Recruiter** 🟢
**Day-to-day recruitment operations**

**Permissions:**
- ✅ Analyze resumes
- ✅ View results (company-specific)
- ❌ Cannot view analytics
- ❌ Cannot export data
- ❌ Cannot create users
- ❌ Cannot manage roles

**Use Cases:**
- Recruiters
- Talent acquisition specialists
- Hiring coordinators

---

### 4. **Viewer** 🔵
**Read-only access**

**Permissions:**
- ✅ View results (company-specific)
- ❌ Cannot analyze resumes
- ❌ Cannot view analytics
- ❌ Cannot export data
- ❌ Cannot create users

**Use Cases:**
- Hiring managers (view-only)
- Stakeholders
- Auditors

---

## 🔑 Authentication Flow

### 1. **User Registration** (Admin Only)
```http
POST /auth/register
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "email": "recruiter@company.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role": "recruiter",
  "company_id": 1
}
```

**Response:**
```json
{
  "email": "recruiter@company.com",
  "full_name": "John Doe",
  "role": "recruiter",
  "company_id": 1,
  "disabled": false
}
```

---

### 2. **User Login**
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=recruiter@company.com&password=SecurePassword123!
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "recruiter",
  "full_name": "John Doe"
}
```

---

### 3. **Using the Token**
All subsequent requests must include the token in the Authorization header:

```http
GET /api/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛡️ Security Measures

### 1. **Password Security**
- **Hashing Algorithm:** bcrypt
- **Salt Rounds:** Automatic (bcrypt default)
- **Password Requirements:** 
  - Minimum 8 characters (recommended)
  - Mix of letters, numbers, symbols (recommended)

### 2. **JWT Token Security**
- **Algorithm:** HS256
- **Expiration:** 24 hours
- **Claims:**
  - `sub`: User email
  - `role`: User role
  - `company_id`: Company ID
  - `exp`: Expiration timestamp

### 3. **HTTPS Communication**
- All production deployments must use HTTPS
- TLS 1.2 or higher required
- Certificate validation enforced

### 4. **Company-Level Data Isolation**
- Users can only access data from their own company
- Admins can access all companies
- Enforced at database and API level

---

## 📊 Permission Matrix

| Feature | Admin | HR Manager | Recruiter | Viewer |
|---------|-------|------------|-----------|--------|
| **User Management** |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| Update Users | ✅ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ |
| **Resume Analysis** |
| Analyze Resumes | ✅ | ✅ | ✅ | ❌ |
| View Results | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |
| View Analytics | ✅ | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| **System** |
| Configure System | ✅ | ❌ | ❌ | ❌ |
| Manage Companies | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 API Endpoints

### Authentication Endpoints

#### **POST /auth/register**
Create a new user (Admin only)

**Required Role:** Admin  
**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "full_name": "string",
  "role": "admin|hr_manager|recruiter|viewer",
  "company_id": 1
}
```

---

#### **POST /auth/token**
Login and get access token

**Public Endpoint**  
**Request Body:** (form-urlencoded)
```
username=email@company.com
password=SecurePassword123!
```

---

#### **GET /auth/me**
Get current user information

**Required:** Valid JWT token  
**Response:**
```json
{
  "email": "recruiter@company.com",
  "full_name": "John Doe",
  "role": "recruiter",
  "company_id": 1,
  "disabled": false
}
```

---

#### **GET /auth/me/permissions**
Get current user's permissions

**Required:** Valid JWT token  
**Response:**
```json
{
  "email": "recruiter@company.com",
  "role": "recruiter",
  "permissions": {
    "can_create_users": false,
    "can_delete_users": false,
    "can_view_analytics": false,
    "can_analyze_resumes": true,
    "can_view_results": true,
    "can_export_data": false,
    "can_manage_roles": false,
    "can_configure_system": false
  }
}
```

---

#### **GET /auth/users**
List all users

**Required Role:** HR Manager or Admin  
**Behavior:**
- Admins see all users across all companies
- HR Managers see only users from their company

---

#### **PUT /auth/users/role**
Update user role

**Required Role:** Admin  
**Request Body:**
```json
{
  "email": "user@company.com",
  "new_role": "hr_manager"
}
```

---

#### **POST /auth/companies**
Create a new company

**Required Role:** Admin  
**Request Body:**
```json
{
  "name": "Acme Corporation"
}
```

---

#### **GET /auth/companies**
List all companies

**Required Role:** Admin

---

#### **GET /auth/roles**
List all available roles and permissions

**Public Endpoint**

---

## 💻 Usage Examples

### Example 1: Admin Creates a New Recruiter

```python
import requests

# Admin login
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={
        "username": "admin@company.com",
        "password": "admin123"
    }
)
admin_token = login_response.json()["access_token"]

# Create new recruiter
headers = {"Authorization": f"Bearer {admin_token}"}
new_user = {
    "email": "recruiter@company.com",
    "password": "SecurePass123!",
    "full_name": "Jane Smith",
    "role": "recruiter",
    "company_id": 1
}

response = requests.post(
    "http://localhost:8000/auth/register",
    json=new_user,
    headers=headers
)
print(response.json())
```

---

### Example 2: Recruiter Analyzes Resumes

```python
import requests

# Recruiter login
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={
        "username": "recruiter@company.com",
        "password": "SecurePass123!"
    }
)
token = login_response.json()["access_token"]

# Upload and analyze resumes
headers = {"Authorization": f"Bearer {token}"}
files = {
    "job_description": open("jd.txt", "rb"),
    "resumes": [
        open("resume1.pdf", "rb"),
        open("resume2.pdf", "rb")
    ]
}

response = requests.post(
    "http://localhost:8000/api/analyze",
    files=files,
    headers=headers
)
print(response.json())
```

---

### Example 3: Check User Permissions

```python
import requests

# Login
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={
        "username": "user@company.com",
        "password": "password"
    }
)
token = login_response.json()["access_token"]

# Get permissions
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/auth/me/permissions",
    headers=headers
)
permissions = response.json()["permissions"]

# Check specific permission
if permissions["can_analyze_resumes"]:
    print("User can analyze resumes")
else:
    print("User cannot analyze resumes")
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
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
);
```

### Companies Table
```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active INTEGER DEFAULT 1
);
```

### Activity Log Table
```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🚀 Getting Started

### 1. Default Admin Account

On first startup, a default admin account is created:

**Email:** `admin@company.com`  
**Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately in production!

### 2. Create Your First Company

```bash
curl -X POST "http://localhost:8000/auth/companies" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company"}'
```

### 3. Create Users

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@mycompany.com",
    "password": "SecurePass123!",
    "full_name": "HR Manager",
    "role": "hr_manager",
    "company_id": 1
  }'
```

---

## 🔍 Audit & Compliance

### Activity Logging

All user actions are logged in the `activity_log` table:

- User creation
- Role changes
- Login attempts
- Resume analysis
- Data exports
- System configuration changes

### Viewing Audit Logs

```python
from api.auth_utils import get_db_connection

conn = get_db_connection()
logs = conn.execute('''
    SELECT u.email, a.action, a.details, a.timestamp
    FROM activity_log a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT 100
''').fetchall()

for log in logs:
    print(f"{log['timestamp']}: {log['email']} - {log['action']}")
```

---

## 🛠️ Production Deployment

### Environment Variables

```bash
# Required
SECRET_KEY=your-very-secure-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname

# Optional
GOOGLE_CLIENT_ID=your-google-oauth-client-id
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong SECRET_KEY (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up monitoring/alerts
- [ ] Review user permissions regularly
- [ ] Implement password complexity requirements

---

## 📞 Support

For questions or issues with RBAC:
1. Check API documentation: `http://localhost:8000/docs`
2. Review this documentation
3. Check activity logs for debugging

---

**Version:** 2.0.0  
**Last Updated:** 2026-01-28  
**Status:** ✅ Production Ready
