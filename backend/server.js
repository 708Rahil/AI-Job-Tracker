const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// PostgreSQL connection
// ===============================
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// ===============================
// Hugging Face summarization
// ===============================
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
const HF_API_KEY = process.env.HF_API_KEY; // optional, for higher rate limits

async function summarizeWithHF(description) {
  try {
    const response = await axios.post(
      HF_MODEL_URL,
      { inputs: description },
      {
        headers: HF_API_KEY
          ? { Authorization: `Bearer ${HF_API_KEY}` }
          : {},
        timeout: 10000 // 10 sec timeout
      }
    );
    return response.data[0]?.summary_text || description;
  } catch (err) {
    console.error("Hugging Face summary error:", err.message);
    return description; // fallback to original description
  }
}

// ===============================
// Add a new job
// ===============================
app.post('/jobs', async (req, res) => {
  const { title, company, description } = req.body;

  if (!title || !company || !description) {
    return res.status(422).json({ error: 'Title, company, and description are required' });
  }

  try {
    // Generate summary via Hugging Face
    const summary = await summarizeWithHF(description);

    // Save job to database
    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, summary, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, company, description, summary, "Applied"]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error in /jobs POST:", err.message);
    res.status(500).json({ error: "Failed to summarize or save job" });
  }
});

// ===============================
// Get all jobs
// ===============================
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
    console.error('Error in /jobs GET:', err.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ===============================
// Update job status
// ===============================
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

// ===============================
// Start server
// ===============================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Using Hugging Face model: ${HF_MODEL_URL}`);
});