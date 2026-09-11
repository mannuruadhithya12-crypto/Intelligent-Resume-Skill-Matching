from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_model = None
_model_failed = False

def get_bert_model():
    global _model, _model_failed
    if _model is None and not _model_failed:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _model_failed = True
            _model = None
    return _model

def fallback_tfidf_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    try:
        vectorizer = TfidfVectorizer().fit_transform([text1, text2])
        vectors = vectorizer.toarray()
        score = cosine_similarity([vectors[0]], [vectors[1]])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0

def semantic_similarity(resume_text: str, jd_text: str) -> float:
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

