const express = require('express');
const router = express.Router();
const focusService = require('../services/focusService');

router.post('/focus/log', async (req, res) => {
    const { timestamp, type, duration } = req.body;
    try {
        await focusService.logSession(timestamp, type, duration);
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log focus session' });
    }
});

router.get('/focus/history', async (req, res) => {
    const { start, end } = req.query;
    try {
        const data = await focusService.getHistory(start, end);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read focus history' });
    }
});

module.exports = router;
