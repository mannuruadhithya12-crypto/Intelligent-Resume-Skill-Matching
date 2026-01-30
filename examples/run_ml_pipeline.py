"""
Example script demonstrating the complete ML pipeline
"""

import pandas as pd
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from src.training.ml_pipeline import MLPipeline

def create_sample_data():
    """Create sample resume and JD data for demonstration"""
    
    # Sample resumes (expanded for proper train/test split)
    resumes = []
    
    # Data Science resumes
    for i in range(20):
        resumes.append({
            'id': f'R{i:03d}',
            'text': f'Data Scientist with {i%10} years experience in Python, Machine Learning, TensorFlow, and SQL. {"PhD" if i%3==0 else "Masters"} in Computer Science.',
            'category': 'Data Science'
        })
    
    # Web Development resumes
    for i in range(20, 40):
        resumes.append({
            'id': f'R{i:03d}',
            'text': f'Full Stack Developer proficient in React, Node.js, MongoDB, and AWS. {"Masters" if i%2==0 else "Bachelor"} in Software Engineering.',
            'category': 'Web Development'
        })
    
    # Java Development resumes
    for i in range(40, 60):
        resumes.append({
            'id': f'R{i:03d}',
            'text': f'Senior Java Developer with Spring Boot, Microservices, and Docker experience. {i-35} years in enterprise applications.',
            'category': 'Java Development'
        })
    
    # Sample job descriptions
    jds = [
        {
            'id': 'JD001',
            'text': 'Looking for Data Scientist with Python, ML, and statistical analysis skills. PhD preferred.',
            'category': 'Data Science'
        },
        {
            'id': 'JD002',
            'text': 'Hiring Full Stack Developer for React and Node.js projects. AWS experience required.',
            'category': 'Web Development'
        },
        {
            'id': 'JD003',
            'text': 'Need Java Developer for microservices architecture. Spring Boot and Docker mandatory.',
            'category': 'Java Development'
        },
        {
            'id': 'JD004',
            'text': 'Machine Learning Engineer position. PyTorch, Deep Learning, Computer Vision required.',
            'category': 'Data Science'
        },
        {
            'id': 'JD005',
            'text': 'Frontend Developer needed. Angular, TypeScript, responsive design experience.',
            'category': 'Web Development'
        }
    ]
    
    return pd.DataFrame(resumes), pd.DataFrame(jds)

def main():
    """Run the complete ML pipeline demonstration"""
    
    print("="*70)
    print("COMPLETE ML PIPELINE DEMONSTRATION")
    print("="*70 + "\n")
    
    # Create sample data
    print("Creating sample data...")
    resume_df, jd_df = create_sample_data()
    print(f"Loaded {len(resume_df)} resumes and {len(jd_df)} job descriptions\n")
    
    # Initialize pipeline
    pipeline = MLPipeline(output_dir="data/processed")
    
    # Run complete pipeline
    model, metrics = pipeline.run_complete_pipeline(
        resume_df=resume_df,
        jd_df=jd_df,
        use_ensemble=True
    )
    
    print("\n" + "="*70)
    print("PIPELINE SUMMARY")
    print("="*70)
    print(f"Final Model Accuracy: {metrics['accuracy']*100:.2f}%")
    print(f"Final Model F1-Score: {metrics['f1']*100:.2f}%")
    print("Model saved to: models/final_model.pkl")
    print("="*70)

if __name__ == "__main__":
    main()
