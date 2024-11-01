import { Request, Response } from "express";

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const client = await pool.connect();
  try {
    const query = "SELECT * FROM auth WHERE email = $1";
    const result = await client.query(query, [email]);

    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ message: "Login successful", email: email });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertUserQuery =
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id";
    const insertUserResult = await client.query(insertUserQuery, [name, email]);

    const userId = insertUserResult.rows[0].id;

    const insertAuthQuery =
      "INSERT INTO auth (user_id, password_hash, email) VALUES ($1, $2, $3)";
    await client.query(insertAuthQuery, [userId, hashedPassword, email]);

    await client.query("COMMIT");

    client.release();

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
