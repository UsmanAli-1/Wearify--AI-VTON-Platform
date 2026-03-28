const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Garment = require("../models/Garment");

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const garment = await Garment.create({
      name: req.body.name || "Garment",
      imagePath: req.file.path,
    });

    res.json({
      message: "Garment uploaded",
      garment,
    });
  } catch (err) {
    console.error("🔥 FULL ERROR:", err); // IMPORTANT
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    console.log("📥 GET /api/garments HIT");

    const garments = await Garment.find().sort({ createdAt: 1 });

    console.log("🧾 Garments fetched:", garments.length);
    console.log("🧾 Sample garment:", garments[0]);

    res.status(200).json(garments);
  } catch (err) {
    console.error("❌ GET /api/garments ERROR:", err);
    res.status(500).json({ message: "Failed to fetch garments" });
  }
});

module.exports = router;
