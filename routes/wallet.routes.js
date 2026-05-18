const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { dbPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Balance Management (REQ-BAL-1)
router.get("/balance", auth, async (req, res) => {
  const db = await dbPromise;
  const user = await db.get("SELECT balance_cents FROM users WHERE id = ?", req.user.id);
  res.json(user || { balance_cents: 0 });
});

// Cash In (REQ-CASH-1..4)
router.post(
  "/cash-in",
  auth,
  body("amount_cents").isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { amount_cents } = req.body;
    const db = await dbPromise;
    const ref = crypto.randomUUID();

    await db.exec("BEGIN");
    try {
      await db.run(
        "UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?",
        amount_cents,
        req.user.id
      );

      await db.run(
        "INSERT INTO transactions (user_id, type, amount_cents, ref) VALUES (?,?,?,?)",
        req.user.id,
        "CASH_IN",
        amount_cents,
        ref
      );

      await db.exec("COMMIT");
      res.json({ ok: true, ref });
    } catch (e) {
      await db.exec("ROLLBACK");
      res.status(500).json({ error: "Cash in failed" });
    }
  }
);

// Send Money (REQ-SEND-1..5) — recipient by email
router.post(
  "/send",
  auth,
  body("recipient_email").isEmail().normalizeEmail(),
  body("amount_cents").isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const senderId = req.user.id;
    const { recipient_email, amount_cents } = req.body;

    const db = await dbPromise;

    const recipient = await db.get("SELECT id FROM users WHERE email = ?", recipient_email);
    if (!recipient) return res.status(404).json({ error: "Recipient not found" });
    if (recipient.id === senderId) return res.status(400).json({ error: "Cannot send to self" });

    const sender = await db.get("SELECT balance_cents FROM users WHERE id = ?", senderId);
    if (!sender || sender.balance_cents < amount_cents) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const ref = crypto.randomUUID();

    await db.exec("BEGIN");
    try {
      await db.run(
        "UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?",
        amount_cents,
        senderId
      );
      await db.run(
        "UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?",
        amount_cents,
        recipient.id
      );

      // record for sender + recipient
      await db.run(
        "INSERT INTO transactions (user_id, type, amount_cents, ref, counterparty_user_id) VALUES (?,?,?,?,?)",
        senderId,
        "TRANSFER_OUT",
        amount_cents,
        ref,
        recipient.id
      );
      await db.run(
        "INSERT INTO transactions (user_id, type, amount_cents, ref, counterparty_user_id) VALUES (?,?,?,?,?)",
        recipient.id,
        "TRANSFER_IN",
        amount_cents,
        ref,
        senderId
      );

      await db.exec("COMMIT");
      res.json({ ok: true, ref });
    } catch (e) {
      await db.exec("ROLLBACK");
      res.status(500).json({ error: "Transfer failed" });
    }
  }
);

module.exports = router;