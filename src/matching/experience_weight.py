def experience_score(candidate_exp, required_exp):
    if required_exp == 0:
        return 100
    if candidate_exp >= required_exp:
        return 100
    return round((candidate_exp / required_exp) * 100, 2)
