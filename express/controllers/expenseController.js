// express/controllers/expenseController.js
import db from "../config/db.js";

// --- Hàm tiện ích cho Formatting ---
const formatTransactionData = (data) => {
    // Chuyển đổi Date object (từ MySQL) thành chuỗi YYYY-MM-DD
    if (data.date instanceof Date) {
        data.date = data.date.toISOString().split('T')[0];
    }
    // Chuyển amount sang số thập phân
    if (data.amount) {
        data.amount = parseFloat(data.amount);
    }
    return data;
};
export const getFinanceData = async (req, res) => {
    try {
        const userId = parseInt(req.user?.id, 10);
        if (isNaN(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "Người dùng chưa đăng nhập",
            });
        }

        // Gọi 3 procedure song song
        const [financeResult, transResult, cateResult] = await Promise.all([
            db.query("CALL get_finance(?)", [userId]),
            db.query("CALL get_transactions(?)", [userId]),
            db.query("CALL get_categories(NULL)"),
        ]);

        // Lấy dữ liệu đúng tầng
        const summaryRows = financeResult?.[0]?.[0] || [];
        const transRows = transResult?.[0]?.[0] || [];
        const cateRows = cateResult?.[0]?.[0] || [];

        const summary = summaryRows?.[0] || {
            balance: 0,
            income: 0,
            expense: 0,
        };

        // Chuẩn hoá dữ liệu giao dịch
        const transactions = transRows.map((item) => ({
            trans_id: item.trans_id,
            cate_id: item.cate_id,
            amount: parseFloat(item.amount) || 0,
            type: item.type || "chi",
            trans_date: item.trans_date
                ? item.trans_date.toString().slice(0, 10)
                : null,
            description: item.description || "",
        }));

        // Chuẩn hoá dữ liệu danh mục
        const categories = cateRows.map((cat) => ({
            cate_id: cat.cate_id ?? cat.id ?? null,
            name: cat.name ?? cat.category_name ?? "Không tên",
            type: cat.type ?? "chi",
            color: cat.color ?? "#93C5FD",
            icon: cat.icon ?? "Circle",
        }));

        // Trả kết quả cuối cùng
        return res.status(200).json({
            success: true,
            message: "Lấy dữ liệu tài chính thành công",
            summary,
            transactions,
            categories,
        });
    } catch (error) {
        console.error("Lỗi getFinanceData:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy dữ liệu tài chính.",
            summary: { balance: 0, income: 0, expense: 0 },
            transactions: [],
            categories: [],
        });
    }
};

// --- CRUD TRANSACTIONS ---

export const addTransaction = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { cate_id, amount, type, trans_date, description } = req.body;

        if (!amount || !type) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc (amount, type)." });
        }
        if (!['thu', 'chi'].includes(type)) {
            return res.status(400).json({ success: false, message: "Loại giao dịch không hợp lệ." });
        }

        // SỬA: dùng trans_date
        const [rows] = await db.query(
            "CALL add_transaction(?, ?, ?, ?, ?, ?)",
            [user_id, cate_id, amount, type, trans_date, description || null]
        );

        const trans_id = rows[0][0].trans_id;
        res.status(201).json({ success: true, trans_id, message: "Thêm giao dịch thành công" });

    } catch (error) {
        console.error("Lỗi addTransaction:", error);
        const msg = error.sqlMessage || error.message || "Lỗi thêm giao dịch";
        res.status(400).json({ success: false, message: msg });
    }
};
export const updateTransaction = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { trans_id } = req.params;
        const { cate_id, amount, type, trans_date, description } = req.body; // ĐỔI: date -> trans_date

        if (!trans_id || !amount || !type) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc." });
        }
        if (!['thu', 'chi'].includes(type)) {
            return res.status(400).json({ success: false, message: "Loại giao dịch không hợp lệ." });
        }

        // SỬA: thêm trans_date parameter
        const [rows] = await db.query(
            "CALL update_transaction(?, ?, ?, ?, ?, ?, ?)",
            [trans_id, user_id, cate_id || null, amount, type, trans_date, description || null]
        );

        const affectedRows = rows[0][0].affected_rows;
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch hoặc không có quyền." });
        }
        res.status(200).json({ success: true, message: "Cập nhật thành công." });
    } catch (error) {
        console.error("Lỗi updateTransaction:", error);
        res.status(500).json({ success: false, message: error.message || "Không thể cập nhật giao dịch." });
    }
};
export const deleteTransaction = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { trans_id } = req.params;

        const [rows] = await db.query(
            "CALL delete_transaction(?, ?)",
            [trans_id, user_id]
        );

        const affectedRows = rows[0][0].affected_rows;
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch hoặc không có quyền." });
        }
        res.status(200).json({ success: true, message: "Xóa thành công." });
    } catch (error) {
        console.error("Lỗi deleteTransaction:", error);
        res.status(500).json({ success: false, message: "Không thể xóa giao dịch." });
    }
};
