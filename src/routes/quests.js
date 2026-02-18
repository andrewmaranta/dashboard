const express = require('express');
const router = express.Router();
const questService = require('../services/questService');

router.get('/quests', async (req, res) => {
    try {
        const data = await questService.getQuests();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read quests' });
    }
});

router.post('/daily-quests/toggle', async (req, res) => {
    try {
        const { id } = req.body;
        await questService.toggleDailyQuest(id);
        const updated = await questService.getQuests();
        req.io.emit('questsUpdated', updated);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle daily quest' });
    }
});

router.post('/milestones/toggle', async (req, res) => {
    try {
        const { id } = req.body;
        await questService.toggleMilestone(id);
        const updated = await questService.getGoals();
        req.io.emit('goalsUpdated', updated);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle milestone' });
    }
});

router.get('/goals', async (req, res) => {
    try {
        const data = await questService.getGoals();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read goals' });
    }
});

router.post('/quest-complete', async (req, res) => {
    try {
        const result = await questService.completeDashboardCheckIn();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Quest event webhook (for internal use)
router.post('/quest-event', (req, res) => {
    const { type, data } = req.body;
    console.log('Quest event:', type, data);
    res.json({ status: 'success' });
});

module.exports = router;
