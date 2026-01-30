"""
FEATURE 9: Role-Specific Skill Weighting
Assigns different importance levels to skills based on job roles
"""

# Role-Specific Skill Multipliers
ROLE_SKILL_WEIGHTS = {
    "Data Scientist": {
        "python": 1.5,
        "machine learning": 1.5,
        "deep learning": 1.4,
        "sql": 1.2,
        "nlp": 1.3,
        "pandas": 1.2,
        "tensorflow": 1.4,
        "pytorch": 1.4,
        "statistics": 1.3,
        "excel": 0.8
    },
    "Frontend Developer": {
        "react": 1.5,
        "javascript": 1.4,
        "css": 1.3,
        "html": 1.2,
        "typescript": 1.4,
        "vue.js": 1.3,
        "angular": 1.3,
        "python": 0.5
    },
    "Backend Developer": {
        "python": 1.3,
        "java": 1.3,
        "sql": 1.4,
        "node.js": 1.3,
        "api": 1.3,
        "docker": 1.2,
        "aws": 1.2,
        "postgresql": 1.2
    },
    "DevOps Engineer": {
        "docker": 1.5,
        "kubernetes": 1.5,
        "aws": 1.4,
        "linux": 1.3,
        "jenkins": 1.3,
        "terraform": 1.4,
        "ansible": 1.3,
        "python": 1.1
    },
    "Full Stack Developer": {
        "react": 1.3,
        "node.js": 1.3,
        "python": 1.2,
        "sql": 1.2,
        "javascript": 1.3,
        "docker": 1.1,
        "git": 1.1
    }
}

# Scoring Component Weights by Role
ROLE_SCORING_WEIGHTS = {
    "Data Scientist": {
        "semantic": 0.35,
        "skills": 0.40,
        "experience": 0.15,
        "education": 0.10
    },
    "Frontend Developer": {
        "semantic": 0.30,
        "skills": 0.45,
        "experience": 0.20,
        "education": 0.05
    },
    "Backend Developer": {
        "semantic": 0.35,
        "skills": 0.40,
        "experience": 0.20,
        "education": 0.05
    },
    "DevOps Engineer": {
        "semantic": 0.30,
        "skills": 0.45,
        "experience": 0.20,
        "education": 0.05
    },
    "Full Stack Developer": {
        "semantic": 0.35,
        "skills": 0.40,
        "experience": 0.20,
        "education": 0.05
    },
    "Default": {
        "semantic": 0.35,
        "skills": 0.35,
        "experience": 0.20,
        "education": 0.10
    }
}

# Job Role Skills Database for Role Recommendation
JOB_ROLE_SKILLS = {
    "Data Scientist": [
        "python", "machine learning", "deep learning", "statistics", "sql",
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "nlp",
        "data analysis", "data visualization", "jupyter", "r"
    ],
    "Frontend Developer": [
        "javascript", "react", "html", "css", "typescript", "vue.js",
        "angular", "webpack", "redux", "sass", "responsive design", "git"
    ],
    "Backend Developer": [
        "python", "java", "node.js", "sql", "postgresql", "mongodb",
        "api", "rest", "microservices", "docker", "redis", "kafka"
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "aws", "jenkins", "terraform", "ansible",
        "linux", "bash", "git", "monitoring", "ci/cd", "prometheus"
    ],
    "Full Stack Developer": [
        "javascript", "react", "node.js", "python", "sql", "mongodb",
        "html", "css", "docker", "git", "api", "rest"
    ],
    "Machine Learning Engineer": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch",
        "mlops", "docker", "kubernetes", "aws", "model deployment", "api"
    ],
    "Mobile Developer": [
        "react native", "flutter", "swift", "kotlin", "android", "ios",
        "mobile development", "api", "git", "firebase"
    ],
    "QA Engineer": [
        "testing", "selenium", "automation testing", "python", "java",
        "api testing", "jira", "test planning", "cypress", "postman"
    ]
}


def get_role_weights(job_role="Default"):
    """
    Get scoring component weights for a specific job role
    Returns weights for semantic, skills, experience, and education components
    """
    return ROLE_SCORING_WEIGHTS.get(job_role, ROLE_SCORING_WEIGHTS["Default"])

def apply_role_weights(skills_list, job_role="Data Scientist"):
    """
    Apply role-specific multipliers to skills
    Returns weighted skills with their multipliers
    """
    role_weights = ROLE_SKILL_WEIGHTS.get(job_role, {})
    weighted_skills = {}
    
    for skill in skills_list:
        skill_lower = skill.lower()
        weight = role_weights.get(skill_lower, 1.0)  # Default weight is 1.0
        weighted_skills[skill] = weight
    
    return weighted_skills

def classify_match(score):
    """
    FEATURE 8: Multi-Level Match Classification
    Classify match score into descriptive categories
    """
    if score >= 85:
        return "Strong Fit"
    elif score >= 70:
        return "Good Fit"
    elif score >= 50:
        return "Potential Fit"
    else:
        return "Not Suitable"

def recommend_job_role(resume_skills, resume_text=""):
    """
    FEATURE 14: Job Role Recommendation
    Suggest job roles based on resume skills and content
    """
    role_scores = {}
    
    for role, required_skills in JOB_ROLE_SKILLS.items():
        # Calculate skill overlap
        matched_skills = set(resume_skills).intersection(set(required_skills))
        if required_skills:
            match_percentage = (len(matched_skills) / len(required_skills)) * 100
        else:
            match_percentage = 0
        
        role_scores[role] = match_percentage
    
    # Sort by match percentage
    sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Return top 3 roles with >25% match
    recommended = [(role, round(score, 2)) for role, score in sorted_roles[:3] if score > 25]
    
    if not recommended:
        return [("General Software Engineer", 50.0)]
    
    return recommended

def detect_role_from_jd(jd_text):
    """
    Detect the job role from job description text
    """
    jd_lower = jd_text.lower()
    
    role_keywords = {
        "Data Scientist": ["data scientist", "data science", "machine learning engineer"],
        "Frontend Developer": ["frontend", "front-end", "react developer", "ui developer"],
        "Backend Developer": ["backend", "back-end", "server-side", "api developer"],
        "DevOps Engineer": ["devops", "sre", "site reliability", "infrastructure engineer"],
        "Full Stack Developer": ["full stack", "fullstack", "full-stack"],
        "Machine Learning Engineer": ["ml engineer", "machine learning engineer", "ai engineer"],
        "Mobile Developer": ["mobile developer", "android developer", "ios developer"],
        "QA Engineer": ["qa engineer", "quality assurance", "test engineer", "sdet"]
    }
    
    for role, keywords in role_keywords.items():
        for keyword in keywords:
            if keyword in jd_lower:
                return role
    
    return "Default"

