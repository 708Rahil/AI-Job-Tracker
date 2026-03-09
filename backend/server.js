const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool } = require("pg");
const OpenAI = require("openai");

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
// OpenAI client
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============================
// Function to summarize job
// ===============================
async function summarizeJob(description) {
  try {
    const prompt = `Summarize this job description in 2-3 sentences:\n\n${description}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert at summarizing job descriptions clearly and concisely." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const summary = completion.choices[0].message.content.trim();
    return summary || description.split(". ").slice(0, 3).join(". ") + ".";

  } catch (err) {
    console.error("OpenAI summary error:", err.message);
    return description.split(". ").slice(0, 3).join(". ") + ".";
  }
}

// ===============================
// Routes: Add / Get / Update jobs
// ===============================
app.post("/jobs", async (req, res) => {
  const { title, company, description } = req.body;
  if (!title || !company || !description) {
    return res.status(422).json({ error: "Title, company, and description are required" });
  }

  try {
    const summary = await summarizeJob(description);
    console.log("Generated summary:", summary);

    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, summary, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, company, description, summary, "Applied"]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error in /jobs POST:", err.message);
    res.status(500).json({ error: "Failed to summarize or save job" });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT * FROM jobs";
    const params = [];
    if (status) { query += " WHERE status=$1"; params.push(status); }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in /jobs GET:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.put("/jobs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE jobs SET status=$1 WHERE id=$2", [status, id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ===============================
// Start server
// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});