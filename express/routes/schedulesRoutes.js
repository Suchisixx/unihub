import express from 'express';
import multer from 'multer';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, importSchedules } from '../controllers/schedulesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/import', authenticateToken, upload.single('file'), importSchedules);
router.get("/semester/:sem_id", authenticateToken, getSchedules);
router.post("/", authenticateToken, addSchedule);
router.put("/:schedule_id", authenticateToken, updateSchedule);
router.delete("/:schedule_id", authenticateToken, deleteSchedule);

export default router;
