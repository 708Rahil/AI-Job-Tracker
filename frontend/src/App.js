import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3001/jobs")
      .then(res => setJobs(res.data));
  }, []);

  const addJob = () => {
    if (!title || !company) return;
    axios.post("http://localhost:3001/jobs", { title, company })
      .then(res => setJobs([...jobs, res.data]));
    setTitle("");
    setCompany("");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>AI Job Tracker</h1>

      <input placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
      <button onClick={addJob}>Add Job</button>

      <h2>Jobs:</h2>
      <ul>
        {jobs.map((job, i) => <li key={i}>{job.title} at {job.company}</li>)}
      </ul>
    </div>
  );
}

export default App;