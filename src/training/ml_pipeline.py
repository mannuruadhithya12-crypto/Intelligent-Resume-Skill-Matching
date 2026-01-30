"""
Complete ML Pipeline for Resume Matching
Implements the full workflow from raw data to trained model
"""

import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from src.preprocessing.text_cleaner import clean_text
from src.feature_extraction.skill_extractor import extract_skills
from src.feature_extraction.experience_extractor import extract_experience
from src.matching.semantic_matcher_bert import semantic_similarity
from src.matching.experience_weight import experience_score

class MLPipeline:
    """
    Complete ML Pipeline for Resume-JD Matching
    
    Pipeline Steps:
    1. Data Cleaning & Normalization
    2. Resume-JD Pair Generation
    3. Feature Engineering
    4. Label Generation
    5. Train/Validation/Test Split
    6. Model Training
    7. Hyperparameter Tuning
    8. Evaluation
    9. Model Saving
    """
    
    def __init__(self, output_dir="data/processed"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def step1_data_cleaning(self, resume_df, jd_df):
        """
        Step 1: Data Cleaning & Normalization
        
        Args:
            resume_df: DataFrame with columns ['id', 'text', 'category']
            jd_df: DataFrame with columns ['id', 'text', 'category']
            
        Returns:
            Cleaned DataFrames
        """
        print("="*60)
        print("STEP 1: Data Cleaning & Normalization")
        print("="*60)
        
        # Clean resume text
        print(f"Cleaning {len(resume_df)} resumes...")
        resume_df['cleaned_text'] = resume_df['text'].apply(clean_text)
        
        # Clean JD text
        print(f"Cleaning {len(jd_df)} job descriptions...")
        jd_df['cleaned_text'] = jd_df['text'].apply(clean_text)
        
        # Remove empty entries
        resume_df = resume_df[resume_df['cleaned_text'].str.len() > 50]
        jd_df = jd_df[jd_df['cleaned_text'].str.len() > 50]
        
        print(f"After cleaning: {len(resume_df)} resumes, {len(jd_df)} JDs")
        
        return resume_df, jd_df
    
    def step2_pair_generation(self, resume_df, jd_df, pairs_per_jd=10):
        """
        Step 2: Resume-JD Pair Generation
        
        Creates positive and negative pairs for training
        
        Args:
            resume_df: Cleaned resume DataFrame
            jd_df: Cleaned JD DataFrame
            pairs_per_jd: Number of resume-JD pairs per job description
            
        Returns:
            DataFrame with resume-JD pairs
        """
        print("\n" + "="*60)
        print("STEP 2: Resume-JD Pair Generation")
        print("="*60)
        
        pairs = []
        
        for _, jd_row in jd_df.iterrows():
            jd_category = jd_row['category']
            jd_text = jd_row['cleaned_text']
            jd_id = jd_row['id']
            
            # Get matching resumes (positive examples)
            matching_resumes = resume_df[resume_df['category'] == jd_category]
            
            # Get non-matching resumes (negative examples)
            non_matching_resumes = resume_df[resume_df['category'] != jd_category]
            
            # Sample positive pairs
            n_positive = min(pairs_per_jd // 2, len(matching_resumes))
            if n_positive > 0:
                positive_samples = matching_resumes.sample(n=n_positive, replace=False)
                for _, resume_row in positive_samples.iterrows():
                    pairs.append({
                        'resume_id': resume_row['id'],
                        'jd_id': jd_id,
                        'resume_text': resume_row['cleaned_text'],
                        'jd_text': jd_text,
                        'resume_category': resume_row['category'],
                        'jd_category': jd_category,
                        'label': 1  # Positive match
                    })
            
            # Sample negative pairs
            n_negative = min(pairs_per_jd // 2, len(non_matching_resumes))
            if n_negative > 0:
                negative_samples = non_matching_resumes.sample(n=n_negative, replace=False)
                for _, resume_row in negative_samples.iterrows():
                    pairs.append({
                        'resume_id': resume_row['id'],
                        'jd_id': jd_id,
                        'resume_text': resume_row['cleaned_text'],
                        'jd_text': jd_text,
                        'resume_category': resume_row['category'],
                        'jd_category': jd_category,
                        'label': 0  # Negative match
                    })
        
        pairs_df = pd.DataFrame(pairs)
        print(f"Generated {len(pairs_df)} resume-JD pairs")
        print(f"Positive pairs: {sum(pairs_df['label'])}")
        print(f"Negative pairs: {len(pairs_df) - sum(pairs_df['label'])}")
        
        return pairs_df
    
    def step3_feature_engineering(self, pairs_df):
        """
        Step 3: Feature Engineering
        
        Extracts features from resume-JD pairs
        
        Returns:
            DataFrame with engineered features
        """
        print("\n" + "="*60)
        print("STEP 3: Feature Engineering")
        print("="*60)
        
        features = []
        
        for idx, row in pairs_df.iterrows():
            if idx % 100 == 0:
                print(f"Processing pair {idx}/{len(pairs_df)}...")
            
            resume_text = row['resume_text']
            jd_text = row['jd_text']
            
            # Feature 1: Semantic Similarity
            semantic_score = semantic_similarity(resume_text, jd_text)
            
            # Feature 2: Skill Overlap
            resume_skills = set(extract_skills(resume_text))
            jd_skills = set(extract_skills(jd_text))
            skill_overlap = len(resume_skills.intersection(jd_skills))
            
            # Feature 3: Experience Score
            resume_exp = extract_experience(resume_text)
            exp_score = experience_score(resume_exp, 3)  # Assume 3 years required
            
            # Feature 4: Education Score (simplified)
            edu_score = 60
            if 'phd' in resume_text or 'doctorate' in resume_text:
                edu_score = 100
            elif 'master' in resume_text or 'ms' in resume_text:
                edu_score = 80
            elif 'bachelor' in resume_text or 'bs' in resume_text:
                edu_score = 70
            
            features.append({
                'semantic_score': semantic_score,
                'skill_overlap': skill_overlap,
                'experience_score': exp_score,
                'education_score': edu_score,
                'label': row['label']
            })
        
        features_df = pd.DataFrame(features)
        print(f"\nFeature engineering complete!")
        print(f"Features shape: {features_df.shape}")
        print(f"Feature columns: {list(features_df.columns)}")
        
        return features_df
    
    def step4_train_test_split(self, features_df, test_size=0.2, val_size=0.1):
        """
        Step 4: Train/Validation/Test Split
        
        Args:
            features_df: DataFrame with features and labels
            test_size: Proportion for test set
            val_size: Proportion for validation set
            
        Returns:
            X_train, X_val, X_test, y_train, y_val, y_test
        """
        print("\n" + "="*60)
        print("STEP 4: Train/Validation/Test Split")
        print("="*60)
        
        from sklearn.model_selection import train_test_split
        
        X = features_df.drop('label', axis=1)
        y = features_df['label']
        
        # First split: train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Second split: train vs val
        val_ratio = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_ratio, random_state=42, stratify=y_temp
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Validation set: {len(X_val)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def step5_train_model(self, X_train, X_val, y_train, y_val, use_ensemble=True):
        """
        Step 5: Model Training with Hyperparameter Tuning
        
        Returns:
            Trained model
        """
        print("\n" + "="*60)
        print("STEP 5: Model Training & Hyperparameter Tuning")
        print("="*60)
        
        if use_ensemble:
            from src.training.ensemble_model import create_ensemble_model
            model = create_ensemble_model()
        else:
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=200, random_state=42)
        
        print("Training model...")
        model.fit(X_train, y_train)
        
        # Validation performance
        from sklearn.metrics import accuracy_score, f1_score
        val_pred = model.predict(X_val)
        val_accuracy = accuracy_score(y_val, val_pred)
        val_f1 = f1_score(y_val, val_pred)
        
        print(f"Validation Accuracy: {val_accuracy*100:.2f}%")
        print(f"Validation F1-Score: {val_f1*100:.2f}%")
        
        return model
    
    def step6_evaluate(self, model, X_test, y_test):
        """
        Step 6: Final Evaluation
        
        Returns:
            Dictionary with evaluation metrics
        """
        print("\n" + "="*60)
        print("STEP 6: Final Model Evaluation")
        print("="*60)
        
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            classification_report, confusion_matrix
        )
        
        y_pred = model.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred)
        }
        
        print("\n" + "="*60)
        print("FINAL MODEL PERFORMANCE")
        print("="*60)
        print(f"Accuracy:  {metrics['accuracy']*100:.2f}%")
        print(f"Precision: {metrics['precision']*100:.2f}%")
        print(f"Recall:    {metrics['recall']*100:.2f}%")
        print(f"F1-Score:  {metrics['f1']*100:.2f}%")
        print("="*60)
        
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        
        return metrics
    
    def step7_save_model(self, model, filepath="models/final_model.pkl"):
        """
        Step 7: Save Final Model
        """
        print("\n" + "="*60)
        print("STEP 7: Saving Final Model")
        print("="*60)
        
        import joblib
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(model, filepath)
        print(f"Model saved to: {filepath}")
    
    def run_complete_pipeline(self, resume_df, jd_df, use_ensemble=True):
        """
        Run the complete ML pipeline
        
        Args:
            resume_df: Raw resume DataFrame
            jd_df: Raw JD DataFrame
            use_ensemble: Whether to use ensemble model
            
        Returns:
            Trained model and evaluation metrics
        """
        print("\n" + "="*60)
        print("COMPLETE ML PIPELINE EXECUTION")
        print("="*60 + "\n")
        
        # Step 1: Data Cleaning
        resume_df, jd_df = self.step1_data_cleaning(resume_df, jd_df)
        
        # Step 2: Pair Generation
        pairs_df = self.step2_pair_generation(resume_df, jd_df)
        
        # Step 3: Feature Engineering
        features_df = self.step3_feature_engineering(pairs_df)
        
        # Step 4: Train/Val/Test Split
        X_train, X_val, X_test, y_train, y_val, y_test = self.step4_train_test_split(features_df)
        
        # Step 5: Model Training
        model = self.step5_train_model(X_train, X_val, y_train, y_val, use_ensemble)
        
        # Step 6: Evaluation
        metrics = self.step6_evaluate(model, X_test, y_test)
        
        # Step 7: Save Model
        self.step7_save_model(model)
        
        print("\n" + "="*60)
        print("PIPELINE EXECUTION COMPLETE!")
        print("="*60)
        
        return model, metrics

if __name__ == "__main__":
    print("ML Pipeline Module")
    print("Import this module and use MLPipeline class")
    print("\nExample:")
    print("  from src.training.ml_pipeline import MLPipeline")
    print("  pipeline = MLPipeline()")
    print("  model, metrics = pipeline.run_complete_pipeline(resume_df, jd_df)")
