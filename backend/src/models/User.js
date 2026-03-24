const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    points: { type: String, default: 120 },
    plan: { type: String, default: "free" },
    hasAgreed: { type: Boolean, default: false }
  },
  { timestamps: true },
);

module.exports = model("User", userSchema);
