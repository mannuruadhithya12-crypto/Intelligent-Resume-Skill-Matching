import statistics
from datetime import datetime

class ModelDriftMonitor:
    """
    Monitors model prediction distribution to detect drift.
    """
    def __init__(self):
        self.scores_history = []
        self.alert_threshold_mean = 50.0 # If mean score drops below 50, potential data drift (mismatch)
        
    def log_prediction(self, final_score):
        """Log a prediction score for monitoring"""
        self.scores_history.append({
            "score": final_score,
            "timestamp": datetime.now()
        })
        # Keep only last 1000
        if len(self.scores_history) > 1000:
            self.scores_history.pop(0)
            
    def check_drift(self):
        """Check if current distribution indicates warnings"""
        if not self.scores_history:
            return {"status": "Waiting for data", "mean_score": 0}
            
        scores = [x['score'] for x in self.scores_history]
        mean_score = statistics.mean(scores)
        std_dev = statistics.stdev(scores) if len(scores) > 1 else 0
        
        status = "Healthy"
        if mean_score < self.alert_threshold_mean:
            status = "Warning: Low Match Rates (Possible Data Drift)"
            
        return {
            "status": status,
            "sample_size": len(scores),
            "mean_score": round(mean_score, 2),
            "std_dev": round(std_dev, 2),
            "last_updated": str(datetime.now())
        }

# Global Monitor Instance
drift_monitor = ModelDriftMonitor()
