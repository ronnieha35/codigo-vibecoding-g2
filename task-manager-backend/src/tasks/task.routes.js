import { Router } from 'express';
import * as controller from './task.controller.js';

const router = Router();

router.get('/',       controller.getAllTasks);
router.post('/',      controller.createTask);
router.get('/:id',    controller.getTaskById);
router.put('/:id',    controller.updateTask);
router.delete('/:id', controller.deleteTask);

export default router;
