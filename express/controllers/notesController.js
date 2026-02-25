import db from "../config/db.js";
// import fs from 'fs'; // Đã xóa
// import path from 'path'; // Đã xóa

export const getAllSubjects = async (req, res) => {
    try {
        // Lấy và chuyển đổi user_id sang số nguyên
        const userIdInt = parseInt(req.user?.id, 10);
        // Lấy và chuyển đổi sem_id sang số nguyên
        const semIdInt = parseInt(req.params.sem_id, 10);

        if (isNaN(userIdInt) || isNaN(semIdInt) || userIdInt <= 0 || semIdInt <= 0) {
            return res.status(400).json({ success: false, message: "Tham số user ID hoặc semester ID không hợp lệ." });
        }

        const [subjects] = await db.query(
            // join schedules (s) với subjects (sj) để lấy tên môn
            `SELECT 
                s.sub_id, 
                sj.name AS subject_name 
             FROM schedules s
             JOIN subjects sj ON s.sub_id = sj.sub_id -- Lấy tên môn học
             WHERE s.sem_id = ?
               AND sj.user_id = ? -- Lọc theo quyền sở hữu của môn học
             GROUP BY s.sub_id, sj.name -- Nhóm theo ID môn học để tránh trùng lặp
             ORDER BY sj.name`,
            [semIdInt, userIdInt]
        );

        res.json({ success: true, data: subjects });
    } catch (err) {
        console.error("Lỗi getAllSubjects:", err);
        // Trả về lỗi server 500 nếu có lỗi SQL
        res.status(500).json({ success: false, message: "Lỗi Server khi lấy danh sách môn học." });
    }
};

// --- GET (Sử dụng SP) ---
export const getNotes = async (req, res) => {
    try {
        const userIdInt = parseInt(req.user?.id, 10);
        const semIdInt = parseInt(req.params.sem_id, 10);
        if (isNaN(userIdInt) || isNaN(semIdInt) || userIdInt <= 0 || semIdInt <= 0) {
            return res.status(400).json({ success: false, message: "Tham số user ID hoặc semester ID không hợp lệ." });
        }

        const [rows] = await db.query("CALL get_notes(?, ?)", [userIdInt, semIdInt]);
        const notes = Array.isArray(rows[0]) ? rows[0] : [];

        // Không còn map file_path -> file_url

        res.json({ success: true, data: notes });
    } catch (err) {
        console.error("Lỗi getNotes :", err);
        res.status(500).json({ success: false, message: "Lỗi lấy ghi chú." });
    }
};


// --- POST (Thêm Ghi chú) ---
export const addNote = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { sem_id, sub_id, title, content } = req.body;
        // const file = req.file; // Đã xóa

        // Bỏ logic xử lý file
        // let original_file_name = null;
        // let file_path_for_db = null;
        // if (file) { ... } // Đã xóa

        if (!user_id) {
            // if (file) fs.unlinkSync(file.path); // Đã xóa
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }
        if (!sem_id || !sub_id || !title) {
            // if (file) fs.unlinkSync(file.path); // Đã xóa
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc." });
        }

        const [rows] = await db.query(
            "CALL add_note(?, ?, ?, ?, ?)", // Chỉ còn 5 tham số
            [user_id, sem_id, sub_id, title, content || null] // Chỉ truyền data ghi chú
        );

        const note_id = rows[0][0].note_id;

        // Lấy lại note vừa thêm bằng CALL get_notes (chỉ lấy data ghi chú)
        const [getRows] = await db.query("CALL get_notes(?, ?)", [user_id, sem_id]);
        const notesArr = Array.isArray(getRows[0]) ? getRows[0] : [];
        const newNoteRaw = notesArr.find(n => n.note_id === note_id) || null;

        // Bỏ map file_url

        res.status(201).json({ success: true, message: "Thêm ghi chú thành công", data: newNoteRaw });
    } catch (err) {
        // if (req.file) fs.unlinkSync(req.file.path); // Đã xóa
        console.error("Lỗi addNote:", err);
        res.status(400).json({ success: false, message: err.sqlMessage || "Không thể thêm ghi chú." });
    }
};


export const updateNote = async (req, res) => {
    // const conn = await db.getConnection(); // Không cần transaction phức tạp khi không có file
    try {
        // await conn.beginTransaction(); // Đã xóa

        const user_id = req.user?.id;
        const { note_id } = req.params;
        const { sub_id, title, content } = req.body;
        // const { sub_id, title, content, remove_file } = req.body; // Đã xóa remove_file

        // const new_file = req.file; // Đã xóa
        // let file_path = null; // Đã xóa
        // let original_file_name = null; // Đã xóa

        if (!user_id || !note_id || !sub_id || !title) {
            // if (new_file) fs.unlinkSync(new_file.path); // Đã xóa
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc." });
        }

        // Bỏ logic lấy/xác định dữ liệu file cũ/mới

        // Gọi procedure update
        const [rows] = await db.query(
            "CALL update_note(?, ?, ?, ?, ?)", // Chỉ còn 5 tham số
            [note_id, user_id, sub_id, title, content || null]
        );

        const affectedRows = rows[0][0].affected_rows;

        // Bỏ logic dọn dẹp file cũ

        // Lấy lại note mới để trả về frontend
        const [updatedRows] = await db.query(
            "SELECT * FROM notes WHERE note_id = ? AND user_id = ?",
            [note_id, user_id]
        );

        // await conn.commit(); // Đã xóa

        return res.status(200).json({
            success: true,
            message: "Cập nhật thành công.",
            data: updatedRows[0],
        });

    } catch (error) {
        // if (conn) await conn.rollback(); // Đã xóa
        // if (req.file) fs.unlinkSync(req.file.path); // Đã xóa
        console.error("Lỗi updateNote:", error);
        res.status(400).json({ success: false, message: error.sqlMessage || "Không thể cập nhật ghi chú." });
    }
    // finally {
    //     if (conn) conn.release(); // Đã xóa
    // }
};

// --- DELETE (Sử dụng SP) ---
export const deleteNote = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { note_id } = req.params;

        // GỌI SP XÓA
        const [rows] = await db.query(
            "CALL delete_note(?, ?)",
            [note_id, user_id]
        );

        const affectedRows = rows[0][0].affected_rows;

        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy ghi chú hoặc không có quyền." });
        }
        res.json({ success: true, message: "Xóa thành công." });
    } catch (err) {
        console.error("Lỗi deleteNote :", err);
        res.status(500).json({ success: false, message: "Không thể xóa ghi chú." });
    }
};