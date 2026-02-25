// express/routes/aiRoutes.js (CẦN TẠO FILE MỚI)
import express from 'express';
import { generateQuiz } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/quiz/generate', authenticateToken, generateQuiz);
// cần thêm route này vào app.js: app.use('/api/ai', aiRoutes);

export default router;