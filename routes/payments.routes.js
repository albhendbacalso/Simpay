const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { dbPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Payment Processing (REQ-PAY-1..5) + Balance checks (REQ-BAL-2..5) + Receipt (REQ-REC-1..2)
router.post(
  "/checkout",
  auth,
  body("items").isArray({ min: 1 }),
  body("items.*.item_id").isInt({ min: 1 }),
  body("items.*.quantity").isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.user.id;
    const { items } = req.body;

    const db = await dbPromise;

    // Load prices from DB to avoid tampering
    const ids = [...new Set(items.map((i) => i.item_id))];
    const placeholders = ids.map(() => "?").join(",");
    const dbItems = await db.all(
      `SELECT id, name, price_cents FROM items WHERE active = 1 AND id IN (${placeholders})`,
      ids
    );

    if (dbItems.length !== ids.length) {
      return res.status(400).json({ error: "One or more items are invalid/inactive" });
    }

    const itemMap = new Map(dbItems.map((x) => [x.id, x]));

    // Compute totals
    let total = 0;
    const expanded = items.map((i) => {
      const it = itemMap.get(i.item_id);
      const subtotal = it.price_cents * i.quantity;
      total += subtotal;
      return {
        item_id: i.item_id,
        quantity: i.quantity,
        price_cents: it.price_cents,
        subtotal_cents: subtotal
      };
    });

    const user = await db.get("SELECT balance_cents FROM users WHERE id = ?", userId);
    if (!user || user.balance_cents < total) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const receiptCode = "SP-" + crypto.randomUUID().slice(0, 8).toUpperCase();

    await db.exec("BEGIN");
    try {
      // Deduct balance
      await db.run("UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?", total, userId);

      // Create transaction
      const tx = await db.run(
        "INSERT INTO transactions (user_id, type, amount_cents, status, ref) VALUES (?,?,?,?,?)",
        userId,
        "PAYMENT",
        total,
        "SUCCESS",
        receiptCode
      );
      const transactionId = tx.lastID;

      // Transaction items
      for (const line of expanded) {
        await db.run(
          `INSERT INTO transaction_items (transaction_id, item_id, quantity, price_cents, subtotal_cents)
           VALUES (?,?,?,?,?)`,
          transactionId,
          line.item_id,
          line.quantity,
          line.price_cents,
          line.subtotal_cents
        );
      }

      // Receipt
      const rec = await db.run(
        "INSERT INTO receipts (transaction_id, receipt_code) VALUES (?,?)",
        transactionId,
        receiptCode
      );

      await db.exec("COMMIT");
      res.json({
        ok: true,
        transaction_id: transactionId,
        receipt_id: rec.lastID,
        receipt_code: receiptCode,
        total_cents: total
      });
    } catch (e) {
      await db.exec("ROLLBACK");
      res.status(500).json({ error: "Payment failed" });
    }
  }
);

module.exports = router;