const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Environment variables for Postgres
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// ML microservice URL (optional)
const ML_API_URL = process.env.ML_API_URL;

// Add a new job
app.post('/jobs', async (req, res) => {
  const { title, company, description } = req.body;

  if (!title || !company || !description) {
    return res.status(422).json({ error: 'Title, company, and description are required' });
  }

  try {
    let summary;

    if (ML_API_URL) {
      // If a separate ML service exists
      const response = await axios.post(ML_API_URL, { title, company, description });
      summary = response.data.summary;
    } else {
      // Use OpenAI directly
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Summarize job descriptions in 2 concise sentences."
          },
          {
            role: "user",
            content: description
          }
        ],
        max_tokens: 120
      });

      summary = aiResponse.choices[0].message.content.trim();
    }

    // Insert into database
    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, summary, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, company, description, summary, 'Applied']
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error in /jobs POST:', err);
    res.status(500).json({ error: 'Failed to summarize or save job' });
  }
});

// Get all jobs
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

// Update job status
app.put('/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      'UPDATE jobs SET status=$1 WHERE id=$2',
      [status, id]
    );

    res.json({ message: 'Status updated' });

  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});