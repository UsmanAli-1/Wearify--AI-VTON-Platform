const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Garment = require("../models/Garment");

// router.post("/upload", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     const garment = await Garment.create({
//       name: req.body.name || "Garment",
//       imagePath: req.file.path,
//     });

//     res.json({
//       message: "Garment uploaded",
//       garment,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const garment = await Garment.create({
      name: req.body.name || "Garment",
      imagePath: req.file.secure_url, // ✅ FIX
    });

    res.json({
      message: "Garment uploaded",
      garment,
    });
  } catch (err) {
    console.error("GARMENT UPLOAD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const garments = await Garment.find().sort({ createdAt: 1 });
  res.json(garments);
});

module.exports = router;
