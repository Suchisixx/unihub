import express from "express";
import { getCampuses, createCampus, deleteCampus } from "../controllers/campusController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", authenticateToken, getCampuses);
router.post("/", authenticateToken, createCampus);
router.delete("/:id", authenticateToken, deleteCampus);

export default router;