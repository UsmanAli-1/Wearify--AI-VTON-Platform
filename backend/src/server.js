process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

/* CORS */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://wearify-mu.vercel.app",
    "https://wearify-vton.vercel.app",
  ],
  credentials: true,
}));

app.use(cookieParser());

// ⚠️ Webhook MUST be before express.json() — needs raw body
const { router: paymentRouter, webhook } = require("./routes/payment");
app.use("/api/payment/webhook", express.raw({ type: "application/json" }), webhook);

app.use(express.json());

// Regular routes
app.use("/api/payment", paymentRouter);
app.use("/api/garments", require("./routes/garments"));
app.use("/api/users", require("./routes/users"));

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("🔥 EXPRESS ERROR:", err);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  try {
    console.log("🔧 Starting server...");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ connected to mongoDB");

    const port = process.env.PORT || 4000;

    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${port}`);
    });

  } catch (err) {
    console.error("❌ startup error", err);
    process.exit(1);
  }
}

start();