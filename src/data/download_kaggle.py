import opendatasets as od
import os

# Dataset URL (Resume Dataset by Gaurav Dutta - Common for this task)
dataset_url = "https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset"

# Download path
data_dir = "data"

if __name__ == "__main__":
    print("Downloading dataset from Kaggle...")
    print("Note: You will be asked for your Kaggle username and API key.")
    print("If you don't have one, verify the dummy process works first.")
    
    os.makedirs(data_dir, exist_ok=True)
    od.download(dataset_url, data_dir)
    
    print(f"Download complete. Check {data_dir} folder.")
