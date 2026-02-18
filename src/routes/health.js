const express = require('express');
const router = express.Router();
const healthService = require('../services/healthService');
const habitService = require('../services/habitService');

router.get('/daily-stats', async (req, res) => {
    try {
        const date = req.query.date;
        const stats = await healthService.getDailyStats(date);
        const habits = await habitService.getTodayHabits(); // habits currently stay same day focus
        const habitStreaks = await habitService.getHabitStreaks();
        stats.habits = habits;
        stats.habitStreaks = habitStreaks;
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch daily stats' });
    }
});

router.get('/meals/:date', async (req, res) => {
    try {
        const meals = await healthService.getMealsForDate(req.params.date);
        res.json(meals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch meals' });
    }
});

router.get('/health', async (req, res) => {
    try {
        const data = await healthService.getHealthData();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch health data' });
    }
});

router.get('/streaks', async (req, res) => {
    try {
        const streaks = await healthService.getStreaks();
        res.json(streaks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch streaks' });
    }
});

router.get('/heatmap', async (req, res) => {
    try {
        const data = await healthService.getHeatmapData();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});

router.post('/daily-stats', async (req, res) => {
    try {
        const stats = req.body;
        await healthService.updateDailyStats(stats);
        const updatedStats = await healthService.getDailyStats();
        const habits = await habitService.getTodayHabits();
        updatedStats.habits = habits;
        
        req.io.emit('healthUpdated', updatedStats);
        res.json(updatedStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update daily stats' });
    }
});

module.exports = router;
