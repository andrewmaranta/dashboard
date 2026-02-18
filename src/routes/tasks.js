const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

router.get('/tasks', async (req, res) => {
    try {
        const tasks = await taskService.getTasks();
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

router.post('/tasks', async (req, res) => {
    try {
        const { text, attribute, attr } = req.body;
        console.error('Route received:', req.body);
        await taskService.addTask(text, attribute || attr);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add task' });
    }
});

router.post('/tasks/toggle', async (req, res) => {
    try {
        const { id } = req.body;
        const result = await taskService.toggleTask(id);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        
        if (result && result.xp) {
            req.io.emit('xpGained', { attribute: result.xp.code, amount: result.xp.xpGained });
        }
        
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle task' });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await taskService.deleteTask(id);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
