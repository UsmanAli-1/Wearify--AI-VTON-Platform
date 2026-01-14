// process.on("uncaughtException", (err) => {
//   console.error("UNCAUGHT:", err);
// });

// process.on("unhandledRejection", (err) => {
//   console.error("UNHANDLED:", err);
// });


// if (process.env.RAILWAY_ENVIRONMENT !== "production") {
//   require("dotenv").config();
// }



// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const path = require("path");

// const app = express();

// /* CORS */

// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://wearify-mu.vercel.app",
//   ],
//   credentials: true,
// }));

// app.use(express.json());
// app.use(cookieParser());
// const garmentRoutes = require("./routes/garments");
// const userRoutes = require("./routes/users");

// app.use("/api/garments", garmentRoutes);
// app.use("/api/users", userRoutes);



// /* EXPRESS 5 SAFE PREFLIGHT HANDLER */
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(204);
//   }
//   next();
// });


// // app.use(
// //   "/uploads",
// //   express.static(path.join(__dirname, "..", "uploads"))
// // );



// async function start() {
//   try {
//     if (!process.env.MONGODB_URI) {
//       throw new Error("MONGODB_URI is not defined");
//     }

//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("connected to mongoDB");

//     const port = process.env.PORT || 4000;
//     app.listen(port, "0.0.0.0", () =>
//       console.log(`Server running on port ${port}`)
//     );
//   } catch (err) {
//     console.error("startup error", err);
//     process.exit(1);
//   }
// }





// start();































process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

if (process.env.RAILWAY_ENVIRONMENT !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

/* CORS — SIMPLE & CORRECT */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://wearify-mu.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ROUTES */
const userRoutes = require("./routes/users");
const garmentRoutes = require("./routes/garments");

app.use("/api/users", userRoutes);
app.use("/api/garments", garmentRoutes);

/* START SERVER AFTER DB CONNECT */
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const port = process.env.PORT || 4000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

start();


