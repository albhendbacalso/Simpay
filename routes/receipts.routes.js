const express = require("express");
const { dbPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// View receipt details (REQ-REC-1..3)
router.get("/:id", auth, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const receiptId = Number(req.params.id);

  const receipt = await db.get(
    `SELECT r.id, r.receipt_code, r.created_at,
            t.id AS transaction_id, t.amount_cents, t.status, t.type
     FROM receipts r
     JOIN transactions t ON t.id = r.transaction_id
     WHERE r.id = ? AND t.user_id = ?`,
    receiptId,
    userId
  );

  if (!receipt) return res.status(404).json({ error: "Receipt not found" });

  const items = await db.all(
    `SELECT i.name, ti.quantity, ti.price_cents, ti.subtotal_cents
     FROM transaction_items ti
     JOIN items i ON i.id = ti.item_id
     WHERE ti.transaction_id = ?
     ORDER BY ti.id ASC`,
    receipt.transaction_id
  );

  res.json({ receipt, items });
});

module.exports = router;