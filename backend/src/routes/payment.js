const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const auth = require("../middleware/auth");

const plans = {
  basic:   { name: "Basic Plan",   amount: 120000, points: 400  },
  pro:     { name: "Pro Plan",     amount: 300000, points: 1000 },
  premium: { name: "Premium Plan", amount: 600000, points: 2000 },
};

// Create checkout session
router.post("/create-checkout", auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    const selected = plans[plan];
    if (!selected) return res.status(400).json({ message: "Invalid plan" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "pkr",
          product_data: { name: selected.name },
          unit_amount: selected.amount,
        },
        quantity: 1,
      }],
      metadata: { userId: userId.toString(), plan },
      success_url: `${process.env.CLIENT_URL}/plans?plan=${plan}`,
      cancel_url:  `${process.env.CLIENT_URL}/plans`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// Webhook handler — exported separately so it can use raw body
const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    const pointsToAdd = plans[plan]?.points;

    console.log(`📦 Updating user ${userId} → plan: ${plan}, points: +${pointsToAdd}`);

    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error("❌ User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      // Parse existing points as number in case it's stored as string
      const currentPoints = parseInt(user.points) || 0;

      await User.findByIdAndUpdate(userId, {
        $set: { 
          plan,
          points: currentPoints + pointsToAdd  // ← manual add instead of $inc
        },
      });

      console.log(`✅ User ${userId} updated → ${plan} + ${pointsToAdd} points`);
    } catch (err) {
      console.error("❌ DB update error:", err);
    }
  }

  res.json({ received: true });
};

module.exports = { router, webhook };