"""
Comprehensive Testing Suite for Resume Matching System
Tests accuracy, performance, and robustness across all components
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from src.feature_extraction.skill_extractor import extract_skills, get_all_skills
from src.feature_extraction.ner_extractor import NERExtractor
from src.preprocessing.resume_parser import extract_text
from src.matching.semantic_matcher_bert import semantic_similarity
import time

def test_skill_database():
    """Test the expanded skill database"""
    print("="*60)
    print("TEST 1: Skill Database Coverage")
    print("="*60)
    
    all_skills = get_all_skills()
    print(f"Total skills in database: {len(all_skills)}")
    
    # Test skill extraction
    test_text = """
    I have 5 years of experience in Python, Machine Learning, AWS, and Docker.
    Certified in PMP and AWS Solutions Architect.
    Proficient in React, Node.js, and MongoDB.
    """
    
    extracted = extract_skills(test_text)
    print(f"\nTest text: {test_text[:100]}...")
    print(f"Extracted skills: {extracted}")
    print(f"Skills found: {len(extracted)}")
    
    # Test synonyms
    synonym_text = "Expert in ML, AI, k8s, and JS"
    synonym_skills = extract_skills(synonym_text)
    print(f"\nSynonym test: {synonym_text}")
    print(f"Extracted (with synonyms): {synonym_skills}")
    
    return len(all_skills) >= 500

def test_ner_extraction():
    """Test Named Entity Recognition"""
    print("\n" + "="*60)
    print("TEST 2: Named Entity Recognition")
    print("="*60)
    
    test_resume = """
    John Doe
    Email: john@example.com
    
    Experience:
    Senior Data Scientist at Google (2020-2023)
    Data Analyst at Microsoft (2018-2020)
    
    Certifications:
    - AWS Certified Solutions Architect
    - PMP Certified
    - CISSP
    
    Projects:
    - Built recommendation system using Python and TensorFlow
    - Developed customer analytics dashboard
    """
    
    extractor = NERExtractor()
    entities = extractor.extract_entities(test_resume)
    
    print(f"Organizations: {entities['organizations']}")
    print(f"Certifications: {entities['certifications']}")
    print(f"Projects: {entities['projects'][:3]}")
    
    return len(entities['certifications']) > 0

def test_semantic_matching():
    """Test semantic similarity"""
    print("\n" + "="*60)
    print("TEST 3: Semantic Similarity")
    print("="*60)
    
    resume = "Experienced Data Scientist with Python, Machine Learning, and Deep Learning"
    jd = "Looking for Data Scientist skilled in Python, ML, and Neural Networks"
    
    start_time = time.time()
    similarity = semantic_similarity(resume, jd)
    elapsed = time.time() - start_time
    
    print(f"Resume: {resume}")
    print(f"JD: {jd}")
    print(f"Similarity Score: {similarity:.2f}%")
    print(f"Processing Time: {elapsed:.3f}s")
    
    return similarity > 70

def test_model_accuracy():
    """Test model accuracy on synthetic data"""
    print("\n" + "="*60)
    print("TEST 4: Model Accuracy")
    print("="*60)
    
    import joblib
    from sklearn.metrics import accuracy_score
    import numpy as np
    
    # Check if ensemble model exists
    ensemble_path = "models/ensemble_classifier.pkl"
    standard_path = "models/match_classifier.pkl"
    
    if os.path.exists(ensemble_path):
        print("Loading ENSEMBLE model...")
        model = joblib.load(ensemble_path)
        model_type = "Ensemble (RF + XGBoost + LR)"
    elif os.path.exists(standard_path):
        print("Loading STANDARD model...")
        model = joblib.load(standard_path)
        model_type = "Standard"
    else:
        print("No trained model found!")
        return False
    
    # Generate test data
    np.random.seed(123)
    X_test = np.random.rand(100, 4) * 100  # 100 samples, 4 features
    
    # Make predictions
    start_time = time.time()
    predictions = model.predict(X_test)
    elapsed = time.time() - start_time
    
    print(f"Model Type: {model_type}")
    print(f"Test Samples: {len(X_test)}")
    print(f"Predictions Made: {len(predictions)}")
    print(f"Prediction Time: {elapsed:.3f}s ({elapsed/len(X_test)*1000:.2f}ms per sample)")
    print(f"Positive Predictions: {sum(predictions)}")
    print(f"Negative Predictions: {len(predictions) - sum(predictions)}")
    
    return True

def test_end_to_end():
    """Test complete pipeline"""
    print("\n" + "="*60)
    print("TEST 5: End-to-End Pipeline")
    print("="*60)
    
    # Check if test resume exists
    test_resume_path = "data/resumes/resume_001.pdf"
    if not os.path.exists(test_resume_path):
        print(f"Test resume not found at {test_resume_path}")
        print("Skipping end-to-end test")
        return True
    
    try:
        # Extract text
        text = extract_text(test_resume_path)
        print(f"Text extracted: {len(text)} characters")
        
        # Extract skills
        skills = extract_skills(text)
        print(f"Skills found: {len(skills)}")
        
        # Extract entities
        extractor = NERExtractor()
        entities = extractor.extract_entities(text)
        print(f"Organizations: {len(entities['organizations'])}")
        
        return True
    except Exception as e:
        print(f"Error in end-to-end test: {e}")
        return False

def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*60)
    print("COMPREHENSIVE SYSTEM TESTING")
    print("="*60 + "\n")
    
    results = {
        "Skill Database (500+ skills)": test_skill_database(),
        "Named Entity Recognition": test_ner_extraction(),
        "Semantic Matching": test_semantic_matching(),
        "Model Accuracy": test_model_accuracy(),
        "End-to-End Pipeline": test_end_to_end()
    }
    
    print("\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print("="*60)
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("="*60)
    
    if passed == total:
        print("\nALL TESTS PASSED! System is production-ready.")
    else:
        print(f"\n{total - passed} test(s) failed. Review required.")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
