const express = require('express');
const router = express.Router();
const insightService = require('../services/insightService');

router.get('/', async (req, res) => {
    try {
        const insights = await insightService.getInsights();
        res.json(insights);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

module.exports = router;
