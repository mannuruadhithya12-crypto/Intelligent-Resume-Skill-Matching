# Intelligent Resume Skill Matching System (Enterprise Edition)

The Intelligent Resume Skill Matching System is designed as a scalable, explainable, and ethical AI-powered recruitment platform. The features are organized into core, advanced, and future-ready modules to reflect real-world production systems.

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🛠️ Installation](#️-installation)
- [💻 Usage](#-usage)
- [🏗️ Project Structure](#️-project-structure)
- [🧠 Core Features](#-core-features)
- [🔧 Development](#-development)
- [🐳 Docker Deployment](#-docker-deployment)
- [📊 API Documentation](#-api-documentation)

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd Intelligent_Resume_Skill_Matching_Project

# Set up Python environment
pip install -r requirements.txt

# Start the backend API
python app.py

# Set up frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the web application.

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Download required NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Database Setup
The system uses SQLite (users.db) which is created automatically on first run.

## 🧠 Core Features (Implemented)

### 1️⃣ Semantic Skill Matching
- **Technology**: BERT (Sentence-Transformers)
- Uses NLP and Sentence-BERT embeddings to match resumes and job descriptions based on semantic meaning rather than exact keywords. This enables accurate matching even when different terminologies or synonyms are used.

### 2️⃣ Explainable Scoring System
- **Module**: `src/explainability/score_breakdown.py`
- Generates transparent and interpretable matching scores by breaking down contributions from skills, experience, and education. This avoids black-box decision making and builds trust in AI-driven recruitment.

### 3️⃣ Skill Gap Recommendation
- **Module**: `src/recommendation/skill_gap_recommender.py`
- Identifies missing or weak skills required for a job role and provides actionable recommendations to improve candidate suitability and employability.

### 4️⃣ Experience-Weighted Candidate Ranking
- **Module**: `src/matching/experience_weight.py`
- Ranks candidates by balancing skill relevance with years of experience, ensuring fair evaluation for both freshers and experienced professionals.

### 5️⃣ Bias-Reduced Hiring Mechanism
- **Module**: `src/matching/bias_filter.py`
- Removes personal identifiers such as name, gender, age, and institution details, ensuring candidates are evaluated purely on skills, experience, and qualifications.

### 6️⃣ Automated Resume Parsing
- **Supports**: PDF, DOCX, TXT
- Automatically extracts text, skills, and experience for analysis without manual intervention.

### 7️⃣ Real-Time Resume Analysis
- **Infrastructure**: FastAPI + React + WebSockets/Polling
- Generates matching scores, rankings, and recommendations instantly after resume and job description upload.

---

## 🚀 Advanced AI & ML Features (Enhancement Phase)

### 8️⃣ Multi-Level Match Classification
Classifies candidates into categories such as Excellent Fit, Good Fit, Partial Fit, and Not Suitable instead of simple binary decisions.

### 9️⃣ Role-Specific Skill Weighting
Assigns different importance levels to skills based on job roles (e.g., Data Scientist, DevOps Engineer), improving real-world hiring accuracy.

### 🔟 Skill Proficiency Estimation
Estimates the strength of individual skills based on experience duration, project usage, and frequency of mention in resumes.

### 1️⃣1️⃣ Context-Aware Skill Matching
Understands how a skill is used (e.g., Python for Machine Learning vs Python for Automation) using contextual NLP analysis.

### 1️⃣2️⃣ Confidence Score for Decisions
Provides a confidence level (High / Medium / Low) along with the match score to indicate prediction reliability.

### 1️⃣3️⃣ Learning Path Recommendation
Suggests courses, certifications, and projects that candidates can pursue to improve their job match score.

### 1️⃣4️⃣ Job Role Recommendation
Recommends alternative job roles based on resume content using clustering and similarity analysis.

---

## 📊 Analytics, Explainability & Evaluation Features

### 1️⃣5️⃣ Visual Score Breakdown Dashboard
Displays graphical representations (charts and bars) of skill, experience, and education scores for better interpretability.

### 1️⃣6️⃣ Bias Audit Report
Generates reports confirming that hiring decisions are unaffected by sensitive attributes, promoting ethical and fair AI practices.

### 1️⃣7️⃣ Model Performance Evaluation
Evaluates model performance using Accuracy, Precision, Recall, and F1-score to ensure balanced and reliable predictions.

### 1️⃣8️⃣ Model Drift Monitoring
Tracks changes in model performance over time and alerts when retraining is required.

---

## 🧱 System & Engineering Features

### 1️⃣9️⃣ Batch Resume Processing
Allows recruiters to upload and analyze hundreds or thousands of resumes simultaneously.

### 2️⃣0️⃣ Asynchronous Processing
Uses background task queues to process large workloads without blocking the user interface.

### 2️⃣1️⃣ Role-Based Access Control
Provides different access levels for Admin, HR, and Recruiter roles.

### 2️⃣2️⃣ Secure File Handling
Encrypts resumes at rest and during transfer to ensure data privacy and security.

---

## 💻 Usage

### Web Interface
1. Access the application at `http://localhost:5173`
2. Upload resumes (PDF, DOCX, TXT formats supported)
3. Provide job descriptions
4. View matching scores, rankings, and recommendations
5. Analyze detailed breakdowns and skill gap analysis

### API Usage
```bash
# Start the API server
python app.py

# Example API call
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "Your resume text...", "job_description": "Job description..."}'
```

## 🏗️ Project Structure

```
Intelligent_Resume_Skill_Matching_Project/
├── api/                    # FastAPI backend services
├── app.py                  # Main Flask application
├── config/                 # Configuration files
├── data/                   # Sample data and datasets
├── frontend/               # React frontend application
├── models/                 # Trained ML models
├── src/                    # Core ML and NLP modules
│   ├── explainability/     # Score breakdown and transparency
│   ├── feature_extraction/ # Resume parsing and feature extraction
│   ├── matching/           # Semantic matching algorithms
│   ├── recommendation/     # Skill gap analysis
│   └── preprocessing/      # Data preprocessing
├── templates/              # HTML templates
├── tests/                  # Test suite
├── docker-compose.yml      # Docker configuration
└── requirements.txt        # Python dependencies
```

## 🔧 Development

### Running Tests
```bash
# Run the test suite
python tests/test_system.py

# Run with pytest (if installed)
pytest tests/
```

### Code Quality
```bash
# Install development dependencies
pip install flake8 black pytest

# Format code
black .

# Lint code
flake8 .
```

### Adding New Features
1. Core ML logic goes in `src/` modules
2. API endpoints in `api/` directory
3. Frontend components in `frontend/src/`
4. Tests in `tests/` directory

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

## 📊 API Documentation

See [api/README.md](api/README.md) for detailed API documentation including endpoints, request/response formats, and authentication.

## 🏆 Feature Summary
The system combines semantic NLP, supervised machine learning, explainable AI, ethical hiring principles, and scalable system design to deliver a production-ready recruitment intelligence platform suitable for real-world enterprise use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

[Add your license information here]
