const express = require('express');
const router = express.Router();
const habitService = require('../services/habitService');

router.get('/habits/weekly', async (req, res) => {
    try {
        const data = await habitService.getWeeklyHabits();
        res.json({ habits: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read weekly habits' });
    }
});

router.get('/habits/streaks', async (req, res) => {
    try {
        const data = await habitService.getHabitStreaks();
        res.json({ habits: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read habit streaks' });
    }
});

router.post('/habits/toggle', async (req, res) => {
    try {
        const { habit } = req.body;
        await habitService.toggleHabit(habit);
        const updatedHabits = await habitService.getTodayHabits();
        const weekly = await habitService.getWeeklyHabits();
        const streaks = await habitService.getHabitStreaks();
        
        req.io.emit('habitUpdated', { today: updatedHabits, weekly, streaks });
        res.json({ success: true, habits: updatedHabits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle habit' });
    }
});

module.exports = router;
