from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()
summarizer = pipeline("summarization")

class Job(BaseModel):
    title: str
    company: str

@app.post("/summarize")
def summarize_job(job: Job):
    text = f"{job.title} at {job.company}"
    summary = summarizer(text, max_length=30, min_length=5, do_sample=False)
    return {"title": job.title, "company": job.company, "summary": summary[0]['summary_text']}