require("dotenv").config();
const { dbPromise } = require("../db");

(async () => {
  const db = await dbPromise;

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      balance_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('CASH_IN','PAYMENT','TRANSFER_IN','TRANSFER_OUT')),
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      ref TEXT,
      counterparty_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      subtotal_cents INTEGER NOT NULL,
      FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL UNIQUE,
      receipt_code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );
  `);

  // Seed items to match your prototype "utilities/services"
  const row = await db.get("SELECT COUNT(*) AS c FROM items");
  if (row.c === 0) {
    await db.run(
      `INSERT INTO items (name, description, price_cents) VALUES
      (?,?,?),
      (?,?,?),
      (?,?,?),
      (?,?,?),
      (?,?,?)`,
      "Meralco", "Electric power distribution services", 425000,
      "Maynilad", "Water and wastewater services", 85000,
      "PLDT Home", "Fixed-line and fiber internet services", 189900,
      "Globe Postpaid", "Mobile subscription plans", 149900,
      "Sky Cable", "Cable TV and broadband services", 99900
    );
  }

  console.log("Database initialized.");
  process.exit(0);
})();