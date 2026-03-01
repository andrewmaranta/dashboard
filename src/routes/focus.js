const express = require('express');
const router = express.Router();
const focusService = require('../services/focusService');

router.post('/focus/log', async (req, res) => {
    const { timestamp, type, duration } = req.body;
    try {
        await focusService.logSession(timestamp, type, duration, req.io);
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

router.get('/focus/pomo', async (req, res) => {
    try {
        const state = await focusService.getPomoState();
        res.json(state);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pomodoro state' });
    }
});

router.post('/focus/pomo', async (req, res) => {
    try {
        await focusService.updatePomoState(req.body);
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update pomodoro state' });
    }
});

module.exports = router;
