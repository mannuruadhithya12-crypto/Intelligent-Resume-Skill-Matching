def recommend_skills(jd_skills, resume_skills):
    missing = list(set(jd_skills) - set(resume_skills))
    recommendations = {}
    for skill in missing:
        recommendations[skill] = "+5% improvement"
    return recommendations
