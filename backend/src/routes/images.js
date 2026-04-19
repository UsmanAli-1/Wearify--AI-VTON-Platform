const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");

// Helper: extract Cloudinary public_id from a secure_url
// e.g. "https://res.cloudinary.com/xxx/image/upload/v123/wearify/abc123.jpg"
// → "wearify/abc123"
const getPublicId = (url) => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    // skip "upload" and the version segment (v12345)
    const withVersion = parts.slice(uploadIndex + 1);
    const withoutVersion = withVersion[0].startsWith("v")
      ? withVersion.slice(1)
      : withVersion;
    const filePath = withoutVersion.join("/");
    // remove file extension
    return filePath.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

// GET /api/images/my — fetch logged-in user's try-on history
router.get("/my", auth, async (req, res) => {
  try {
    const images = await Image.find({ user: req.user.id })
      .populate("garment", "name imagePath")
      .sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/images/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from Cloudinary
    const publicId = getPublicId(image.imagePath);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete from MongoDB
    await image.deleteOne();

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("🔥 DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;