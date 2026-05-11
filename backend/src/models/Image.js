const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  garment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garment",
    required: false,
  },
  garmentImagePath: {
    type: String,
    default: "",
  },
  resultImagePath: {
    type: String,
    default: "",
  },
  pointsUsed: {
    type: Number,
    default: 40,
  },
  status: {
    type: String,
    default: "uploaded",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", imageSchema);