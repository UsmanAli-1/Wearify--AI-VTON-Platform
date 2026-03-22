const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    points: { type: String, required: true },
    plan:   { type: String, default: "free" },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);