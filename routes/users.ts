import { Request, Response } from "express";

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});

// GET all /users
router.get("/all", async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const query = "SELECT * FROM users";
    const result = await client.query(query);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

// GET user by id
router.get("/:id", async (req: Request, res: Response) => {
  const userId = req.params.id;
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
