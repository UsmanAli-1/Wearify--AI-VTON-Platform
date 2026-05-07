const express = require('express');
const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage() });

console.log('✅ pose.js loaded');

router.get('/test', (req, res) => {
    res.json({ message: '✅ Pose route working' });
});

router.post('/check', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided' });

        const metadata = await sharp(req.file.buffer).metadata();
        console.log(`📷 Received image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

        const { data } = await sharp(req.file.buffer)
            .resize(192, 192)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const analyze = (startY, endY) => {
            let personPixels = 0;
            const total = (endY - startY) * 192;
            for (let y = startY; y < endY; y++) {
                for (let x = 0; x < 192; x++) {
                    const i = (y * 192 + x) * 3;
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const brightness = (r + g + b) / 3;
                    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
                    const isPureBackground = brightness > 200 && saturation < 15;
                    if (!isPureBackground) personPixels++;
                }
            }
            return personPixels / total;
        };

        const third = 64;
        const topScore = analyze(0, third);
        const middleScore = analyze(third, third * 2);
        const bottomScore = analyze(third * 2, 192);

        const avg = (topScore + middleScore + bottomScore) / 3;
        const maxScore = Math.max(topScore, middleScore, bottomScore);
        const minScore = Math.min(topScore, middleScore, bottomScore);
        const balance = minScore / maxScore;

        const tooClose = avg > 0.75;
        const tooFar = avg < 0.08;
        const isFullBody = !tooClose && !tooFar && balance > 0.20 && bottomScore > 0.06 && topScore > 0.04;

        console.log(`📊 Top: ${topScore.toFixed(3)} | Mid: ${middleScore.toFixed(3)} | Bot: ${bottomScore.toFixed(3)}`);
        console.log(`📐 Avg: ${avg.toFixed(3)} | Balance: ${balance.toFixed(3)} | tooClose: ${tooClose} | tooFar: ${tooFar} | Full: ${isFullBody}`);

        res.json({ isFullBody, score: avg, topScore, middleScore, bottomScore, tooClose, tooFar, balance });

    } catch (err) {
        console.error('❌ Pose check error:', err.message);
        res.status(500).json({ message: 'Pose detection failed', error: err.message });
    }
});

module.exports = router;