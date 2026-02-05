"""
ML Inference Service
Handles model loading and prediction with all advanced features
"""

import joblib
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from src.preprocessing.resume_parser import extract_text
from src.preprocessing.text_cleaner import clean_text
from src.feature_extraction.skill_extractor import extract_skills, categorize_skills
from src.feature_extraction.experience_extractor import extract_experience
from src.feature_extraction.education_extractor import extract_education
from src.matching.semantic_matcher_bert import semantic_similarity
from src.matching.experience_weight import experience_score
from src.matching.bias_filter import remove_bias
from src.matching.role_weights import get_role_weights, apply_role_weights
from src.explainability.score_breakdown import calculate_final_score
from src.recommendation.skill_gap_recommender import recommend_skills
from src.recommendation.skill_gap_recommender import recommend_skills
from src.recommendation.learning_path import suggest_learning_paths
from src.feature_extraction.comprehensive_parser import parser as comprehensive_parser

class MLInferenceEngine:
    """
    ML Inference Engine for Resume Matching
    Singleton pattern to load model once
    """
    
    _instance = None
    _model = None
    _model_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._model_loaded:
            self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            # Try ensemble model first
            ensemble_path = "models/ensemble_classifier.pkl"
            if os.path.exists(ensemble_path):
                self._model = joblib.load(ensemble_path)
                print(f"✓ Loaded ensemble model from {ensemble_path}")
            else:
                # Fallback to standard model
                standard_path = "models/match_classifier.pkl"
                if os.path.exists(standard_path):
                    self._model = joblib.load(standard_path)
                    print(f"✓ Loaded standard model from {standard_path}")
                else:
                    print("⚠ Warning: No trained model found. Using rule-based scoring only.")
                    self._model = None
            
            self._model_loaded = True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self._model = None
            self._model_loaded = False
    
    def classify_match_level(self, final_score):
        """
        FEATURE 8: Multi-Level Match Classification
        Classifies candidates into categories based on score
        """
        if final_score >= 85:
            return "Strong Fit"
        elif final_score >= 70:
            return "Good Fit"
        elif final_score >= 50:
            return "Potential Fit"
        else:
            return "Not Suitable"
    
    def calculate_confidence_score(self, semantic_score, skill_overlap_score, matched_count, total_jd_skills):
        """
        FEATURE 12: Confidence Score for Decisions
        Provides confidence level based on score alignment and skill coverage
        """
        # Check alignment between semantic and skill scores
        score_alignment = abs(semantic_score - skill_overlap_score)
        
        # Check skill coverage
        skill_coverage = (matched_count / max(total_jd_skills, 1)) * 100 if total_jd_skills > 0 else 0
        
        # High confidence: scores aligned + good skill coverage
        if score_alignment < 15 and skill_coverage > 60:
            return "High"
        # Low confidence: scores misaligned or poor coverage
        elif score_alignment > 40 or skill_coverage < 30:
            return "Low"
        else:
            return "Medium"
    
    def generate_interview_questions(self, missing_skills, matched_skills):
        """
        FEATURE 15: Interview Question Generation
        Generates targeted interview questions based on skill profile
        """
        questions = []
        
        # 1. Gap Analysis Questions
        for skill in missing_skills[:3]:
            questions.append(f"Your profile suggests limited exposure to {skill}. Can you share any related experience or how you would approach learning this quickly?")
            
        # 2. Competency Validation Questions
        for skill in matched_skills[:2]:
            questions.append(f"Could you walk us through a specific project where you utilized {skill} to solve a complex problem?")
            
        # 3. Behavioral/Culture Fit
        questions.append("Describe a situation where you had to adapt to a significant change in project scope. How did you handle it?")
        
        return questions

    def recommend_job_roles(self, resume_skills, resume_text):
        """
        FEATURE 14: Job Role Recommendation
        Recommends alternative job roles based on skill profile
        """
        from src.matching.role_weights import JOB_ROLE_SKILLS
        
        role_matches = {}
        for role, required_skills in JOB_ROLE_SKILLS.items():
            matched = set(resume_skills).intersection(set(required_skills))
            match_percentage = (len(matched) / len(required_skills)) * 100 if required_skills else 0
            role_matches[role] = match_percentage
        
        # Sort by match percentage
        sorted_roles = sorted(role_matches.items(), key=lambda x: x[1], reverse=True)
        
        # Return top 3 roles with >30% match
        # Format: Just returning the role name as a string to simplify frontend handling
        recommended = [role for role, score in sorted_roles[:3] if score > 30]
        return recommended if recommended else ["General Software Engineer"]
    
    def analyze_resume(self, resume_path: str, jd_text: str, job_role: str = "Data Scientist"):
        """
        Analyze a single resume against a job description
        
        Args:
            resume_path: Path to resume file
            jd_text: Job description text
            job_role: Target job role for role-specific weighting
            
        Returns:
            Dictionary with comprehensive analysis results
        """
        # Extract and clean text
        resume_text_raw = extract_text(resume_path)
        
        # FEATURE 5: Bias-Reduced Hiring Mechanism
        resume_text_unbiased = remove_bias(resume_text_raw)
        
        resume_clean = clean_text(resume_text_unbiased)
        jd_clean = clean_text(jd_text)
        
        # Extract features
        resume_skills = extract_skills(resume_clean)
        jd_skills = extract_skills(jd_clean)
        
        # FEATURE 9: Role-Specific Skill Weighting
        role_weighted_skills = apply_role_weights(resume_skills, job_role)
        
        # Calculate scores
        # FEATURE 1: Semantic Skill Matching
        semantic_score = semantic_similarity(resume_clean, jd_clean)
        
        # FEATURE 4: Experience-Weighted
        resume_exp = extract_experience(resume_clean)
        jd_required_exp = extract_experience(jd_clean) or 3  # Default 3 years
        exp_score = experience_score(resume_exp, jd_required_exp)
        
        # Education Scoring
        edu_score, degree = extract_education(resume_clean)
        
        # Skill overlap calculation
        if not jd_skills:
            skill_overlap_score = 0
        else:
            intersection = set(resume_skills).intersection(set(jd_skills))
            skill_overlap_score = (len(intersection) / len(set(jd_skills))) * 100
        
        # FEATURE 9: Apply role-specific weights to final score
        role_weights = get_role_weights(job_role)
        final_score = (
            semantic_score * role_weights['semantic'] +
            skill_overlap_score * role_weights['skills'] +
            exp_score * role_weights['experience'] +
            edu_score * role_weights['education']
        )
        final_score = min(100.0, final_score)
        
        # FEATURE 8: Multi-Level Match Classification
        match_classification = self.classify_match_level(final_score)
        
        # FEATURE 12: Confidence Score
        confidence_score = self.calculate_confidence_score(
            semantic_score, 
            skill_overlap_score, 
            len(set(resume_skills).intersection(set(jd_skills))),
            len(jd_skills)
        )
        
        # FEATURE 3: Skill Gap Recommendation
        skill_gaps = recommend_skills(jd_skills, resume_skills)
        
        # FEATURE 13: Learning Path Recommendation
        learning_paths = suggest_learning_paths(list(skill_gaps.keys())[:5])  # Top 5 missing skills
        
        # FEATURE 14: Job Role Recommendation
        recommended_roles = self.recommend_job_roles(resume_skills, resume_clean)
        
        # FEATURE 15: Interview Questions
        matched_skills_list = list(set(resume_skills).intersection(set(jd_skills)))
        missing_skills_list = list(skill_gaps.keys())
        interview_questions = self.generate_interview_questions(missing_skills_list, matched_skills_list)
        
        # Categorize skills for better presentation
        categorized_skills = categorize_skills(resume_skills)
        
        return {
            'final_score': round(final_score, 2),
            'semantic_score': round(semantic_score, 2),
            'skill_overlap_score': round(skill_overlap_score, 2),
            'experience_score': round(exp_score, 2),
            'education_score': round(edu_score, 2),
            'experience_years': resume_exp,
            'degree': degree,
            'match_classification': match_classification,
            'confidence_score': confidence_score,
            'matched_skills': matched_skills_list,
            'missing_skills': missing_skills_list,
            'skill_recommendations': skill_gaps,
            'learning_paths': learning_paths,
            'recommended_roles': recommended_roles,
            'interview_questions': interview_questions,
            'categorized_skills': categorized_skills,
            'role_weights_applied': role_weights
        }
        
        # Merge comprehensive data
        structured_data = comprehensive_parser.parse(resume_text_raw)
        result.update({
            'email': structured_data['contact_info'].get('email'),
            'phone': structured_data['contact_info'].get('phone'),
            'linkedin_url': structured_data['contact_info'].get('linkedin'),
            'github_url': structured_data['contact_info'].get('github'),
            'location': structured_data['contact_info'].get('location'),
            'education_history': structured_data.get('education', []),
            'experience_history': structured_data.get('experience', []),
            'projects': structured_data.get('projects', []),
            'certifications': structured_data.get('certifications', [])
        })
        
        return result
    
    def batch_analyze(self, resume_paths: list, jd_text: str, job_role: str = "Data Scientist"):
        """
        FEATURE 19: Batch Resume Processing
        Analyze multiple resumes against a job description
        
        Args:
            resume_paths: List of resume file paths
            jd_text: Job description text
            job_role: Target job role
            
        Returns:
            List of analysis results sorted by score
        """
        results = []
        
        for resume_path in resume_paths:
            try:
                result = self.analyze_resume(resume_path, jd_text, job_role)
                result['filename'] = os.path.basename(resume_path)
                results.append(result)
            except Exception as e:
                print(f"❌ Error analyzing {resume_path}: {e}")
                continue
        
        # Sort by final score (descending)
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Add ranks
        for idx, result in enumerate(results):
            result['rank'] = idx + 1
        
        return results
    
    def is_model_loaded(self):
        """Check if model is loaded"""
        return self._model_loaded

# Global inference engine instance
inference_engine = MLInferenceEngine()
