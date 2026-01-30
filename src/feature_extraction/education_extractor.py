import re

def extract_education(text):
    """
    Extract education level and degree from text
    Returns: (level_score, degree_name)
    """
    text = text.lower()
    
    # Doctoral
    if re.search(r'\b(ph\.?d|doctorate|doctoral|d\.?phil)\b', text):
        return 100, "Doctorate/PhD"
    
    # Masters
    if re.search(r'\b(m\.?s|m\.?a|m\.?b\.?a|master|m\.?tech|m\.?eng)\b', text):
        return 80, "Master's Degree"
        
    # Bachelors
    if re.search(r'\b(b\.?s|b\.?a|b\.?tech|bachelor|b\.?eng|undergraduate)\b', text):
        return 60, "Bachelor's Degree"
        
    # Diploma/Associate
    if re.search(r'\b(diploma|associate|a\.?s|a\.?a)\b', text):
        return 40, "Diploma/Associate"
    
    return 0, "No Degree Detected"
