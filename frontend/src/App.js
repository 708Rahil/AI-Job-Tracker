import React, { useState, useEffect } from "react";

const API_URL = "https://ai-job-tracker-production.up.railway.app";

function App() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // ===============================
  // Fetch jobs
  // ===============================
  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ===============================
  // Add job
  // ===============================
  const addJob = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          company,
          description,
        }),
      });

      const newJob = await res.json();

      setJobs([newJob, ...jobs]);

      // Clear form
      setTitle("");
      setCompany("");
      setDescription("");
    } catch (err) {
      console.error("Error adding job:", err);
    }

    setLoading(false);
  };

  // ===============================
  // Update job status
  // ===============================
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/jobs/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      fetchJobs();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AI Job Tracker</h1>

      {/* =============================== */}
      {/* Add Job Form */}
      {/* =============================== */}
      <form onSubmit={addJob} style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />

        <textarea
          placeholder="Paste job description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Generating AI Summary..." : "Add Job"}
        </button>
      </form>

      {/* =============================== */}
      {/* Job List */}
      {/* =============================== */}
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>
            {job.title} — {job.company}
          </h3>

          <p>
            <strong>Status:</strong> {job.status}
          </p>

          <p>
            <strong>AI Summary:</strong>
          </p>

          <p>{job.summary}</p>

          <select
            value={job.status}
            onChange={(e) => updateStatus(job.id, e.target.value)}
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      ))}
    </div>
  );
}

export default App;