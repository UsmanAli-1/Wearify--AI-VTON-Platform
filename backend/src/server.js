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
const axios = require("axios");
const imageRoutes = require("./routes/images");
const suggestionsRouter = require("./routes/suggestions");

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


const app = express();

/* CORS */
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      const allowed = [
        "http://localhost:3000",
        "https://wearify-mu.vercel.app",
        "https://wearify-vton.vercel.app",
      ];
      
      if (allowed.includes(origin)) return callback(null, true);
      
      // Allow local network IPs (mobile dev)
      if (origin.startsWith("http://192.168.") || origin.startsWith("http://10.")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(cookieParser());

//  Webhook MUST be before express.json() — needs raw body
const { router: paymentRouter, webhook } = require("./routes/payment");
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  webhook,
);

app.use(express.json());

// Regular routes
app.use("/api/payment", paymentRouter);
app.use("/api/garments", require("./routes/garments"));
app.use("/api/users", require("./routes/users"));
// Add this with your other routes (around line 40)
app.use("/api/images", imageRoutes);
app.use("/api/suggestions", suggestionsRouter);
app.use('/api/pose', require('./routes/pose'));

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("🔥 EXPRESS ERROR:", err.message);

  if (err.message.includes("Unsupported image format")) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 5MB)" });
  }

  res.status(500).json({ message: "Internal server error" });
});


// Ping backend every 9 minutes to prevent cold start
setInterval(
  async () => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`);
      console.log("Backend service pinged");
    } catch (e) {
      console.warn("Backend service ping failed");
    }
  },
  9 * 60 * 1000,
); // every 9 mins


// Ping Ai-validation every 10 minutes to prevent cold start
setInterval(
  async () => {
    try {
      await axios.get(`${process.env.AI_VALIDATION_URL}/health`);
      console.log("AI service pinged");
    } catch (e) {
      console.warn("AI validation ping failed");
    }
  },
  10 * 60 * 1000,
); // every 10 mins

// Ping suggestion-model every 10 minutes to prevent cold start
if (process.env.SUGGESTION_MODEL_URL) {
  setInterval(async () => {
    try {
      await axios.get(`${process.env.SUGGESTION_MODEL_URL}/health`);
      console.log("Suggestion model pinged");
    } catch (e) {
      console.warn("Suggestion model ping failed");
    }
  }, 10 * 60 * 1000); // every 10 minutes
}

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


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

start();
