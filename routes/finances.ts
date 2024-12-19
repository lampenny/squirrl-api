import { Request, Response } from "express";

const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});

router.get("/:id", async (req: Request, res: Response) => {
  const financesId = req.params.id;
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM finances WHERE id = $1", [
      financesId,
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post("/edit", async (req: Request, res: Response) => {
  const { id, income, expenses, investments, credit_card_balance, pension } =
    req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const financeQuery =
      "UPDATE finances SET income = $1, expenses = $2, investments = $3, credit_card_balance = $4, pension = $5 WHERE id = $6 RETURNING *";

    const results = await client.query(financeQuery, [
      income,
      expenses,
      investments,
      credit_card_balance,
      pension,
      id,
    ]);

    if (results.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: `User financial data modified`,
      user: results.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error updating finances", error: err });
  }
});

module.exports = router;
