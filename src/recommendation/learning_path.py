"""
FEATURE 13: Learning Path Recommendation
Maps skills to learning resources (Courses, Certifications, Projects)
Suggests actionable learning paths for skill improvement
"""

# Comprehensive Learning Resources Database
LEARNING_RESOURCES = {
    "python": [
        {"name": "Python for Data Science Bootcamp", "provider": "Udemy", "type": "Course", "duration": "40 hours"},
        {"name": "PCAP – Certified Associate in Python Programming", "provider": "Python Institute", "type": "Certification", "duration": "N/A"},
        {"name": "Build 10 Python Projects", "provider": "freeCodeCamp", "type": "Project", "duration": "Self-paced"}
    ],
    "machine learning": [
        {"name": "Machine Learning Specialization", "provider": "Coursera (Andrew Ng)", "type": "Course", "duration": "3 months"},
        {"name": "TensorFlow Developer Certificate", "provider": "Google", "type": "Certification", "duration": "N/A"},
        {"name": "Kaggle Competitions", "provider": "Kaggle", "type": "Project", "duration": "Ongoing"}
    ],
    "deep learning": [
        {"name": "Deep Learning Specialization", "provider": "Coursera (Andrew Ng)", "type": "Course", "duration": "5 months"},
        {"name": "Fast.ai Practical Deep Learning", "provider": "fast.ai", "type": "Course", "duration": "7 weeks"},
        {"name": "Build Neural Networks from Scratch", "provider": "GitHub", "type": "Project", "duration": "Self-paced"}
    ],
    "sql": [
        {"name": "The Complete SQL Bootcamp", "provider": "Udemy", "type": "Course", "duration": "9 hours"},
        {"name": "Oracle Database SQL Certified Associate", "provider": "Oracle", "type": "Certification", "duration": "N/A"},
        {"name": "SQL Practice on LeetCode", "provider": "LeetCode", "type": "Project", "duration": "Ongoing"}
    ],
    "react": [
        {"name": "React - The Complete Guide", "provider": "Academind", "type": "Course", "duration": "48 hours"},
        {"name": "Meta Front-End Developer Professional Certificate", "provider": "Coursera", "type": "Certification", "duration": "7 months"},
        {"name": "Build 5 React Projects", "provider": "YouTube", "type": "Project", "duration": "Self-paced"}
    ],
    "javascript": [
        {"name": "JavaScript: The Complete Guide", "provider": "Udemy", "type": "Course", "duration": "52 hours"},
        {"name": "JavaScript Algorithms and Data Structures", "provider": "freeCodeCamp", "type": "Certification", "duration": "300 hours"},
        {"name": "30 Day JavaScript Challenge", "provider": "JavaScript30", "type": "Project", "duration": "30 days"}
    ],
    "aws": [
        {"name": "AWS Certified Solutions Architect", "provider": "Amazon", "type": "Certification", "duration": "N/A"},
        {"name": "Ultimate AWS Certified Developer Associate", "provider": "Udemy", "type": "Course", "duration": "28 hours"},
        {"name": "Deploy Full Stack App on AWS", "provider": "AWS Tutorials", "type": "Project", "duration": "Self-paced"}
    ],
    "docker": [
        {"name": "Docker & Kubernetes: The Practical Guide", "provider": "Udemy", "type": "Course", "duration": "23 hours"},
        {"name": "Docker Certified Associate (DCA)", "provider": "Docker", "type": "Certification", "duration": "N/A"},
        {"name": "Containerize 3 Applications", "provider": "Docker Hub", "type": "Project", "duration": "Self-paced"}
    ],
    "kubernetes": [
        {"name": "Kubernetes for Absolute Beginners", "provider": "KodeKloud", "type": "Course", "duration": "6 hours"},
        {"name": "Certified Kubernetes Administrator (CKA)", "provider": "CNCF", "type": "Certification", "duration": "N/A"},
        {"name": "Deploy Microservices on K8s", "provider": "GitHub", "type": "Project", "duration": "Self-paced"}
    ],
    "nlp": [
        {"name": "Natural Language Processing Specialization", "provider": "Coursera", "type": "Course", "duration": "4 months"},
        {"name": "Hugging Face Course", "provider": "Hugging Face", "type": "Course", "duration": "Self-paced"},
        {"name": "Build a Chatbot with Transformers", "provider": "GitHub", "type": "Project", "duration": "Self-paced"}
    ],
    "tensorflow": [
        {"name": "TensorFlow Developer Certificate", "provider": "Google", "type": "Certification", "duration": "N/A"},
        {"name": "TensorFlow in Practice Specialization", "provider": "Coursera", "type": "Course", "duration": "4 months"},
        {"name": "Build Image Classifier with TensorFlow", "provider": "TensorFlow Tutorials", "type": "Project", "duration": "Self-paced"}
    ],
    "pytorch": [
        {"name": "PyTorch for Deep Learning Bootcamp", "provider": "Udemy", "type": "Course", "duration": "26 hours"},
        {"name": "Deep Learning with PyTorch", "provider": "PyTorch.org", "type": "Course", "duration": "Self-paced"},
        {"name": "Implement ResNet from Scratch", "provider": "GitHub", "type": "Project", "duration": "Self-paced"}
    ],
    "node.js": [
        {"name": "The Complete Node.js Developer Course", "provider": "Udemy", "type": "Course", "duration": "35 hours"},
        {"name": "Node.js Application Developer Certification", "provider": "OpenJS Foundation", "type": "Certification", "duration": "N/A"},
        {"name": "Build REST API with Express", "provider": "YouTube", "type": "Project", "duration": "Self-paced"}
    ],
    "git": [
        {"name": "Git & GitHub Complete Guide", "provider": "Udemy", "type": "Course", "duration": "12 hours"},
        {"name": "GitHub Foundations Certification", "provider": "GitHub", "type": "Certification", "duration": "N/A"},
        {"name": "Contribute to Open Source", "provider": "GitHub", "type": "Project", "duration": "Ongoing"}
    ]
}

def suggest_learning_paths(missing_skills):
    """
    FEATURE 13: Learning Path Recommendation
    Generate comprehensive learning recommendations for missing skills
    
    Args:
        missing_skills: List of skills the candidate is missing
        
    Returns:
        List of learning path recommendations with courses, certifications, and projects
    """
    recommendations = []
    
    for skill in missing_skills:
        skill_lower = skill.lower()
        
        if skill_lower in LEARNING_RESOURCES:
            resources = LEARNING_RESOURCES[skill_lower]
            recommendations.append({
                "skill": skill,
                "priority": "High" if skill in missing_skills[:3] else "Medium",
                "resources": resources,
                "estimated_time": _calculate_total_time(resources)
            })
        else:
            # Generic recommendation for unknown skills
            recommendations.append({
                "skill": skill,
                "priority": "Medium",
                "resources": [
                    {"name": f"Advanced {skill} Concepts", "provider": "LinkedIn Learning", "type": "Course", "duration": "3-5 hours"},
                    {"name": f"{skill} Fundamentals", "provider": "Udemy", "type": "Course", "duration": "10-15 hours"},
                    {"name": f"Hands-on {skill} Projects", "provider": "GitHub", "type": "Project", "duration": "Self-paced"}
                ],
                "estimated_time": "20-30 hours"
            })
    
    return recommendations

def _calculate_total_time(resources):
    """Helper function to estimate total learning time"""
    total_hours = 0
    for resource in resources:
        duration = resource.get("duration", "")
        if "hour" in duration.lower():
            try:
                hours = int(duration.split()[0])
                total_hours += hours
            except:
                pass
    
    if total_hours > 0:
        return f"{total_hours} hours"
    else:
        return "Self-paced"

def recommend_learning_path(missing_skills):
    """
    Backward compatibility wrapper
    Alias for suggest_learning_paths
    """
    return suggest_learning_paths(missing_skills)

def get_skill_improvement_impact(skill):
    """
    Estimate the impact of learning a skill on match score
    """
    high_impact_skills = ["python", "machine learning", "react", "aws", "docker", "kubernetes"]
    medium_impact_skills = ["sql", "git", "javascript", "node.js"]
    
    skill_lower = skill.lower()
    
    if skill_lower in high_impact_skills:
        return {"impact": "High", "score_increase": "+8-12%"}
    elif skill_lower in medium_impact_skills:
        return {"impact": "Medium", "score_increase": "+5-8%"}
    else:
        return {"impact": "Low", "score_increase": "+2-5%"}

