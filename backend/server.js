const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: 'rahilgandhi',       // <-- replace with your Mac PostgreSQL username
    host: 'localhost',
    database: 'ai_job_tracker',
    password: '',              // add your password if you set one
    port: 5432,
});

// Add a job
app.post('/jobs', async (req, res) => {
    const { title, company, description } = req.body;
    try {
        // Call AI microservice
        const response = await axios.post('http://localhost:8000/summarize', {
            title,
            company,
            description
        });

        const summarizedJob = {
            ...response.data,
            status: 'Applied'  // default status
        };

        // Save to database
        const savedJob = await pool.query(
          'INSERT INTO jobs (title, company, description, summary, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [summarizedJob.title, summarizedJob.company, description, summarizedJob.summary, summarizedJob.status]
        );

        res.json(savedJob.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to summarize job' });
    }
});

// Get all jobs (optional: filter by status with query param)
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
        console.error("Error fetching jobs:", err.message);
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
        console.error("Error updating status:", err.message);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Start backend server
app.listen(3001, () => console.log('Server running on port 3001'));