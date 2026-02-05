
import re
import spacy
from typing import Dict, List, Any

class ComprehensiveParser:
    """
    Parses resume text to extract deep structured data:
    - Contact Info (Name, Email, Phone, Social Links)
    - Detailed Education (Degree, School, Year)
    - Detailed Experience (Role, Company, Duration)
    - Projects
    - Certifications
    """

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")

    def parse(self, text: str) -> Dict[str, Any]:
        """Run all extractions and return a structured dictionary"""
        return {
            "contact_info": self.extract_contact_info(text),
            "education": self.extract_detailed_education(text),
            "experience": self.extract_detailed_experience(text),
            "projects": self.extract_projects(text),
            "certifications": self.extract_certifications(text)
        }

    def extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract email, phone, links, and probable name"""
        info = {
            "email": None,
            "phone": None,
            "linkedin": None,
            "github": None,
            "portfolio": None,
            "location": None,
            "name": None
        }

        # Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_match:
            info["email"] = email_match.group(0)

        # Phone (various formats)
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            info["phone"] = phone_match.group(0)

        # Links
        if "linkedin.com" in text:
            match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[\w-]+', text)
            if match: info["linkedin"] = match.group(0)
        
        if "github.com" in text:
            match = re.search(r'(https?://)?(www\.)?github\.com/[\w-]+', text)
            if match: info["github"] = match.group(0)

        # Probable Name (First PERSON entity, typically at start)
        doc = self.nlp(text[:1000]) # Scan first 1000 chars for name
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Filter out obvious non-names if needed
                if len(ent.text.split()) >= 2:
                    info["name"] = ent.text
                    break
        
        # Location (First GPE)
        for ent in doc.ents:
            if ent.label_ == "GPE":
                info["location"] = ent.text
                break

        return info

    def extract_detailed_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract structured education history"""
        education = []
        
        # Split by likely section headers if possible, or just scan
        # Simple regex approach for degrees + years
        # A more robust approach tries to find blocks containing University + Degree + Date
        
        degree_patterns = [
            r'(Bachelor|Master|Doctorate|PhD|B\.S|B\.A|M\.S|M\.A|M\.B\.A)',
            r'(?i)(Computer Science|Information Technology|Engineering|Data Science)'
        ]
        
        # Find lines with degrees
        lines = text.split('\n')
        for i, line in enumerate(lines):
            for pattern in degree_patterns:
                if re.search(pattern, line):
                    # Look around this line for a year and university
                    edu_entry = {
                        "degree": line.strip(),
                        "institution": None,
                        "year": None
                    }
                    
                    # Search valid year in current or surrounding lines
                    context = " ".join(lines[max(0, i-1):min(len(lines), i+2)])
                    year_match = re.search(r'(19|20)\d{2}', context)
                    if year_match:
                        edu_entry["year"] = year_match.group(0)

                    # Search for ORG in context
                    doc = self.nlp(context)
                    for ent in doc.ents:
                        if ent.label_ == "ORG" and "University" in ent.text or "College" in ent.text or "Institute" in ent.text:
                            edu_entry["institution"] = ent.text
                            break
                    
                    # Avoid duplicates
                    if not any(e['degree'] == edu_entry['degree'] for e in education):
                        education.append(edu_entry)
                    break
                    
        return education

    def extract_detailed_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract structured work experience"""
        # This is hard without layout info, but we can try to find blocks of Dates + ORGS
        experience = []
        
        # Pattern for Date Range: "Jan 2020 - Present", "2019-2021", etc.
        date_range_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?[\s-]?\d{4})\s*[-–to]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?[\s-]?\d{4}|Present|Current)'
        
        lines = text.split('\n')
        processed_indices = set()
        
        for i, line in enumerate(lines):
            if i in processed_indices: continue
            
            match = re.search(date_range_pattern, line, re.IGNORECASE)
            if match:
                # Probable experience block
                exp_entry = {
                    "duration": match.group(0),
                    "company": None,
                    "role": None,
                    "description": ""
                }
                
                # Context scan
                context_block = lines[max(0,i-2):min(len(lines), i+2)]
                context_text = " ".join(context_block)
                doc = self.nlp(context_text)
                
                # Find ORG (Company)
                for ent in doc.ents:
                    if ent.label_ == "ORG":
                        exp_entry["company"] = ent.text
                        break
                        
                # Heuristic for Role/Title (keywords)
                role_keywords = ["Engineer", "Developer", "Manager", "Analyst", "Consultant", "Director", "Lead", "Intern"]
                for line_check in context_block:
                    if any(kw in line_check for kw in role_keywords):
                        exp_entry["role"] = line_check.strip()
                        break
                
                # Extract description (lines following the date until next block)
                desc_lines = []
                for j in range(i+1, min(i+5, len(lines))):
                     if len(lines[j].strip()) > 5:
                         desc_lines.append(lines[j].strip())
                         processed_indices.add(j)
                exp_entry["description"] = "; ".join(desc_lines)
                
                experience.append(exp_entry)
        
        return experience

    def extract_projects(self, text: str) -> List[Dict[str, Any]]:
        """Extract projects block"""
        projects = []
        # Find "Projects" section
        project_headers = ["Projects", "Technical Projects", "Academic Projects"]
        
        lines = text.split('\n')
        in_project_section = False
        current_project = {}
        
        for line in lines:
            clean_line = line.strip().lower()
            if any(h.lower() in clean_line for h in project_headers) and len(clean_line) < 20:
                in_project_section = True
                continue
                
            if in_project_section:
                # If we hit another likely header, stop
                if len(line.strip()) < 20 and any(w in line for w in ["Education", "Experience", "Skills", "Certifications"]):
                    in_project_section = False
                    break
                
                # Simple heuristic: Bullet points often start new items
                if line.strip().startswith(('•', '-', '*')):
                    if current_project:
                        projects.append(current_project)
                    current_project = {"title": line.strip(" •-*"), "description": ""}
                elif current_project:
                    current_project["description"] += " " + line.strip()
                    
        if current_project:
            projects.append(current_project)
            
        return projects

    def extract_certifications(self, text: str) -> List[str]:
        """Using regex for common certs"""
        cert_patterns = [
            r'AWS Certified [\w\s]+',
            r'Google Cloud [\w\s]+',
            r'Azure [\w\s]+',
            r'PMP', 'CISSP', 'CCNA', 'Certified Scrum Master'
        ]
        certs = []
        for p in cert_patterns:
            matches = re.findall(p, text, re.IGNORECASE)
            certs.extend(matches)
        return list(set(certs))

# Singleton for easy import
parser = ComprehensiveParser()
