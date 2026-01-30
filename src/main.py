import sys
import os

# Add the project root to sys.path to allow imports if run directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

SKILL_WEIGHT = 0.6
EXPERIENCE_WEIGHT = 0.25
EDUCATION_WEIGHT = 0.15

try:
    from src.preprocessing.resume_parser import extract_text
    from src.preprocessing.text_cleaner import clean_text
    from src.feature_extraction.skill_extractor import extract_skills
    from src.feature_extraction.experience_extractor import extract_experience
    from src.matching.semantic_matcher_bert import semantic_similarity
    from src.matching.experience_weight import experience_score
    from src.matching.bias_filter import remove_bias
    from src.explainability.score_breakdown import calculate_final_score
    from src.recommendation.skill_gap_recommender import recommend_skills
except ImportError:
    # Fallback for when running directly from src/
    from preprocessing.resume_parser import extract_text
    from preprocessing.text_cleaner import clean_text
    from feature_extraction.skill_extractor import extract_skills
    from feature_extraction.experience_extractor import extract_experience
    from matching.semantic_matcher_bert import semantic_similarity
    from matching.experience_weight import experience_score
    from matching.bias_filter import remove_bias
    from explainability.score_breakdown import calculate_final_score
    from recommendation.skill_gap_recommender import recommend_skills

def run_pipeline(resume_path, jd_path):
    resume_text = clean_text(remove_bias(extract_text(resume_path)))
    with open(jd_path, 'r', encoding='utf-8') as f:
        jd_text = clean_text(f.read())

    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)

    skill_score = semantic_similarity(resume_text, jd_text)
    experience = extract_experience(resume_text)
    exp_score = experience_score(experience, 3)

    final = calculate_final_score(skill_score, exp_score)
    gaps = recommend_skills(jd_skills, resume_skills)

    return final, resume_skills, gaps

if __name__ == "__main__":
    # Ensure data directory exists or handle missing file
    try:
        score, skills, gaps = run_pipeline(
            "data/resumes/resume_001.pdf",
            "data/job_descriptions/jd_data_scientist.txt"
        )
        print(score)
        print("Skills:", skills)
        print("Skill Gaps:", gaps)
    except FileNotFoundError:
        print("Demo files not found. Please ensure data/resumes/resume_001.pdf and data/job_descriptions/jd_data_scientist.txt exist.")
