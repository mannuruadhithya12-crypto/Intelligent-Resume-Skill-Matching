from flask import Flask, render_template, request
from src.main import run_pipeline
import os
import tempfile
import uuid

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if 'resume' not in request.files or 'jd' not in request.files:
            return "No file uploaded", 400
            
        resumes = request.files.getlist("resume")
        jd = request.files["jd"]

        if not resumes or jd.filename == '':
            return "No selected file", 400

        # Save JD once
        jd_filename = f"temp_jd_{uuid.uuid4().hex}_{jd.filename}"
        jd_path = os.path.join(tempfile.gettempdir(), jd_filename)
        jd.save(jd_path)
        
        results = []

        try:
            for resume in resumes:
                if resume.filename == '': continue
                
                resume_filename = f"temp_resume_{uuid.uuid4().hex}_{resume.filename}"
                resume_path = os.path.join(tempfile.gettempdir(), resume_filename)
                resume.save(resume_path)
                
                try:
                    score, skills, gaps = run_pipeline(resume_path, jd_path)
                    results.append({
                        "filename": resume.filename,
                        "score": score,
                        "skills": skills,
                        "gaps": gaps
                    })
                except Exception as e:
                    print(f"Error processing {resume.filename}: {e}")
                finally:
                    if os.path.exists(resume_path):
                        try: os.remove(resume_path)
                        except: pass

            # Sort results by Final Score descending
            results.sort(key=lambda x: x['score']['Final Score (%)'], reverse=True)
            
            return render_template(
                "results.html",
                results=results, # Pass list of results
                jd_filename=jd.filename
            )
        except Exception as e:
            return f"Error processing files: {str(e)}", 500
        finally:
            if os.path.exists(jd_path):
                try: os.remove(jd_path)
                except: pass
    return render_template("upload.html")

if __name__ == "__main__":
    app.run(debug=True)
