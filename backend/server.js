const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Add a job
app.post('/jobs', async (req, res) => {
  const { title, company, description } = req.body;
  if (!title || !company || !description) {
    return res.status(422).json({ error: 'Title, company, and description are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, summary, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, company, description, description, 'Applied']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding job:', err.message);
    res.status(500).json({ error: 'Failed to save job' });
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

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const FormData = require('form-data');

// ── Upload & parse resume ────────────────────────────────────
app.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const mlRes = await axios.post(`${ML_API_URL}/parse-resume`, form, {
      headers: form.getHeaders()
    });

    const { text } = mlRes.data;

    const result = await pool.query(
      `INSERT INTO resumes (filename, content) VALUES ($1, $2) RETURNING *`,
      [req.file.originalname, text]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Resume upload error:', err.message);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// ── Match resume to job ──────────────────────────────────────
app.post('/match', async (req, res) => {
  const { resume_id, job_id } = req.body;
  try {
    const resumeRes = await pool.query('SELECT content FROM resumes WHERE id=$1', [resume_id]);
    const jobRes = await pool.query('SELECT description FROM jobs WHERE id=$1', [job_id]);

    const resume_text = resumeRes.rows[0].content;
    const job_description = jobRes.rows[0].description;

    const mlRes = await axios.post(`${ML_API_URL}/match`, { resume_text, job_description });
    const { match_score, missing_skills } = mlRes.data;

    await pool.query(
      `INSERT INTO results (job_id, resume_id, match_score, missing_skills)
       VALUES ($1, $2, $3, $4)`,
      [job_id, resume_id, match_score, missing_skills]
    );

    res.json({ match_score, missing_skills });
  } catch (err) {
    console.error('Match error:', err.message);
    res.status(500).json({ error: 'Match failed' });
  }
});

// ── Predict salary ───────────────────────────────────────────
app.post('/predict-salary', async (req, res) => {
  try {
    const mlRes = await axios.post(`${ML_API_URL}/predict-salary`, req.body);
    res.json(mlRes.data);
  } catch (err) {
    console.error('Salary prediction error:', err.message);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));