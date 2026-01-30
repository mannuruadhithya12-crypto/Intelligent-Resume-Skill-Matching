# API Documentation

This directory contains the FastAPI backend services for the Intelligent Resume Skill Matching System.

## 🚀 Quick Start

```bash
# Navigate to the API directory
cd api

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📚 API Endpoints

### Core Matching Endpoints

#### POST `/analyze`
Analyzes a resume against a job description and provides matching scores.

**Request Body:**
```json
{
  "resume_text": "Full resume content...",
  "job_description": "Job description text...",
  "job_title": "Software Engineer"
}
```

**Response:**
```json
{
  "match_score": 85.5,
  "skill_score": 90.0,
  "experience_score": 80.0,
  "education_score": 75.0,
  "recommendations": [
    "Consider adding more experience with cloud technologies",
    "Highlight leadership experience in projects"
  ],
  "skill_gaps": [
    "Docker",
    "Kubernetes"
  ]
}
```

#### POST `/upload-resume`
Uploads and processes a resume file (PDF, DOCX, TXT).

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- File: resume (file)

**Response:**
```json
{
  "extracted_text": "Resume text content...",
  "skills": ["Python", "Machine Learning", "SQL"],
  "experience_years": 3.5,
  "education_level": "Bachelor's"
}
```

### Authentication Endpoints

#### POST `/auth/register`
Registers a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "recruiter"
}
```

#### POST `/auth/login`
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### User Management Endpoints

#### GET `/users/profile`
Get current user profile (requires authentication).

#### PUT `/users/profile`
Update user profile (requires authentication).

#### GET `/users/{user_id}/history`
Get user's analysis history (requires authentication).

### Batch Processing Endpoints

#### POST `/batch-analyze`
Analyze multiple resumes against a job description.

**Request Body:**
```json
{
  "job_description": "Job description text...",
  "resumes": [
    {"text": "Resume 1 content..."},
    {"text": "Resume 2 content..."}
  ]
}
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in your requests:

```bash
curl -X GET "http://localhost:8000/users/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {...}
  }
}
```

## 🛠️ Development

### File Structure
```
api/
├── main.py              # Main FastAPI application
├── models.py            # Pydantic models for request/response
├── schemas_auth.py      # Authentication schemas
├── auth_utils.py        # Authentication utilities
└── inference.py         # ML model inference logic
```

### Running in Development Mode
```bash
# With hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# With debug logging
uvicorn main:app --reload --log-level debug
```

### API Documentation
When running the server, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔧 Configuration

Environment variables:
- `DATABASE_URL`: Database connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `JWT_ALGORITHM`: JWT algorithm (default: HS256)
- `JWT_EXPIRE_MINUTES`: Token expiration time in minutes

## 📝 Error Codes

| Error Code | Description |
|------------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| VALIDATION_001 | Invalid input data |
| PROCESSING_001 | File processing error |
| MODEL_001 | Model inference error |

## 🧪 Testing

```bash
# Run API tests
python -m pytest tests/test_api.py

# Run specific test
python -m pytest tests/test_api.py::test_analyze_endpoint
```

## 📈 Performance

- Average response time: < 500ms
- File size limit: 10MB per resume
- Concurrent requests: 100+
- Supported formats: PDF, DOCX, TXT

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting (configurable)
- CORS enabled for frontend domain
- File type validation for uploads