const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");

// AIGarment model
const aiGarmentSchema = new mongoose.Schema({
  filename: String,
  gender: String,
  color: String,
  imagePath: String,
}, { collection: "aigarments" });

const AIGarment = mongoose.models.AIGarment || 
  mongoose.model("AIGarment", aiGarmentSchema);

router.post("/suggest", auth, upload.single("image"), async (req, res) => {
  try {
    const { gender } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    if (!gender || !["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    // ── Step 1: Validate full body via ai-validation ──
    const validationForm = new FormData();
    validationForm.append("file", req.file.buffer, {
      filename: "image.jpg",
      contentType: req.file.mimetype,
    });

    let validationResult;
    try {
      const validationRes = await axios.post(
        `${process.env.AI_VALIDATION_URL}/check-full-body`,
        validationForm,
        {
          headers: validationForm.getHeaders(),
          timeout: 30000,
        }
      );
      validationResult = validationRes.data;
    } catch (err) {
      // If validation service is down, skip validation
      console.warn("Validation service unavailable — skipping");
      validationResult = { isFullBody: true };
    }

    if (!validationResult.isFullBody) {
      return res.status(400).json({
        message: "Please upload a clear full-body photo",
        reason: validationResult.reason,
      });
    }

    // ── Step 2: Get skin tone from suggestion-model FastAPI ──
    const skinForm = new FormData();
    skinForm.append("file", req.file.buffer, {
      filename: "image.jpg",
      contentType: req.file.mimetype,
    });
    skinForm.append("gender", gender);

    let skinTone = "medium";
    let suggestedColors = ["blue", "dark-blue", "green", "dark-green"];

    try {
      const skinRes = await axios.post(
        `${process.env.SUGGESTION_MODEL_URL}/suggest-outfits`,
        skinForm,
        {
          headers: skinForm.getHeaders(),
          timeout: 15000,
        }
      );
      skinTone = skinRes.data.skin_tone;
      suggestedColors = skinRes.data.suggested_colors;
    } catch (err) {
      console.warn("Suggestion model unavailable — using default colors");
    }

    // ── Step 3: Query MongoDB aigarments ──
    const garments = await AIGarment.aggregate([
      {
        $match: {
          gender: gender,
          color: { $in: suggestedColors },
        },
      },
      { $sample: { size: 4 } },
    ]);

    // ── Step 4: Return results ──
    return res.json({
      skin_tone: skinTone,
      suggested_colors: suggestedColors,
      suggestions: garments.map((g) => ({
        _id: g._id,
        name: g.filename,
        imagePath: g.imagePath,
        color: g.color,
      })),
    });

  } catch (err) {
    console.error("Suggestion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;