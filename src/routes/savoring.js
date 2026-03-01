const express = require('express');
const router = express.Router();
const savoringService = require('../services/savoringService');

router.get('/savoring', async (req, res) => {
    try {
        const data = await savoringService.getSavoringData();
        res.json(data);
    } catch (err) {
        console.error("Error fetching savoring data:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;