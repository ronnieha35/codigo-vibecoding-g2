import * as service from './task.service.js';

async function getAllTasks(req, res, next) {
  try {
    const tasks = await service.getAllTasks();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await service.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await service.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await service.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await service.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
}

export { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
