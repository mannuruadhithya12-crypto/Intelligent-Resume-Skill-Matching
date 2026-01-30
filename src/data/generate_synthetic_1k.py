import pandas as pd
import random
import os

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

SKILLS_DB = [
    "Python", "Java", "C++", "SQL", "Machine Learning", "Deep Learning", "Flask", "Django",
    "React", "Angular", "Vue.js", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Data Analysis", "Big Data", "Spark", "Hadoop", "Tableau", "Power BI", "Excel",
    "Communication", "Leadership", "Agile", "Scrum", "Project Management"
]

DEGREES = ["Bachelor of Science in Computer Science", "Master of Science in Data Science", "PhD in Artificial Intelligence", "B.Tech in Information Technology", "MBA", "Bachelor of Engineering"]

ROLES = [
    ("Data Scientist", ["Python", "Machine Learning", "SQL", "Pandas", "Deep Learning"]),
    ("Web Developer", ["HTML", "CSS", "JavaScript", "React", "Node.js"]),
    ("Java Developer", ["Java", "Spring Boot", "Hibernate", "SQL", "Microservices"]),
    ("DevOps Engineer", ["AWS", "Docker", "Kubernetes", "Linux", "Jenkins"]),
    ("Data Analyst", ["SQL", "Excel", "Tableau", "Power BI", "Python"]),
]

def generate_resume_text(role, skills_pool):
    # Select random skills
    num_skills = random.randint(3, 8)
    skills = random.sample(skills_pool + random.sample(SKILLS_DB, 3), num_skills)
    
    # Select experience
    years = random.randint(0, 15)
    
    # Select degree
    degree = random.choice(DEGREES)
    
    text = f"Objective: Aspiring {role} looking for opportunities.\n\n"
    text += f"Experience: {years} years of experience working as a {role}.\n"
    text += f"Education: {degree}.\n"
    text += f"Skills: {', '.join(skills)}.\n"
    text += "Projects: Built various applications using extracted technologies."
    
    return text

def generate_dataset(num_samples=1000):
    data = []
    
    for _ in range(num_samples):
        role_name, role_skills = random.choice(ROLES)
        
        # Introduce some label noise/variety
        category = role_name
        
        resume_text = generate_resume_text(role_name, role_skills)
        
        data.append({
            "Category": category,
            "Resume_Text": resume_text
        })
        
    df = pd.DataFrame(data)
    output_path = "data/synthetic_resumes_1k.csv"
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} resumes at {output_path}")

if __name__ == "__main__":
    generate_dataset(1000)
