import re

def remove_bias(text):
    patterns = [
        r"name\s*:\s*\w+",
        r"gender\s*:\s*\w+",
        r"age\s*:\s*\d+",
        r"college\s*:\s*[\w\s]+"
    ]
    for p in patterns:
        text = re.sub(p, "", text, flags=re.IGNORECASE)
    return text
