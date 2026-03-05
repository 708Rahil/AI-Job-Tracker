// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// CORS setup
const corsOptions = {
  origin: process.env.FRONTEND_URL, // e.g., https://your-frontend.vercel.app
};
app.use(cors(corsOptions));

// PostgreSQL connection using Railway environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// FastAPI microservice URL (deployed)
const AI_API_URL = process.env.AI_API_URL;

// Add a job
app.post('/jobs', async (req, res) => {
  const { title, company, description } = req.body;
  if (!title || !company || !description) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Call AI microservice for summary
    const response = await axios.post(`${AI_API_URL}/summarize`, {
      title,
      company,
      description
    });

    const summarizedJob = {
      ...response.data,
      status: 'Applied'
    };

    // Save to PostgreSQL
    const savedJob = await pool.query(
      'INSERT INTO jobs (title, company, description, summary, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [summarizedJob.title, summarizedJob.company, description, summarizedJob.summary, summarizedJob.status]
    );

    res.json(savedJob.rows[0]);
  } catch (err) {
    console.error('Error adding job:', err.message);
    res.status(500).json({ error: 'Failed to summarize job' });
  }
});

// Get all jobs (optional status filter)
app.get('/jobs', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM jobs';
    const params = [];
    if (status) {
      query += ' WHERE status=$1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching jobs:', err.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Update job status
app.put('/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE jobs SET status=$1 WHERE id=$2', [status, id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));