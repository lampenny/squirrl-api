import { Request, Response, NextFunction } from "express";
import * as session from "express-session";

const express = require("express");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});

declare module "express-session" {
  interface SessionData {
    userId: string | null;
  }
}

interface AuthenticatedRequest extends Request {
  session: session.Session &
    Partial<session.SessionData> & { user: string | null };
}

function isAuthenticated(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (req.session.user) {
    next();
  } else {
    next("route");
  }
}

router.get("/auth/session", isAuthenticated);

router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
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

    req.session.userId = user.user_id;

    const { password_hash, ...safeUser } = user;

    res.status(200).json({
      message: "Login successful",
      user: safeUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    client.release();
  }
});

router.post(
  "/logout",
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  }
);

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
    INSERT INTO finances (user_id, income, expenses, investments, credit_card_balance, pension)
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
