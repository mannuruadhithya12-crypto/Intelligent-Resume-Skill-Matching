import re

def extract_experience(text):
    matches = re.findall(r'(\d+)\s+years?', text)
    if matches:
        return max(map(int, matches))
    return 0
