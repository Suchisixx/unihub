// express/controllers/yearSemesterController.js
import db from "../config/db.js";

// --- GET FUNCTIONS ---

/**
 * [GET] /api/year-semester
 * Lấy danh sách năm học và học kỳ của user
 */
export const getAllYearSemester = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }

        const [years] = await db.query(
            // Sửa: Chỉ lấy cột name và is_current
            `SELECT year_id, name, is_current 
             FROM years 
             WHERE user_id = ? 
             ORDER BY year_id DESC`, // Giả định sắp xếp theo ID (hoặc name)
            [user_id]
        );

        const yearPromises = years.map(async (year) => {
            const [semesters] = await db.query(
                // Sửa: Chỉ lấy cột name và is_current
                `SELECT sem_id, year_id, name, is_current 
                 FROM semesters 
                 WHERE year_id = ? 
                 ORDER BY sem_id ASC`, // Sắp xếp theo ID
                [year.year_id]
            );
            return { ...year, semesters: semesters };
        });

        const yearsWithSemesters = await Promise.all(yearPromises);
        res.json({ success: true, data: yearsWithSemesters });

    } catch (err) {
        console.error("Lỗi getAllYearSemester:", err);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách năm & học kỳ" });
    }
};


/**
 * [POST] /api/year-semester/semesters/set-current
 */
export const setCurrentSemester = async (req, res) => {
    try {
        const { sem_id } = req.body;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
        }

        if (!sem_id) {
            return res.status(400).json({ success: false, message: "Thiếu sem_id" });
        }

        // Lấy year_id để chắc chắn học kỳ thuộc user
        const [[semester]] = await db.query(
            `SELECT s.sem_id, s.year_id 
             FROM semesters s
             JOIN years y ON s.year_id = y.year_id
             WHERE s.sem_id = ? AND y.user_id = ?`,
            [sem_id, user_id]
        );

        if (!semester) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ thuộc người dùng" });
        }

        // Reset tất cả học kỳ của user về 0
        await db.query(
            `UPDATE semesters s 
             JOIN years y ON s.year_id = y.year_id
             SET s.is_current = 0
             WHERE y.user_id = ?`,
            [user_id]
        );

        // Set học kỳ được chọn thành 1
        await db.query(
            `UPDATE semesters SET is_current = 1 WHERE sem_id = ?`,
            [sem_id]
        );

        res.json({ success: true, message: "Đặt học kỳ hiện tại thành công" });
    } catch (err) {
        console.error("Lỗi setCurrentSemester:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};


/**
 * [GET] /api/year-semester/years
 */
export const getYearsbyUser = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }

        const [years] = await db.query(
            // Sửa: Chỉ lấy cột name và is_current
            `SELECT year_id, name, is_current 
             FROM years 
             WHERE user_id = ? 
             ORDER BY year_id ASC`,
            [user_id]
        );

        res.json({ success: true, data: years });
    } catch (err) {
        console.error("Lỗi getYearsbyUser:", err);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách năm học" });
    }
};

/**
 * [POST] /api/year-semester/years
 * Thêm năm học mới
 */
export const addYear = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập" });
        }
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Thiếu tên năm học" });
        }

        // Kiểm tra trùng lặp TÊN NĂM HỌC cho User này trước khi INSERT (MySQL UNIQUE INDEX cũng sẽ bắt lỗi này)
        const [existingYear] = await db.query(
            "SELECT year_id FROM years WHERE user_id = ? AND name = ?",
            [user_id, name]
        );

        if (existingYear.length > 0) {
            return res.status(409).json({ success: false, message: "Năm học này đã tồn tại." });
        }


        const [result] = await db.query(
            "INSERT INTO years (user_id, name) VALUES (?, ?)",
            [user_id, name]
        );
        res.status(201).json({ success: true, year_id: result.insertId });
    }
    catch (err) {
        // Lỗi 409 (trùng lặp) cũng có thể bị bắt ở đây nếu không check trước
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Năm học này đã tồn tại." });
        }
        console.error("Lỗi addYear:", err);
        res.status(500).json({ success: false, message: "Lỗi thêm năm học ở server" });
    }
};

/**
 * [POST] /api/year-semester/semesters
 * Thêm học kỳ mới
 */
export const addSemester = async (req, res) => {
    try {
        const { year_id, name } = req.body;

        if (!year_id || !name) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin học kỳ" });
        }

        // Kiểm tra trùng lặp TÊN HỌC KỲ trong Năm Học này (MySQL UNIQUE INDEX cũng sẽ bắt lỗi này)
        const [existingSemester] = await db.query(
            "SELECT sem_id FROM semesters WHERE year_id = ? AND name = ?",
            [year_id, name]
        );

        if (existingSemester.length > 0) {
            return res.status(409).json({ success: false, message: "Học kỳ này đã tồn tại trong năm học đã chọn." });
        }

        const [result] = await db.query(
            "INSERT INTO semesters (year_id, name) VALUES (?, ?)",
            [year_id, name]
        );
        res.status(201).json({ success: true, sem_id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Học kỳ này đã tồn tại trong năm học đã chọn." });
        }
        console.error("Lỗi addSemester:", error);
        res.status(500).json({ success: false, message: "Lỗi thêm học kỳ ở server" });
    }
};

// --- PUT FUNCTIONS (Tách biệt cho Năm và Học kỳ) ---

/**
 * [PUT] /api/year-semester/years/:year_id
 * Cập nhật tên năm học
 */
export const updateYear = async (req, res) => {
    try {
        const { year_id } = req.params;
        const { name } = req.body;
        const user_id = req.user?.id;

        if (!user_id) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
        if (!name) return res.status(400).json({ success: false, message: "Thiếu tên năm học" });

        const [result] = await db.query(
            "UPDATE years SET name = ? WHERE year_id = ? AND user_id = ?",
            [name, year_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy năm học để cập nhật hoặc không có quyền." });
        }

        res.json({ success: true, message: "Cập nhật năm học thành công" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Tên năm học đã tồn tại." });
        }
        console.error("Lỗi updateYear:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật năm học" });
    }
};

/**
 * [PUT] /api/year-semester/semesters/:sem_id
 * Cập nhật tên học kỳ
 */
export const updateSemester = async (req, res) => {
    try {
        const { sem_id } = req.params;
        const { name } = req.body;
        const user_id = req.user?.id;

        if (!user_id) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
        if (!name) return res.status(400).json({ success: false, message: "Thiếu tên học kỳ" });

        // Dùng JOIN để đảm bảo semester này thuộc year của user
        const [result] = await db.query(
            `UPDATE semesters s JOIN years y ON s.year_id = y.year_id 
             SET s.name = ? 
             WHERE s.sem_id = ? AND y.user_id = ?`,
            [name, sem_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ để cập nhật." });
        }

        res.json({ success: true, message: "Cập nhật học kỳ thành công" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Tên học kỳ đã tồn tại trong năm học này." });
        }
        console.error("Lỗi updateSemester:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật học kỳ" });
    }
};

// --- DELETE FUNCTIONS (Xóa năm/học kỳ) ---

/**
 * [DELETE] /api/year-semester/years/:year_id
 * Xóa năm học (và học kỳ con qua ON DELETE CASCADE)
 */
export const deleteYear = async (req, res) => {
    try {
        const { year_id } = req.params;
        const user_id = req.user?.id;
        if (!user_id) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

        const [result] = await db.query(
            "DELETE FROM years WHERE year_id = ? AND user_id = ?",
            [year_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy năm học để xóa hoặc không có quyền." });
        }

        res.json({ success: true, message: "Xóa năm học và học kỳ thành công" });
    } catch (error) {
        console.error("Lỗi deleteYear:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa dữ liệu năm học" });
    }
};

/**
 * [DELETE] /api/year-semester/semesters/:sem_id
 * Xóa học kỳ
 */
export const deleteSemester = async (req, res) => {
    try {
        const { sem_id } = req.params;
        const user_id = req.user?.id;
        if (!user_id) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

        // Dùng JOIN để đảm bảo semester này thuộc user đang login
        const [result] = await db.query(
            `DELETE s FROM semesters s JOIN years y ON s.year_id = y.year_id 
             WHERE s.sem_id = ? AND y.user_id = ?`,
            [sem_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ để xóa hoặc không có quyền." });
        }

        res.json({ success: true, message: "Xóa học kỳ thành công" });
    } catch (error) {
        console.error("Lỗi deleteSemester:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa dữ liệu học kỳ" });
    }
};