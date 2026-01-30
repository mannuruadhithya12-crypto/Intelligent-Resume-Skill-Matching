"""
Named Entity Recognition (NER) Extractor
Extracts structured entities from resumes: companies, certifications, projects, locations
"""

import spacy
import re

class NERExtractor:
    """
    Advanced NER extractor for resume parsing
    Extracts: Organizations, Certifications, Projects, Locations, Dates
    """
    
    def __init__(self):
        """Initialize spaCy NER model"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Downloading spaCy model...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
    
    def extract_entities(self, text):
        """
        Extract all entities from resume text
        
        Returns:
            Dictionary with extracted entities
        """
        doc = self.nlp(text)
        
        entities = {
            'organizations': self._extract_organizations(doc),
            'certifications': self._extract_certifications(text),
            'locations': self._extract_locations(doc),
            'dates': self._extract_dates(doc),
            'projects': self._extract_projects(text)
        }
        
        return entities
    
    def _extract_organizations(self, doc):
        """Extract company/organization names"""
        orgs = []
        for ent in doc.ents:
            if ent.label_ == "ORG":
                orgs.append(ent.text)
        return list(set(orgs))
    
    def _extract_certifications(self, text):
        """
        Extract certifications using pattern matching
        Common certifications: AWS, Azure, PMP, CISSP, etc.
        """
        cert_patterns = [
            r'AWS Certified[\w\s]+',
            r'Azure[\w\s]+Certified',
            r'Google Cloud[\w\s]+',
            r'PMP',
            r'CISSP',
            r'CEH',
            r'CISA',
            r'CISM',
            r'CCNA',
            r'CCNP',
            r'CPA',
            r'CFA',
            r'Six Sigma[\w\s]+Belt',
            r'Scrum Master',
            r'Product Owner',
            r'ITIL[\w\s]+',
        ]
        
        certifications = []
        for pattern in cert_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            certifications.extend(matches)
        
        return list(set(certifications))
    
    def _extract_locations(self, doc):
        """Extract location entities"""
        locations = []
        for ent in doc.ents:
            if ent.label_ in ["GPE", "LOC"]:
                locations.append(ent.text)
        return list(set(locations))
    
    def _extract_dates(self, doc):
        """Extract date entities (useful for experience timeline)"""
        dates = []
        for ent in doc.ents:
            if ent.label_ == "DATE":
                dates.append(ent.text)
        return dates
    
    def _extract_projects(self, text):
        """
        Extract project mentions using keyword patterns
        """
        # Look for project section indicators
        project_keywords = [
            r'Project[\s:]+([^\n]+)',
            r'Projects[\s:]+([^\n]+)',
            r'Built[\s:]+([^\n]+)',
            r'Developed[\s:]+([^\n]+)',
            r'Created[\s:]+([^\n]+)'
        ]
        
        projects = []
        for pattern in project_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            projects.extend(matches)
        
        return projects[:5]  # Return top 5 project mentions
    
    def extract_experience_companies(self, text):
        """
        Extract companies from experience section specifically
        More accurate than general ORG extraction
        """
        # Look for common experience patterns
        exp_patterns = [
            r'(?:worked at|employed at|position at)\s+([A-Z][\w\s&]+)',
            r'([A-Z][\w\s&]+)(?:\s*[-–]\s*\d{4})',
        ]
        
        companies = []
        for pattern in exp_patterns:
            matches = re.findall(pattern, text)
            companies.extend(matches)
        
        # Also use spaCy ORG entities
        doc = self.nlp(text)
        companies.extend(self._extract_organizations(doc))
        
        return list(set(companies))
    
    def calculate_experience_score(self, entities):
        """
        Calculate an enhanced experience score based on extracted entities
        
        Returns:
            Score from 0-100 based on:
            - Number of companies worked at
            - Number of certifications
            - Number of projects
        """
        score = 0
        
        # Companies (max 40 points)
        num_companies = len(entities.get('organizations', []))
        score += min(num_companies * 10, 40)
        
        # Certifications (max 30 points)
        num_certs = len(entities.get('certifications', []))
        score += min(num_certs * 10, 30)
        
        # Projects (max 30 points)
        num_projects = len(entities.get('projects', []))
        score += min(num_projects * 6, 30)
        
        return min(score, 100)

# Convenience function for backward compatibility
def extract_entities(text):
    """Extract entities from text"""
    extractor = NERExtractor()
    return extractor.extract_entities(text)
