import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://ai-job-tracker-production.up.railway.app"; // e.g., https://your-backend.up.railway.app
console.log("Backend URL:", API_URL);

function App() {
  // Job tracking states
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  // Resume + AI feature states
  const [resumeId, setResumeId] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [salaryResult, setSalaryResult] = useState(null);
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");

  // Fetch all jobs from backend
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // Add a new job
  const addJob = async () => {
    if (!title || !company || !description) return;
    try {
      const res = await axios.post(`${API_URL}/jobs`, { title, company, description });
      setJobs([...jobs, res.data]);
      setTitle(""); setCompany(""); setDescription("");
    } catch (err) {
      console.error("Error adding job:", err);
    }
  };

  // Update job status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/jobs/${id}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Color coding for job status
  const statusColor = (status) => {
    switch (status) {
      case "Applied": return "#3b82f6";
      case "Interviewing": return "#facc15";
      case "Rejected": return "#ef4444";
      case "Offer": return "#10b981";
      default: return "#6b7280";
    }
  };

  // ---------------- AI / Resume features ----------------

  // Upload resume
  const uploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("resume", file);

    try {
      const res = await axios.post(`${API_URL}/resume/upload`, form);
      setResumeId(res.data.id);
      alert(`Resume uploaded! ID: ${res.data.id}`);
    } catch (err) {
      console.error("Error uploading resume:", err);
      alert("Failed to upload resume.");
    }
  };

  // Match resume to a job
  const matchJob = async (jobId) => {
    if (!resumeId) return alert("Please upload a resume first");

    try {
      const res = await axios.post(`${API_URL}/match`, {
        resume_id: resumeId,
        job_id: jobId
      });
      setMatchResult({ jobId, ...res.data });
    } catch (err) {
      console.error("Error matching resume:", err);
    }
  };

  // Predict salary for a job
  const predictSalary = async (job) => {
    try {
      const res = await axios.post(`${API_URL}/predict-salary`, {
        title: job.title,
        skills: [],
        years_experience: parseFloat(experience) || 0,
        location: location || "remote"
      });
      setSalaryResult({ jobId: job.id, ...res.data });
    } catch (err) {
      console.error("Error predicting salary:", err);
    }
  };

  // ---------------- Render ----------------
  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>AI Job Tracker</h1>

      {/* Add Job Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
        <textarea placeholder="Paste full job description here" value={description} onChange={e => setDescription(e.target.value)} />
        <button onClick={addJob} style={{ background: "#3b82f6", color: "white", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}>Add Job</button>
      </div>

      {/* Resume Upload */}
      <div style={{ marginBottom: "1rem" }}>
        <h2>Upload Resume</h2>
        <input type="file" accept=".pdf" onChange={uploadResume} />
        {resumeId && <p style={{ color: "green" }}>✓ Resume loaded (ID: {resumeId})</p>}
      </div>

      {/* Salary Inputs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="Years of experience" value={experience} onChange={e => setExperience(e.target.value)} />
        <input placeholder="Location (e.g. Toronto)" value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      {/* Job List */}
      <h2>Jobs:</h2>
      {jobs.map(job => (
        <div key={job.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>{job.title} at {job.company}</h3>
            <span style={{ backgroundColor: statusColor(job.status || "Applied"), color: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>
              {job.status || "Applied"}
            </span>
          </div>
          <p><strong>Summary:</strong> {job.summary || job.description}</p>

          {/* Status Change */}
          <div>
            <label>Change Status:</label>
            <select value={job.status || "Applied"} onChange={e => handleStatusChange(job.id, e.target.value)}>
              <option>Applied</option>
              <option>Interviewing</option>
              <option>Rejected</option>
              <option>Offer</option>
            </select>
          </div>

          {/* AI Buttons */}
          <div style={{ marginTop: "0.5rem" }}>
            <button onClick={() => matchJob(job.id)} style={{ marginRight: "0.5rem" }}>Match Resume</button>
            <button onClick={() => predictSalary(job)}>Predict Salary</button>
          </div>

          {/* AI Results */}
          {matchResult?.jobId === job.id && (
            <div>
              <p>Match Score: <strong>{matchResult.match_score}%</strong></p>
              <p>Missing Skills: {matchResult.missing_skills.join(", ") || "None"}</p>
            </div>
          )}
          {salaryResult?.jobId === job.id && (
            <p>Predicted Salary: <strong>${salaryResult.predicted_salary.toLocaleString()}</strong></p>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;