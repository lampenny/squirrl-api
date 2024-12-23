import { Request, Response } from "express";

const express = require("express");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const router = express.Router();
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

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Remove sensitive fields before returning the user object
    const { password_hash, ...safeUser } = user;

    // Send the response with the sanitized user object
    res.status(200).json({
      message: "Login successful",
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err });
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

    const insertFinanceQuery = `
    INSERT INTO overview (user_id, income, expenses, investments, credit_card_balance, pension)
    VALUES ($1, 0, 0, 0, 0, 0);`;

    await client.query(insertFinanceQuery, [userId]);

    await client.query("COMMIT");

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error registering user", error: err });
  }
});

module.exports = router;
