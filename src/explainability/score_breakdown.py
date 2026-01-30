def calculate_final_score(skill_score, exp_score, edu_score=70):
    final = (skill_score * 0.6) + (exp_score * 0.25) + (edu_score * 0.15)
    breakdown = {
        "Skill Match (%)": round(skill_score * 0.6, 2),
        "Experience Match (%)": round(exp_score * 0.25, 2),
        "Education Match (%)": round(edu_score * 0.15, 2),
        "Final Score (%)": round(final, 2)
    }
    return breakdown
