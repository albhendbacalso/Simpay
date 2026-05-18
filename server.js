require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const itemsRoutes = require("./routes/items.routes");
const walletRoutes = require("./routes/wallet.routes");
const paymentsRoutes = require("./routes/payments.routes");
const transactionsRoutes = require("./routes/transactions.routes");
const receiptsRoutes = require("./routes/receipts.routes");

const app = express();

// Configure Helmet for development (allow Tailwind CDN + inline scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(morgan("dev"));
app.use(express.json());

// Serve your prototype pages
app.use(express.static("public"));

app.get("/health", (_, res) => res.json({ ok: true }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/receipts", receiptsRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`SimPay running at http://localhost:${port}`);
});