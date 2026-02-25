import * as scheduleService from "../service/scheduleService.js";
import fs from "fs";

/**
 * [GET] /api/schedules/:sem_id
 * Lấy danh sách lịch học theo học kỳ
 */
export const getSchedules = async (req, res) => {
    try {
        const { sem_id } = req.params;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }
        if (!sem_id) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin học kỳ" });
        }

        const result = await scheduleService.getSchedules(sem_id, user_id);

        // Convert start_time, end_time về "HH:mm" cho frontend dễ dùng
        const schedules = (result.schedules || []).map(s => ({
            ...s,
            start_time: s.start_time ? s.start_time.slice(0, 5) : "",
            end_time: s.end_time ? s.end_time.slice(0, 5) : "",
        }));

        res.status(200).json({
            success: true,
            message: "Lấy danh sách thời khóa biểu thành công",
            schedules,
        });
    } catch (error) {
        console.error("Lỗi getSchedules:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy danh sách TKB",
        });
    }
};

/**
 * [POST] /api/schedules
 * Thêm lịch học mới
 */
export const addSchedule = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }

        const data = { ...req.body, user_id };
        const result = await scheduleService.addSchedule(data);

        res.status(201).json({
            success: true,
            message: "Thêm lịch học thành công",
            data: result,
        });
    } catch (error) {
        console.error("Lỗi addSchedule:", error);

        // Nếu lỗi từ MySQL SIGNAL -> trả về 400 với nội dung cụ thể
        const msg = error.sqlMessage || error.message || "Lỗi thêm lịch học";
        res.status(400).json({ success: false, message: msg });
    }
};

/**
 * [PUT] /api/schedules/:schedule_id
 * Cập nhật lịch học
 */
export const updateSchedule = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }

        const data = { ...req.body, schedule_id, user_id };
        const result = await scheduleService.updateSchedule(data);

        res.json({
            success: true,
            message: "Cập nhật lịch học thành công",
            data: result,
        });
    } catch (error) {
        console.error("Lỗi updateSchedule:", error);

        // Hiển thị lỗi SQL cụ thể ra frontend
        const msg = error.sqlMessage || error.message || "Lỗi cập nhật lịch học";
        res.status(400).json({ success: false, message: msg });
    }
};

/**
 * [DELETE] /api/schedules/:schedule_id
 * Xóa lịch học
 */
export const deleteSchedule = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const result = await scheduleService.deleteSchedule(schedule_id);
        res.json({
            success: true,
            message: "Xóa lịch học thành công",
        });
    } catch (error) {
        console.error("Lỗi deleteSchedule:", error);
        const msg = error.sqlMessage || error.message || "Lỗi xóa lịch học";
        res.status(400).json({ success: false, message: msg });
    }
};

/**
 * [POST] /api/schedules/import
 * Import lịch học từ file CSV
 * Body: form-data gồm { file, sem_id, confirm? }
 */

export const importSchedules = async (req, res) => {
    try {
        // ĐẢM BẢO user_id LÀ SỐ NGUYÊN HỢP LỆ
        const raw_user_id = req.user?.id;
        const user_id = parseInt(raw_user_id, 10); // Ép kiểu về số nguyên

        if (isNaN(user_id) || user_id <= 0) return res.status(401).json({ success: false, message: "Chưa đăng nhập hoặc User ID không hợp lệ" });

        const sem_id = req.body.sem_id || req.query.sem_id;
        if (!sem_id) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Thiếu sem_id" });
        }

        if (!req.file) return res.status(400).json({ success: false, message: "Thiếu file (field = file)" });

        const confirm = req.body.confirm === "true";
        const filePath = req.file.path;

        // CHỈNH SỬA: Truyền user_id đã ép kiểu (số nguyên)
        const result = await scheduleService.importFromCsv(
            filePath,
            user_id, // Truyền user_id đã ép kiểu
            parseInt(sem_id, 10),
            { confirm }
        );

        fs.unlink(filePath, () => { }); // xóa file tạm
        res.json({ success: true, ...result });
    } catch (err) {
        console.log(err);
    }
};
