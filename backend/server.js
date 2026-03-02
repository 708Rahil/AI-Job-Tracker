// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Backend running!'));

const PORT = 3001; // changed from 5000 to 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let jobs = []; // in-memory storage

// Get all jobs
app.get('/jobs', (req, res) => {
  res.json(jobs);
});

// Add a new job
app.post('/jobs', (req, res) => {
  const job = req.body; // expects {title, company}
  jobs.push(job);
  res.status(201).json(job);
});