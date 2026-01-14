const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")
const upload = require("../middleware/upload");
const Image = require("../models/Image");


router.post("/", async (req, res) => {
  // get data from frontend
  const { name, email, phone, password, points } = req.body;

  // password hash 
  const hashPassword = await bcrypt.hash(password, 10)

  try {
    console.log("Request body:", req.body);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashPassword,
      points,
    });
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(400).json({ error: err.message });
  }
});



router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // create jwt 
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    //   path: "/",
    //   maxAge: 1000 * 60 * 60 * 24 * 7,
    // });



    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });



    // send user data
    res.status(200).json({
      message: "Login Successful",
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
    res.json(user);

  } catch (error) {
    return res.status(500).json({ message: "server error" });
  }
});


router.post("/generate", auth, upload.single("image"), async (req, res) => {
  try {
    const COST = 40;
    const { garmentId } = req.body;

    // validations
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    if (!garmentId) {
      return res.status(400).json({ message: "No garment selected" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.points < COST) {
      return res.status(400).json({ message: "Not enough points" });
    }

    // save both image + garment
    // await Image.create({
    //   user: user._id,
    //   imagePath: req.file.path, //  Cloudinary URL
    //   garment: garmentId,
    //   pointsUsed: COST,
    // });


    await Image.create({
      user: user._id,
      imagePath: req.file.secure_url, // FIX
      garment: garmentId,
      pointsUsed: COST,
    });

    // deduct points
    user.points -= COST;
    await user.save();

    res.json({
      message: "Image & garment uploaded",
      points: user.points,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/logout", (req, res) => {
  // res.clearCookie("token", {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  //   path: "/", // make sure the path matches the cookie set during login
  // });

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.json({ message: "Logged out successfully" });
});

module.exports = router;