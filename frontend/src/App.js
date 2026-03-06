import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://ai-job-tracker-production.up.railway.app";

function App() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false); // new state for summary loading

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const addJob = async () => {
    if (!title || !company || !description) return;

    try {
      setLoading(true); // start loading
      const res = await axios.post(`${API_URL}/jobs`, { title, company, description });
      setJobs([...jobs, res.data]);
      setTitle(""); setCompany(""); setDescription("");
    } catch (err) {
      console.error("Error adding job:", err);
    } finally {
      setLoading(false); // stop loading
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/jobs/${id}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "Applied": return "#3b82f6";
      case "Interviewing": return "#facc15";
      case "Rejected": return "#ef4444";
      case "Offer": return "#10b981";
      default: return "#6b7280";
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>AI Job Tracker</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
        <textarea placeholder="Paste full job description here" value={description} onChange={e => setDescription(e.target.value)} />
        <button
          onClick={addJob}
          disabled={loading}
          style={{
            background: "#3b82f6",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Generating Summary..." : "Add Job"}
        </button>
      </div>

      <h2>Jobs:</h2>
      {jobs.map(job => (
        <div key={job.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>{job.title} at {job.company}</h3>
            <span style={{ backgroundColor: statusColor(job.status || "Applied"), color: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>
              {job.status || "Applied"}
            </span>
          </div>
          <p><strong>Summary:</strong> {job.summary}</p>
          <div>
            <label>Change Status:</label>
            <select value={job.status || "Applied"} onChange={e => handleStatusChange(job.id, e.target.value)}>
              <option>Applied</option>
              <option>Interviewing</option>
              <option>Rejected</option>
              <option>Offer</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;