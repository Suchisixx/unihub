// src/service/scheduleService.js
import db from "../config/db.js";
import csv from "fast-csv";
import fs from "fs";
/**
 * Lấy danh sách lịch học (đã rút gọn, không có tuần/status)
 */
export const getSchedules = async (sem_id, user_id) => {
    if (!sem_id || !user_id) {
        throw new Error("Thiếu ID học kỳ hoặc ID người dùng.");
    }
    const conn = await db.getConnection();
    try {
        // Procedure get_schedules đã rút gọn
        const [resultSets] = await conn.query("CALL get_schedules(?, ?)", [sem_id, user_id]);

        // Kiểm tra kết quả
        if (!resultSets || !resultSets[0]) {
            console.warn(`Không tìm thấy dữ liệu TKB cho học kỳ ${sem_id}.`);
            // Chỉ trả về mảng schedules rỗng
            return { schedules: [] };
        }

        const schedules = resultSets[0]; // Mảng kết quả

        // Chỉ trả về danh sách schedules thô
        return { schedules };

    } catch (error) {
        console.error("Lỗi service getSchedules:", error);
        // Ném lỗi gốc để controller có thể xử lý sqlMessage nếu cần
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Thêm lịch học mới (Gọi procedure add_schedule đã rút gọn)
 */
export const addSchedule = async (data) => {
    const conn = await db.getConnection();
    try {
        const {
            user_id, subject_name, cam_id = null, campus_name = null,
            campus_address = null, sem_id, day_of_week, start_time,
            end_time, room = null, type = "lt",
        } = data;

        // Gọi procedure add_schedule (11 tham số)
        await conn.query(
            "CALL add_schedule(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", // 11 tham số
            [
                user_id, subject_name, cam_id, campus_name, campus_address,
                sem_id, day_of_week, start_time, end_time, room, type
                // , start_week // Thêm lại nếu procedure add_schedule VẪN CẦN
            ]
        );
        const [lastIdResult] = await conn.query('SELECT LAST_INSERT_ID() as insertId');
        // Trả về ID rõ ràng
        return { insertId: lastIdResult[0]?.insertId || null };

    } catch (error) {
        console.error("Lỗi service addSchedule:", error.sqlMessage || error.message);
        throw error; // Ném lỗi gốc
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Cập nhật lịch học (Gọi procedure update_schedule đã rút gọn)
 */
export const updateSchedule = async (data) => {
    const conn = await db.getConnection();
    try {
        const {
            schedule_id, user_id, subject_name, cam_id = null, campus_name = null,
            campus_address = null, sem_id, day_of_week, start_time,
            end_time, room = null, type = "lt",
            // Bỏ start_week nếu procedure không cần nữa
            // start_week = null // Nếu procedure update_schedule VẪN CẦN start_week thì giữ lại
        } = data;

        if (!schedule_id) throw new Error("Thiếu ID lịch học cần cập nhật");

        // Gọi procedure update_schedule (12 tham số)
        const [result] = await conn.query(
            "CALL update_schedule(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", // 12 placeholders
            [
                schedule_id, user_id, subject_name, cam_id, campus_name,
                campus_address, sem_id, day_of_week, start_time, end_time,
                room, type
                // , start_week // Thêm lại nếu procedure update_schedule VẪN CẦN
            ]
        );

        // Kiểm tra xem có dòng nào thực sự được update không
        // CALL có thể không tin cậy, nhưng thử kiểm tra
        const affectedRows = result.affectedRows || (result[0] ? result[0].affectedRows : 0);
        if (affectedRows === 0) {
            // Có thể throw lỗi hoặc chỉ trả về thông báo khác
            // throw new Error(`Không tìm thấy hoặc không có gì thay đổi cho lịch học ID ${schedule_id}.`);
            console.warn(`Không tìm thấy hoặc không có gì thay đổi cho lịch học ID ${schedule_id}.`);
        }

        return { success: true, message: "Cập nhật thành công" };

    } catch (error) {
        console.error("Lỗi service updateSchedule:", error.sqlMessage || error.message);
        throw error; // Ném lỗi gốc
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Xóa lịch học (Gọi procedure delete_schedule)
 */
export const deleteSchedule = async (schedule_id) => {
    const conn = await db.getConnection();
    try {
        if (!schedule_id) throw new Error("Thiếu ID lịch học cần xóa");
        await conn.query("CALL delete_schedule(?)", [schedule_id]);
        return { success: true };
    } catch (error) {
        console.error("Lỗi service deleteSchedule:", error.message);
        throw error; // Ném lỗi gốc
    } finally {
        if (conn) conn.release();
    }
};

const HEADER_MAP = {
    'tên môn học': 'subject_name',
    'tên môn hoc': 'subject_name',
    'tên cơ sở': 'campus_name',
    'tên co so': 'campus_name',
    'địa chỉ cơ sở': 'campus_address',
    'dia chi co so': 'campus_address',
    'thứ': 'day_of_week',
    'thu': 'day_of_week',
    'giờ bắt đầu': 'start_time',
    'gio bat dau': 'start_time',
    'giờ kết thúc': 'end_time',
    'gio ket thuc': 'end_time',
    'phòng học': 'room',
    'phong hoc': 'room',
    'loại': 'type',
    'loai': 'type'
};

const normalizeHeader = (header) => {
    if (!header) return header;
    return header
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
};

/**
 * Import TKB từ CSV
 * @param {string} filePath - Đường dẫn file CSV
 * @param {number} user_id
 * @param {number} sem_id
 * @param {object} options - { confirm: boolean }
 */
export const importFromCsv = async (filePath, user_id, sem_id, options = {}) => {
    const { confirm = false } = options;
    const rows = [];
    let actualHeaders = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv.parse({
                headers: true,
                trim: true,
                mapHeaders: ({ header, index }) => {
                    const normalized = normalizeHeader(header);
                    console.log(`Header gốc: "${header}" -> Chuẩn hóa: "${normalized}" -> Map to: "${HEADER_MAP[normalized] || header}"`);
                    if (index === 0) actualHeaders.push(normalized);
                    return HEADER_MAP[normalized] || header;
                }
            }))
            .on("data", row => {
                console.log("Dữ liệu row:", row);
                rows.push(row);
            })
            .on("error", reject)
            .on("end", () => {
                console.log("Tất cả headers thực tế:", actualHeaders);
                resolve();
            });
    });

    if (!rows.length) return { imported: 0, errors: [{ row: 0, error: "File CSV trống" }] };

    console.log("Số dòng đọc được:", rows.length);
    console.log("Dòng đầu tiên sau khi map:", rows[0]);
    console.log("Tất cả keys trong row:", Object.keys(rows[0]));

    const errors = [];
    const normalized = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const line = i + 2;

        console.log(`Xử lý dòng ${line}:`, r);

        try {
            const subject_name = r.subject_name || r['tên môn học'];
            const day_of_week = r.day_of_week || r['thứ'];
            const start_time = r.start_time || r['giờ bắt đầu'];
            const end_time = r.end_time || r['giờ kết thúc'];
            const campus_name = r.campus_name || r['tên cơ sở'];
            const campus_address = r.campus_address || r['địa chỉ cơ sở'];
            const room = r.room || r['phòng học'];
            const type = r.type || r['loại'];

            console.log(`- subject_name: "${subject_name}"`);
            console.log(`- campus_name: "${campus_name}"`);
            console.log(`- campus_address: "${campus_address}"`);
            console.log(`- room: "${room}"`);
            console.log(`- type: "${type}"`);

            if (!subject_name || !day_of_week || !start_time || !end_time) {
                console.log(` Dòng ${line} thiếu trường bắt buộc`);
                throw new Error("Thiếu cột bắt buộc (subject_name, day_of_week, start_time, end_time)");
            }

            const data = {
                user_id,
                subject_name: subject_name.trim(),
                campus_name: campus_name?.trim() || null,
                campus_address: campus_address?.trim() || null,
                sem_id,
                day_of_week: parseInt(day_of_week, 10),
                start_time: start_time.trim(),
                end_time: end_time.trim(),
                room: room?.trim() || null,
                type: (type || "lt").toLowerCase() === "th" ? "th" : "lt"
            };

            console.log(` Dòng ${line} chuẩn hóa thành:`, data);
            normalized.push(data);
        } catch (err) {
            console.log(` Lỗi ở dòng ${line}:`, err.message);
            errors.push({ row: line, error: err.message });
        }
    }

    if (confirm) {
        console.log("Bắt đầu import...");
        let imported = 0;
        for (const data of normalized) {
            try {
                console.log(` Đang thêm môn: ${data.subject_name}`);
                const result = await addSchedule(data);
                console.log(`Đã thêm môn: ${data.subject_name}, ID: ${result.insertId}`);
                imported++;
            } catch (err) {
                console.error(` Lỗi khi thêm môn ${data.subject_name}:`, err.message);
                errors.push({ subject: data.subject_name, error: err.sqlMessage || err.message });
            }
        }
        console.log(` Import hoàn tất: ${imported}/${normalized.length} bản ghi`);
        return { imported, errors };
    } else {
        console.log(" Chế độ Preview file - không import thật");
        return {
            imported: 0,
            previewCount: normalized.length,
            preview: normalized.slice(0, 10),
            errors
        };
    }
};