const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const auth = require("../middleware/auth"); // reuse your existing auth middleware

const plans = {
  basic:   { name: "Basic Plan",   amount: 120000, points: 400  },
  pro:     { name: "Pro Plan",     amount: 300000, points: 1000 },
  premium: { name: "Premium Plan", amount: 600000, points: 2000 },
};

// Create checkout session — protected by your existing auth middleware
router.post("/create-checkout", auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id; // ← comes from your auth middleware automatically

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
      success_url: `${process.env.CLIENT_URL}/success?plan=${plan}`,
      cancel_url:  `${process.env.CLIENT_URL}/plans`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// Webhook — updates MongoDB after payment
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    const pointsToAdd = plans[plan].points;

    await User.findByIdAndUpdate(userId, {
      $set: { plan },
      $inc: { points: pointsToAdd },
    });

    console.log(`✅ Updated user ${userId} to ${plan} + ${pointsToAdd} points`);
  }

  res.json({ received: true });
});

module.exports = router;