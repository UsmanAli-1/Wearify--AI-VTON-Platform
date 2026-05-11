const express = require("express");
const User = require("../models/User");
const Garment = require("../models/Garment"); // moved to top
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const Image = require("../models/Image");
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");

// Helper to upload a buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
};

router.post("/", async (req, res) => {
  const { name, email, phone, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already has an account" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password: hashPassword,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (user.points <= 120 && user.plan !== "free") {
      user.plan = "free";
      await user.save();
    }

    res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "server error" });
  }
});

router.post("/generate", auth, upload.single("image"), async (req, res) => {
  console.log("🔗 TRYON_URL from env:", process.env.TRYON_MODEL_URL);
  console.log("AI URL:", process.env.AI_VALIDATION_URL);

  try {
    const COST = 40;
    const TRYON_URL = process.env.TRYON_MODEL_URL;

    const { garmentId } = req.body;
    const isAiGarment = req.body.garmentImagePath ? true : false;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    if (!garmentId && !isAiGarment) {
      return res.status(400).json({ message: "No garment selected" });
    }

    // STEP 1: CHECK POINTS
    const user = await User.findById(req.user.id);
    if (user.points < COST) {
      return res.status(400).json({ message: "Not enough points" });
    }

    // STEP 2: CONVERT HEIC/HEIF/AVIF/WEBP → JPEG only (no resize, no bg removal)
    let imageBuffer = req.file.buffer;

    if (
      req.file.mimetype === "image/heic" ||
      req.file.mimetype === "image/heif" ||
      req.file.mimetype === "image/avif" ||
      req.file.mimetype === "image/webp"
    ) {
      imageBuffer = await sharp(req.file.buffer).jpeg().toBuffer();
    }

    // STEP 3: AI VALIDATION — directly call check-full-body, no separate wake-up ping
    console.log("🔍 Validating image...");
    let aiData;
    try {
      const formData = new FormData();
      formData.append("file", imageBuffer, { filename: "image.jpg" });

      const aiResponse = await axios.post(
        `${process.env.AI_VALIDATION_URL}/check-full-body`,
        formData,
        { headers: formData.getHeaders(), timeout: 90000 }
      );
      aiData = aiResponse.data;
    } catch (aiErr) {
      console.error("❌ AI Validation error:", aiErr?.message);
      return res.status(503).json({ message: "AI service unavailable, please try again" });
    }

    if (typeof aiData !== "object") {
      return res.status(503).json({ message: "AI service is waking up, please try again" });
    }

    if (!aiData.isFullBody) {
      return res.status(400).json({
        message: "Invalid image",
        reason: aiData.reason,
      });
    }

    // STEP 4: FETCH GARMENT URL (resolved early, ready for parallel use)
    let garmentImageUrl = req.body.garmentImagePath || "";
    if (!garmentImageUrl && garmentId) {
      const garment = await Garment.findById(garmentId);
      garmentImageUrl = garment?.imagePath || "";
    }
    console.log("👕 Garment URL:", garmentImageUrl);

    if (!garmentImageUrl) {
      return res.status(400).json({ message: "Garment image not found" });
    }

    // STEP 5: DOWNLOAD GARMENT IMAGE
    const garmentResponse = await axios.get(garmentImageUrl, { responseType: "arraybuffer" });
    const garmentBuffer = Buffer.from(garmentResponse.data);
    console.log("✅ Garment downloaded, size:", garmentBuffer.length);

    // STEP 6: PARALLEL — send to try-on model AND upload person image to Cloudinary
    console.log("🚀 Starting parallel: try-on model + Cloudinary upload...");

    const tryonForm = new FormData();
    tryonForm.append("person", imageBuffer, { filename: "person.jpg", contentType: "image/jpeg" });
    tryonForm.append("cloth", garmentBuffer, { filename: "cloth.jpg", contentType: "image/jpeg" });

    const [tryonResponse, personUpload] = await Promise.all([
      // Try-on model
      axios.post(TRYON_URL, tryonForm, {
        headers: {
          ...tryonForm.getHeaders(),
          "ngrok-skip-browser-warning": "true",
        },
        responseType: "arraybuffer",
        timeout: 120000,
      }).then((res) => {
        console.log("✅ Try-on response status:", res.status);
        console.log("✅ Try-on response size:", res.data.byteLength);
        return res;
      }).catch((tryonErr) => {
        console.error("❌ Try-on model error status:", tryonErr?.response?.status);
        console.error("❌ Try-on model error:", tryonErr?.response?.data?.toString());
        console.error("❌ Try-on full error:", tryonErr?.message);
        throw tryonErr;
      }),

      // Cloudinary upload of person image
      uploadToCloudinary(imageBuffer, "wearify").then((result) => {
        console.log("✅ Person image uploaded to Cloudinary:", result.secure_url);
        return result;
      }),
    ]);

    // STEP 7: UPLOAD RESULT IMAGE TO CLOUDINARY
    console.log("☁️ Uploading result to Cloudinary...");
    const tryonBuffer = Buffer.from(tryonResponse.data);
    const tryonUpload = await uploadToCloudinary(tryonBuffer, "wearify/results");
    const resultImageUrl = tryonUpload.secure_url;
    console.log("✅ Result image uploaded:", resultImageUrl);

    // STEP 8: DEDUCT POINTS + SAVE TO DB (single write, only after successful result)
    user.points -= COST;
    await user.save();

    await Image.create({
      user: user._id,
      imagePath: personUpload.secure_url,         // person image cloudinary link
      garment: isAiGarment ? null : garmentId,    // garment id (if selected from catalogue)
      garmentImagePath: req.body.garmentImagePath || "", // garment url (if ai garment)
      resultImagePath: resultImageUrl,            // result image cloudinary link
      pointsUsed: COST,
    });

    return res.json({
      message: "Success",
      points: user.points,
      pointsExhausted: user.points < COST,
      resultImage: resultImageUrl,
    });
  } catch (err) {
    console.error("🔥 GENERATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/agree", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { hasAgreed: true });
    res.json({ message: "Agreement accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});

module.exports = router;