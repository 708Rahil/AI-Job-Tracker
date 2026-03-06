from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# Load a summarization model
# e.g., t5-small for speed, or bart-large-cnn for better quality
summarizer = pipeline("summarization", model="t5-small")  


class Job(BaseModel):
    title: str
    company: str
    description: str

@app.post("/summarize")
def summarize(job: Job):
    text = job.description  # feed description to AI
    # summarizer returns a list of dicts with 'summary_text'
    summary = summarizer(
        text,
        max_length=120,   # adjust for concise summary
        min_length=40,
        do_sample=False
    )
    return {
        "title": job.title,
        "company": job.company,
        "summary": summary[0]['summary_text']
    }