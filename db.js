require("dotenv").config();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPromise = open({
  filename: process.env.DB_FILE || "./simpay.db",
  driver: sqlite3.Database
});

module.exports = { dbPromise };