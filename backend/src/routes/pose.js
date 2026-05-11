const express = require('express');
const router  = require('express').Router();
const multer  = require('multer');
const sharp   = require('sharp');

const upload  = multer({ storage: multer.memoryStorage() });

console.log('✅ pose.js loaded');

router.get('/test', (req, res) => {
  res.json({ message: '✅ Pose route working' });
});

router.post('/check', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });

    console.log(`📷 Received image: ${req.file.size} bytes`);

    const { data } = await sharp(req.file.buffer)
      .resize(192, 192)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Sample 5 columns across the full height to build a brightness profile
    const sampleCols = [20, 50, 96, 142, 172];
    const rowBrightness = [];

    for (let y = 0; y < 192; y++) {
      let total = 0;
      for (const x of sampleCols) {
        const i = (y * 192 + x) * 3;
        total += (data[i] + data[i+1] + data[i+2]) / 3;
      }
      rowBrightness.push(total / sampleCols.length);
    }

    // Top 15% brightness avg (should be bright = wall/ceiling behind head)
    const topAvg = rowBrightness.slice(0, 29).reduce((a, b) => a + b, 0) / 29;

    // Bottom 15% brightness avg (should be bright = floor behind feet)
    const bottomAvg = rowBrightness.slice(163).reduce((a, b) => a + b, 0) / 29;

    // Middle 70% brightness avg (person body = darker)
    const midAvg = rowBrightness.slice(29, 163).reduce((a, b) => a + b, 0) / 134;

    // For full body: top and bottom should be BRIGHTER than middle (background visible)
    // For face/half body: bottom is dark (clothing fills bottom)
    const topBrighter    = topAvg > midAvg + 10;
    const bottomBrighter = bottomAvg > midAvg + 10;

    console.log(`📊 TopAvg: ${topAvg.toFixed(1)} | MidAvg: ${midAvg.toFixed(1)} | BotAvg: ${bottomAvg.toFixed(1)}`);
    console.log(`📐 TopBrighter: ${topBrighter} | BotBrighter: ${bottomBrighter}`);

    const tooFar     = midAvg < 30;
    const tooClose   = midAvg > 180;
    const isFullBody = !tooFar && !tooClose && topBrighter && bottomBrighter;

    console.log(`✅ tooClose: ${tooClose} | tooFar: ${tooFar} | Full: ${isFullBody}`);

    res.json({ isFullBody, tooClose, tooFar, topAvg, midAvg, bottomAvg, topBrighter, bottomBrighter });

  } catch (err) {
    console.error('❌ Pose check error:', err.message);
    res.status(500).json({ message: 'Pose detection failed', error: err.message });
  }
});

module.exports = router;