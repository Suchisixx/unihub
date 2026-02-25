import express from "express";
import {
    getAllYearSemester,
    getYearsbyUser,
    addYear,
    updateYear,
    deleteYear,
    updateSemester,
    addSemester,
    deleteSemester,
    setCurrentSemester,
} from "../controllers/yearSemesterController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy danh sách năm học và học kỳ của user
router.get("/", authenticateToken, getAllYearSemester);

// CRUD năm học của user
router.get("/years", authenticateToken, getYearsbyUser); // Lấy riêng năm
router.post("/year", authenticateToken, addYear);
router.put("/year/:year_id", authenticateToken, updateYear);
router.delete("/year/:year_id", authenticateToken, deleteYear);

// CRUD học kỳ của năm học của user
router.post("/semester", authenticateToken, addSemester);
router.put("/semester/:sem_id", authenticateToken, updateSemester);
router.delete("/semester/:sem_id", authenticateToken, deleteSemester);
router.post("/semester/set-current", authenticateToken, setCurrentSemester);

export default router;
