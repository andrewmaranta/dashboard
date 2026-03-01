const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

// Templates (Must be before /tasks/:id to avoid conflict)
router.get('/tasks/templates', async (req, res) => {
    try {
        const templates = await taskService.getTemplates();
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

router.post('/tasks/templates', async (req, res) => {
    try {
        const { text, attribute, difficulty, if_then, belief_id, steps } = req.body;
        console.error('Adding template:', req.body);
        await taskService.addTemplate(text, attribute, difficulty, if_then, belief_id, steps);
        const templates = await taskService.getTemplates();
        req.io.emit('templatesUpdated', templates);
        res.json(templates);
    } catch (err) {
        console.error('Failed to add template:', err);
        res.status(500).json({ error: 'Failed to add template' });
    }
});

router.delete('/tasks/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await taskService.deleteTaskTemplate(id);
        const templates = await taskService.getTemplates();
        req.io.emit('templatesUpdated', templates);
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

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
        const { text, attribute, attr, difficulty, if_then, belief_id, steps } = req.body;
        console.error('Route received:', req.body);
        await taskService.addTask(text, attribute || attr, difficulty, if_then, belief_id, steps);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add task' });
    }
});

router.post('/tasks/archive-completed', async (req, res) => {
    try {
        await taskService.archiveCompleted();
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to archive tasks' });
    }
});

router.post('/tasks/toggle', async (req, res) => {
    try {
        const { id } = req.body;
        const result = await taskService.toggleTask(id, req.io);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        
        if (result && result.xp) {
            req.io.emit('xpGainedV2', { attribute: result.xp.code, amount: result.xp.xpGained });
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

router.post('/tasks/update', async (req, res) => {
    try {
        const { id, text, attribute, difficulty, if_then, belief_id, steps } = req.body;
        await taskService.updateTask(id, text, attribute, difficulty, if_then, belief_id, steps);
        const tasks = await taskService.getTasks();
        req.io.emit('tasksUpdated', tasks);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

module.exports = router;
