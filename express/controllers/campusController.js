import db from "../config/db.js";

export const getCampuses = async (req, res) => {
  try {
    const userId = req.user?.id;
    // nếu muốn per-user: thêm WHERE user_id = ? và cột user_id vào table campus
    const [rows] = await db.query(
      "SELECT cam_id, name, address FROM campus WHERE user_id = ? ORDER BY name",
      [userId]
    );
    const [id] = await db.query(
      "SELECT user_id FROM campus WHERE user_id =?", [userId]
    );
    res.json({ success: true, user: id, campuses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách cơ sở" });
  }
};

export const createCampus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên cơ sở bắt buộc" });
    const [exists] = await db.query("SELECT cam_id, address FROM campus WHERE name = ? AND user_id = ? LIMIT 1", [name, userId]);
    if (exists && exists.length > 0) {
      return res.status(200).json({ success: true, cam_id: exists[0].cam_id, address: exists[0].address, message: "Đã tồn tại" });
    }
    const [r] = await db.query("INSERT INTO campus (user_id, name, address) VALUES (?, ?, ?)", [userId, name, address || null]);
    res.status(201).json({ success: true, cam_id: r.insertId, name, address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi tạo cơ sở" });
  }
};

// DELETE /api/campuses/:id
export const deleteCampus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Thiếu ID cơ sở" });

    const [rows] = await db.query("DELETE FROM campus WHERE cam_id = ?", [id]);

    if (rows.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở để xóa" });
    }

    res.json({ success: true, message: "Đã xóa cơ sở thành công" });
  } catch (error) {
    console.error("Lỗi deleteCampus:", error.message);
    res.status(500).json({ success: false, message: "Lỗi server khi xóa cơ sở" });
  }
};
