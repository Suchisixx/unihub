import { getAllSubjects, getNotes, addNote, updateNote, deleteNote } from '../controllers/notesController.js';
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Lấy tất cả các môn học và ghi chú của user
router.get('/subjects/:sem_id', authenticateToken, getAllSubjects);
router.get('/:sem_id', authenticateToken, getNotes);
// Thêm ghi chú mới
router.post('/note', authenticateToken, addNote);
// Cập nhật ghi chú
router.put('/note/:note_id', authenticateToken, updateNote);
// Xóa ghi chú
router.delete('/note/:note_id', authenticateToken, deleteNote);
export default router;
