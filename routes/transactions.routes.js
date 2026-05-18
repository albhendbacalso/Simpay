const express = require("express");
const { dbPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Transaction History (REQ-HIST-1..3)
router.get("/", auth, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;

  const txs = await db.all(
    `SELECT t.id, t.type, t.amount_cents, t.status, t.ref, t.created_at,
            r.id AS receipt_id, r.receipt_code
     FROM transactions t
     LEFT JOIN receipts r ON r.transaction_id = t.id
     WHERE t.user_id = ?
     ORDER BY datetime(t.created_at) DESC`,
    userId
  );

  res.json(txs);
});

module.exports = router;