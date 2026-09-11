"""
Semantic Similarity Matcher using BERT (SentenceTransformers) with TF-IDF Fallback.
Designed for both local environments (BERT) and lightweight serverless deployments (TF-IDF).
"""

from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_model = None
_model_failed = False

def get_bert_model():
    """Lazy load SentenceTransformer model if available."""
    global _model, _model_failed
    if _model is None and not _model_failed:
        try:
            # Lazy import with type ignore to prevent IDE missing module warnings
            from sentence_transformers import SentenceTransformer  # type: ignore
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except (ImportError, ModuleNotFoundError, Exception):
            _model_failed = True
            _model = None
    return _model

def fallback_tfidf_similarity(text1: str, text2: str) -> float:
    """Calculate cosine similarity using TF-IDF vectorization."""
    if not text1 or not text2:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english').fit_transform([text1, text2])
        vectors = vectorizer.toarray()
        if vectors.shape[0] < 2:
            return 0.0
        score = cosine_similarity([vectors[0]], [vectors[1]])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0

def semantic_similarity(resume_text: str, jd_text: str) -> float:
    """
    Compute semantic similarity percentage between resume text and job description.
    Uses BERT embeddings if available, otherwise falls back gracefully to TF-IDF cosine similarity.
    """
    if not resume_text or not jd_text:
        return 0.0
    
    bert_model = get_bert_model()
    if bert_model is not None:
        try:
            embeddings = bert_model.encode([resume_text, jd_text])
            score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return round(float(score) * 100, 2)
        except Exception:
            pass
            
    return fallback_tfidf_similarity(resume_text, jd_text)
