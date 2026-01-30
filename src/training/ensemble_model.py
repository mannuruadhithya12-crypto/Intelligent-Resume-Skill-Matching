"""
Ensemble Model for Resume Matching
Combines RandomForest + XGBoost for maximum accuracy
"""

import pandas as pd
import numpy as np
import sys
import os
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Ensure directories exist
os.makedirs("models", exist_ok=True)

def create_ensemble_model():
    """
    Create an ensemble model combining multiple classifiers
    
    Returns:
        VotingClassifier with optimized hyperparameters
    """
    # RandomForest with tuned parameters
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    # XGBoost with tuned parameters
    xgb_model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    # Logistic Regression for linear patterns
    lr_model = LogisticRegression(
        random_state=42,
        max_iter=1000
    )
    
    # Voting Classifier (soft voting for probability-based decisions)
    ensemble = VotingClassifier(
        estimators=[
            ('rf', rf_model),
            ('xgb', xgb_model),
            ('lr', lr_model)
        ],
        voting='soft',
        weights=[2, 2, 1]  # Give more weight to RF and XGB
    )
    
    return ensemble

def hyperparameter_tuning(X_train, y_train):
    """
    Perform hyperparameter tuning using GridSearchCV
    
    Returns:
        Best estimator
    """
    print("Performing hyperparameter tuning (this may take time)...")
    
    # Define parameter grid for RandomForest
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [10, 15, 20],
        'min_samples_split': [2, 5],
    }
    
    rf = RandomForestClassifier(random_state=42)
    
    grid_search = GridSearchCV(
        rf,
        param_grid,
        cv=5,
        scoring='f1',
        n_jobs=-1,
        verbose=1
    )
    
    grid_search.fit(X_train, y_train)
    
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best CV score: {grid_search.best_score_:.4f}")
    
    return grid_search.best_estimator_

def train_ensemble_model(X_train, X_test, y_train, y_test, use_tuning=False):
    """
    Train the ensemble model
    
    Args:
        X_train, X_test, y_train, y_test: Train/test splits
        use_tuning: Whether to perform hyperparameter tuning
        
    Returns:
        Trained model and metrics
    """
    if use_tuning:
        # Use hyperparameter tuning
        model = hyperparameter_tuning(X_train, y_train)
    else:
        # Use pre-configured ensemble
        model = create_ensemble_model()
    
    print(f"Training model on {X_train.shape[0]} samples...")
    model.fit(X_train, y_train)
    
    # Cross-validation score
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
    print(f"Cross-validation F1 scores: {cv_scores}")
    print(f"Mean CV F1: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Evaluation Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }
    
    print("\n" + "="*50)
    print("ENSEMBLE MODEL PERFORMANCE")
    print("="*50)
    print(f"Accuracy:  {accuracy*100:.2f}%")
    print(f"Precision: {precision*100:.2f}%")
    print(f"Recall:    {recall*100:.2f}%")
    print(f"F1-score:  {f1*100:.2f}%")
    print("="*50)
    
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred))
    
    return model, metrics

def save_ensemble_model(model, filepath="models/ensemble_classifier.pkl"):
    """Save the trained ensemble model"""
    joblib.dump(model, filepath)
    print(f"\nEnsemble model saved to '{filepath}'")

def load_ensemble_model(filepath="models/ensemble_classifier.pkl"):
    """Load a trained ensemble model"""
    return joblib.load(filepath)

if __name__ == "__main__":
    print("Ensemble Model Training Module")
    print("This module should be imported and used with training data")
    print("Example usage:")
    print("  from src.training.ensemble_model import train_ensemble_model")
    print("  model, metrics = train_ensemble_model(X_train, X_test, y_train, y_test)")
