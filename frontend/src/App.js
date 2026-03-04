import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  const fetchJobs = async () => {
    const res = await axios.get("http://localhost:3001/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Add new job
  const addJob = async () => {
    if (!title || !company || !description) return;
    try {
      const res = await axios.post("http://localhost:3001/jobs", {
        title,
        company,
        description
      });
      setJobs([...jobs, res.data]);
      setTitle("");
      setCompany("");
      setDescription("");
    } catch (err) {
      console.error("Error adding job:", err);
    }
  };

  // Update job status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:3001/jobs/${id}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Color for status badges
  const statusColor = (status) => {
    switch (status) {
      case "Applied": return "#3b82f6";      // blue
      case "Interviewing": return "#facc15"; // yellow
      case "Rejected": return "#ef4444";     // red
      case "Offer": return "#10b981";        // green
      default: return "#6b7280";             // gray
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>AI Job Tracker</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          placeholder="Job Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
        <input
          placeholder="Company"
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
        <textarea
          placeholder="Paste full job description here"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ padding: "0.5rem", minHeight: "100px" }}
        />
        <button
          onClick={addJob}
          style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}
        >
          Add Job
        </button>
      </div>

      <h2>Jobs:</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {jobs.map(job => (
          <div key={job.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{job.title} at {job.company}</h3>
              <span
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  color: "white",
                  backgroundColor: statusColor(job.status || "Applied"),
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "0.75rem"
                }}
              >
                {job.status || "Applied"}
              </span>
            </div>
            <p style={{ marginTop: "0.5rem" }}><strong>Summary:</strong> {job.summary}</p>
            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ marginRight: "0.5rem" }}>Change Status:</label>
              <select value={job.status || "Applied"} onChange={e => handleStatusChange(job.id, e.target.value)} style={{ padding: "0.25rem 0.5rem" }}>
                <option>Applied</option>
                <option>Interviewing</option>
                <option>Rejected</option>
                <option>Offer</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;