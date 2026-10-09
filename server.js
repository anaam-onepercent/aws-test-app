// Tiny test app: Express web server + PostgreSQL database.
// It serves a web page, a small notes API, and a health check.
require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database connection. Settings come from the .env file.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // AWS managed databases require an encrypted connection.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Create the table automatically the first time the app starts.
async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      text VARCHAR(500) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log("Database ready: 'notes' table exists.");
}

// Health check: tells you if the server AND the database are working.
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS db_time, version() AS db_version");
    res.json({
      server: "ok",
      database: "ok",
      dbTime: result.rows[0].db_time,
      dbVersion: result.rows[0].db_version.split(" ").slice(0, 2).join(" "),
    });
  } catch (err) {
    res.status(500).json({ server: "ok", database: "error", message: err.message });
  }
});

// List all notes
app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a note
app.post("/api/notes", async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).json({ error: "Note text is required." });
  try {
    const result = await pool.query(
      "INSERT INTO notes (text) VALUES ($1) RETURNING *",
      [text.slice(0, 500)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await setupDatabase();
  } catch (err) {
    console.error("Could not connect to the database:", err.message);
    console.error("Check the DB_ settings in your .env file.");
  }
});
