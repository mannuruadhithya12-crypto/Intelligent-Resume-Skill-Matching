# 🚀 Quick Start Guide - Intelligent Resume Matching System

## Overview
This guide will help you get the system up and running in under 5 minutes.

---

## 📋 Prerequisites

- **Python:** 3.8 or higher
- **Node.js:** 16 or higher
- **pip:** Latest version
- **npm:** Latest version

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Python Dependencies
```bash
cd c:\Intelligent_Resume_Skill_Matching_Project
pip install -r requirements.txt
```

**Key packages installed:**
- FastAPI (API framework)
- Sentence-Transformers (BERT models)
- scikit-learn (ML algorithms)
- pdfplumber (PDF parsing)
- python-docx (DOCX parsing)

### Step 2: Download NLTK Data
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Step 3: Start the Backend API
```bash
python app.py
```

**Expected output:**
```
✓ Loaded ensemble model from models/ensemble_classifier.pkl
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**API will be available at:** `http://localhost:8000`

### Step 4: Install Frontend Dependencies
Open a **new terminal** and run:
```bash
cd frontend
npm install
```

### Step 5: Start the Frontend
```bash
npm run dev
```

**Expected output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Frontend will be available at:** `http://localhost:5173`

---

## 🎯 First Analysis

### Option 1: Web Interface (Recommended)

1. **Open browser:** Navigate to `http://localhost:5173`

2. **Upload Job Description:**
   - Click "Upload Job Description"
   - Paste JD text or upload file
   - Example JD:
     ```
     We are looking for a Data Scientist with 3+ years of experience.
     Required skills: Python, Machine Learning, SQL, TensorFlow, AWS
     ```

3. **Upload Resumes:**
   - Click "Upload Resumes"
   - Select one or multiple PDF/DOCX files
   - Maximum 10MB per file

4. **Analyze:**
   - Click "Analyze Candidates"
   - Wait for processing (progress bar shown)
   - View results with:
     - Match scores
     - Skill gaps
     - Learning recommendations
     - Job role suggestions

### Option 2: API Direct (For Developers)

```bash
# Test the API
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "job_description=@jd.txt" \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"
```

**Response:**
```json
{
  "job_id": "abc-123-def",
  "status": "processing",
  "message": "Analysis started"
}
```

**Check status:**
```bash
curl "http://localhost:8000/api/status/abc-123-def"
```

**Get results:**
```bash
curl "http://localhost:8000/api/results/abc-123-def"
```

---

## 📊 Understanding the Results

### Result Fields Explained

```json
{
  "final_score": 85.5,              // Overall match score (0-100%)
  "match_classification": "Excellent Fit",  // Excellent/Good/Partial/Not Suitable
  "confidence_score": "High",       // High/Medium/Low
  
  "semantic_score": 87.0,           // BERT semantic similarity
  "skill_overlap_score": 82.0,      // Skill match percentage
  "experience_score": 90.0,         // Experience match
  "education_score": 80.0,          // Education match
  
  "matched_skills": [               // Skills found in resume
    "python", "machine learning", "sql"
  ],
  
  "missing_skills": [               // Skills to improve
    "tensorflow", "aws"
  ],
  
  "learning_paths": [               // Recommended courses
    {
      "skill": "tensorflow",
      "resources": [...]
    }
  ],
  
  "recommended_roles": [            // Alternative job suggestions
    ["Data Scientist", 85.5],
    ["ML Engineer", 78.0]
  ]
}
```

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file in project root:
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Security
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id

# Database
DATABASE_URL=sqlite:///users.db

# Model Path
MODEL_PATH=models/ensemble_classifier.pkl
```

### Custom Skill Database

Edit `src/feature_extraction/skill_extractor.py` to add custom skills:
```python
SKILLS_DATABASE = {
    "programming": [
        "python", "java", "javascript",
        "your-custom-skill"  # Add here
    ],
    # ... more categories
}
```

---

## 🧪 Verify Installation

Run the feature test script:
```bash
python test_features.py
```

**Expected output:**
```
🎉 ALL TESTS PASSED! System is ready for deployment.
```

---

## 📁 Project Structure

```
Intelligent_Resume_Skill_Matching_Project/
├── api/                    # FastAPI backend
│   ├── main.py            # API endpoints
│   ├── inference.py       # ML inference engine
│   ├── auth_utils.py      # Authentication
│   └── models.py          # Data models
│
├── src/                   # Core ML modules
│   ├── matching/          # Matching algorithms
│   ├── recommendation/    # Recommendations
│   ├── explainability/    # Score breakdown
│   ├── feature_extraction/# Resume parsing
│   └── preprocessing/     # Text cleaning
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   └── api.js         # API client
│   └── package.json
│
├── models/                # Trained ML models
├── data/                  # Sample data
├── tests/                 # Test suite
├── app.py                 # Main Flask app
└── requirements.txt       # Python dependencies
```

---

## 🎨 Features Available

### ✅ Core Features
1. ✅ Semantic Skill Matching (BERT)
2. ✅ Explainable Scoring System
3. ✅ Skill Gap Recommendations
4. ✅ Experience-Weighted Ranking
5. ✅ Bias-Reduced Hiring
6. ✅ Automated Resume Parsing (PDF/DOCX)
7. ✅ Real-Time Analysis

### ✅ Advanced Features
8. ✅ Multi-Level Match Classification
9. ✅ Role-Specific Skill Weighting
10. ✅ Skill Proficiency Estimation
11. ✅ Context-Aware Matching
12. ✅ Confidence Score
13. ✅ Learning Path Recommendations
14. ✅ Job Role Suggestions

### ✅ Analytics Features
15. ✅ Visual Score Dashboard
16. ✅ Bias Audit Report
17. ✅ Model Performance Metrics
18. ✅ Model Drift Monitoring

### ✅ System Features
19. ✅ Batch Resume Processing
20. ✅ Asynchronous Processing
21. ✅ Role-Based Access Control
22. ✅ Secure File Handling

**Total: 22/22 Features Implemented** 🎉

---

## 🐛 Troubleshooting

### Issue: "Model not found"
**Solution:** The system will use rule-based scoring if no trained model exists. This is normal for first-time setup.

### Issue: "NLTK data not found"
**Solution:** Run:
```bash
python -c "import nltk; nltk.download('all')"
```

### Issue: "Port 8000 already in use"
**Solution:** Change port in `app.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Issue: "Frontend can't connect to API"
**Solution:** Check CORS settings in `api/main.py`:
```python
allow_origins=["http://localhost:5173"]
```

### Issue: "Sentence-Transformers slow to load"
**Solution:** First load takes 1-2 minutes to download BERT model. Subsequent loads are instant.

---

## 📚 API Documentation

### Interactive Docs
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Upload and analyze resumes |
| `/api/status/{job_id}` | GET | Check analysis status |
| `/api/results/{job_id}` | GET | Get analysis results |
| `/api/analytics` | GET | System analytics |
| `/api/learning-path/{job_id}/{filename}` | GET | Learning recommendations |
| `/auth/register` | POST | Register new user |
| `/auth/token` | POST | Login |
| `/health` | GET | System health check |

---

## 🚀 Next Steps

1. **Upload Sample Data:**
   - Place resumes in `data/resumes/`
   - Place job descriptions in `data/job_descriptions/`

2. **Train Custom Model:**
   ```bash
   python src/training/train_model.py
   ```

3. **Customize UI:**
   - Edit `frontend/src/components/`
   - Modify colors in `frontend/src/index.css`

4. **Deploy to Production:**
   - See `docker-compose.yml` for containerized deployment
   - Configure environment variables
   - Set up PostgreSQL (replace SQLite)

---

## 🤝 Support

- **Documentation:** See `README.md` and `FEATURES_IMPLEMENTED.md`
- **API Docs:** http://localhost:8000/docs
- **Test Suite:** `python test_features.py`

---

## ✨ Quick Tips

1. **Faster Processing:** Use batch upload for multiple resumes
2. **Better Accuracy:** Provide detailed job descriptions
3. **Custom Skills:** Add industry-specific skills to database
4. **Role Matching:** Specify job role for better weighting
5. **Learning Paths:** Check recommendations for skill gaps

---

**🎉 You're all set! Start analyzing resumes now!**

*For detailed feature documentation, see `FEATURES_IMPLEMENTED.md`*
