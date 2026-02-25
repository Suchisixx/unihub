import { authenticateToken } from "../middleware/authMiddleware.js";
import express from "express";
import { getFinanceData, addTransaction, updateTransaction, deleteTransaction } from "../controllers/expenseController.js";

const router = express.Router();

router.get('/data', authenticateToken, getFinanceData);
router.post('/', authenticateToken, addTransaction);
router.put('/:trans_id', authenticateToken, updateTransaction);
router.delete('/:trans_id', authenticateToken, deleteTransaction);

export default router;