import { Router } from 'express';
import { articleController } from './controller/articleController.js';
import { authController } from './controller/authController.js';
import { userController } from './controller/userController.js';
import { authMiddleware } from './middleware/auth.js';

export const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/change-password', authMiddleware, authController.changePassword);

router.get('/articles', articleController.getAll);
router.post('/articles', authMiddleware, articleController.create);
router.put('/articles/:id', authMiddleware, articleController.update);
router.delete('/articles/:id', authMiddleware, articleController.remove);

router.get('/users', authMiddleware, userController.getAll);
router.post('/users', authMiddleware, userController.create);
router.put('/users/:id', authMiddleware, userController.update);
router.delete('/users/:id', authMiddleware, userController.remove);
