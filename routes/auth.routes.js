const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { dbPromise } = require("../db");
require("dotenv").config();

const router = express.Router();

// Register (REQ-AUTH-1, REQ-AUTH-2)
router.post(
  "/register",
  body("username").isString().trim().isLength({ min: 3 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;
    const db = await dbPromise;

    const exists = await db.get(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      username,
      email
    );
    if (exists) return res.status(409).json({ error: "Username or email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const r = await db.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
      username,
      email,
      password_hash
    );

    res.status(201).json({ id: r.lastID, username, email });
  }
);

// Login (REQ-AUTH-3/4/5)
router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const db = await dbPromise;

    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "2h"
    });

    res.json({ token });
  }
);

module.exports = router;