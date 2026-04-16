const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const Image = require("../models/Image");

// ← Points check middleware (runs BEFORE Cloudinary upload)
const checkPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.points < 40)
      return res.status(400).json({ message: "Not enough points" });
    req.userDoc = user; // ← attach user to request so route doesn't fetch again
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
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
      expiresIn: "7d",
    });

    // ✅ Return token in body instead of cookie
    res.status(200).json({
      message: "Login Successful",
      token, // <-- send token here
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

    // ← Auto-reset plan when points run out
    if (user.points <= 120 && user.plan !== "free") {
      user.plan = "free";
      await user.save();
    }

    res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "server error" });
  }
});

// router.post(
//   "/generate",
//   auth, // 1. check if logged in
//   checkPoints, // 2. check points ← BEFORE Cloudinary
//   upload.single("image"), // 3. upload to Cloudinary ← only if points ok
//   async (req, res) => {
//     try {
//       console.log("📥 GENERATE HIT");
//       console.log("📦 Body:", req.body);
//       console.log("📸 File:", req.file);

//       const COST = 40;
//       const { garmentId } = req.body;

//       if (!req.file) {
//         return res.status(400).json({ message: "No image uploaded" });
//       }

//       if (!garmentId) {
//         return res.status(400).json({ message: "No garment selected" });
//       }

//       // ← reuse user from checkPoints middleware (no extra DB call)
//       const user = req.userDoc;

//       const imageDoc = await Image.create({
//         user: user._id,
//         imagePath: req.file.path, // CLOUDINARY URL
//         garment: garmentId,
//         pointsUsed: COST,
//       });

//       user.points -= COST;
//       await user.save();

//       console.log("✅ IMAGE SAVED:", imageDoc);

//       res.json({
//         message: "Image & garment uploaded",
//         points: user.points,
//         pointsExhausted: user.points < 40,
//       });
//     } catch (err) {
//       console.error("🔥 GENERATE ERROR:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   },
// );

router.post(
  "/generate",
  auth,
  upload.single("image"), // ✅ memory upload
  async (req, res) => {
    try {
      const axios = require("axios");
      const FormData = require("form-data");
      const sharp = require("sharp");
      const cloudinary = require("../config/cloudinary");

      const COST = 40;
      const { garmentId } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      if (!garmentId) {
        return res.status(400).json({ message: "No garment selected" });
      }

      // ✅ STEP 1: CHECK POINTS FIRST
      const user = await User.findById(req.user.id);
      if (user.points < COST) {
        return res.status(400).json({ message: "Not enough points" });
      }

      // ✅ STEP 2: CONVERT IMAGE (HEIC/AVIF → JPG)
      let imageBuffer = req.file.buffer;

      if (
        req.file.mimetype === "image/heic" ||
        req.file.mimetype === "image/heif" ||
        req.file.mimetype === "image/avif" ||
        req.file.mimetype === "image/webp"
      ) {
        imageBuffer = await sharp(req.file.buffer).jpeg().toBuffer();
      }

      // ✅ OPTIONAL: RESIZE (performance boost)
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: 1024 })
        .jpeg({ quality: 80 })
        .toBuffer();

      // ✅ STEP 3: SEND TO AI
      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: "image.jpg",
      });

      const aiResponse = await axios.post(
        "http://127.0.0.1:10000/check-full-body",
        formData,
        { headers: formData.getHeaders(), timeout: 20000 },
      );

      const aiData = aiResponse.data;

      if (!aiData.isFullBody) {
        return res.status(400).json({
          message: "Invalid image",
          reason: aiData.reason,
        });
      }

      // ✅ STEP 4: UPLOAD TO CLOUDINARY
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "wearify" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(imageBuffer);
      });

      // ✅ STEP 5: SAVE TO DB
      const imageDoc = await Image.create({
        user: user._id,
        imagePath: uploadResult.secure_url,
        garment: garmentId,
        pointsUsed: COST,
      });

      user.points -= COST;
      await user.save();

      return res.json({
        message: "Success",
        points: user.points,
        pointsExhausted: user.points < COST,
      });
    } catch (err) {
      console.error("🔥 GENERATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

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
