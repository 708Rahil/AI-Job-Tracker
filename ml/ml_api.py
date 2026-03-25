import os
import pickle
import numpy as np
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
import io

app = FastAPI()

# Load models once at startup
embedder = SentenceTransformer("all-MiniLM-L6-v2")  # lightweight, fast

with open("salary_model.pkl", "rb") as f:
    salary_model = pickle.load(f)

# ── Resume-Job Matching ──────────────────────────────────────
class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/match")
def match_resume(req: MatchRequest):
    # Embed both texts
    embeddings = embedder.encode([req.resume_text, req.job_description])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    # Skill gap: keyword matching
    common_skills = [
        "python", "javascript", "sql", "react", "node", "java", "docker",
        "kubernetes", "aws", "machine learning", "tensorflow", "typescript",
        "git", "rest api", "postgresql", "mongodb", "css", "html"
    ]
    resume_lower = req.resume_text.lower()
    job_lower = req.job_description.lower()

    missing = [
        skill for skill in common_skills
        if skill in job_lower and skill not in resume_lower
    ]

    return {
        "match_score": round(float(score) * 100, 2),
        "missing_skills": missing
    }

# ── PDF Resume Parsing ───────────────────────────────────────
@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""
    with pdfplumber.open(io.BytesIO(contents)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return {"text": text}

# ── Salary Prediction ────────────────────────────────────────
class SalaryRequest(BaseModel):
    title: str
    skills: list[str]
    years_experience: float
    location: str

@app.post("/predict-salary")
def predict_salary(req: SalaryRequest):
    # Feature engineering — encode inputs numerically
    title_map = {"software engineer": 3, "data analyst": 2, "data scientist": 4,
                 "frontend developer": 2, "backend developer": 3, "devops": 3}
    location_map = {"toronto": 1.1, "new york": 1.4, "san francisco": 1.6,
                    "remote": 1.0, "london": 1.2}

    title_score = title_map.get(req.title.lower(), 2)
    location_multiplier = location_map.get(req.location.lower(), 1.0)
    skill_score = len(req.skills)

    features = np.array([[title_score, skill_score, req.years_experience, location_multiplier]])
    predicted = salary_model.predict(features)[0]

    return {"predicted_salary": round(float(predicted), 2)}

PORT = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml_api:app", host="0.0.0.0", port=PORT)