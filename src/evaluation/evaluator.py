from sklearn.metrics import precision_score, recall_score, f1_score

def evaluate(y_true, y_pred):
    return {
        "Precision": precision_score(y_true, y_pred),
        "Recall": recall_score(y_true, y_pred),
        "F1 Score": f1_score(y_true, y_pred)
    }

# Alias for backward compatibility
def evaluate_model(y_true, y_pred):
    """Evaluate model performance with precision, recall, and F1 score"""
    return evaluate(y_true, y_pred)

