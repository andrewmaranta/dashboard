const express = require('express');
const router = express.Router();
const habitService = require('../services/habitService');

router.get('/habits/today', async (req, res) => {
    try {
        const date = req.query.date;
        const data = await habitService.getTodayHabits(date);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read habits' });
    }
});

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
        const { habit, date, note } = req.body;
        const result = await habitService.toggleHabit(habit, date, note, req.io);
        const updatedHabits = await habitService.getTodayHabits(date);
        const weekly = await habitService.getWeeklyHabits();
        const streaks = await habitService.getHabitStreaks();
        
        req.io.emit('habitUpdated', { today: updatedHabits, weekly, streaks, date });
        
        if (result.xp) {
            req.io.emit('xpGainedV2', { attribute: result.xp.code, amount: result.xp.xpGained });
        }
        
        res.json({ success: true, habits: updatedHabits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle habit' });
    }
});

module.exports = router;
