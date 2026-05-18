const express = require("express");
const { dbPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Item list (REQ-ITEM-1..5)
router.get("/", auth, async (req, res) => {
  const db = await dbPromise;
  const items = await db.all(
    "SELECT id, name, description, price_cents FROM items WHERE active = 1 ORDER BY id ASC"
  );
  res.json(items);
});

module.exports = router;