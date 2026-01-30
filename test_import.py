print("Starting import test...")
try:
    import torch
    print("Torch imported.")
    from sentence_transformers import SentenceTransformer
    print("SentenceTransformers imported.")
    import src.main
    print("src.main imported.")
except Exception as e:
    print(f"Error: {e}")
print("Done.")
