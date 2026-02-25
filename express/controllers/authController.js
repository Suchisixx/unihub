import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

// đăng ký
export const register = async (req, res) => {
    // data từ request
    const { username, email, password } = req.body;

    // kiểm tra dữ liệu không được trống
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email và mật khẩu không được để trống' });
    }

    // kết nối db và bắt đầu transaction

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // xử lý transaction đăng ký song song tạo năm và học kỳ

    try {
        // Kiểm tra trùng email
        const [existing] = await conn.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        if (existing.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Mã hóa mật khẩu & thêm user
        const hashedPassword = bcrypt.hashSync(password, 10); // dùng hàm băm bcrypt
        // insert user vào DB 
        const [result] = await conn.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const userId = result.insertId; // Lấy user_id mới tạo

        // Tạo sẵn 4 năm học, mỗi năm có 2 học kỳ vào user mới đăng ký
        const yearNames = ['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4'];

        for (let name of yearNames) {
            const [yearResult] = await conn.query(
                'INSERT INTO years (user_id, name) VALUES (?, ?)',
                [userId, name]
            );
            const yearId = yearResult.insertId; // Lấy year_id mới tạo

            await conn.query(
                `INSERT INTO semesters (year_id, name) VALUES (?, 'học kỳ 1'), (?, 'học kỳ 2')`,
                [yearId, yearId]
            );
        }

        await conn.commit(); // Khi các thao tác transaction thành công , lưu vào CSDL
        conn.release(); // giải phóng kết nối

        res.status(201).json({
            message: 'Đăng ký thành công! Đã tự động tạo 4 năm học và 2 học kỳ mỗi năm.',
            user: {
                id: userId,
                username,
                email
            }
        });

    } catch (err) {
        await conn.rollback(); // nếu có lỗi thì hoàn tác các thao tác trước đó
        conn.release();
        console.error('Lỗi khi đăng ký:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};


// đăng nhập
export const login = async (req, res) => {
    // data từ request
    const { email, password } = req.body;

    // kiểm tra dữ liệu không được trống
    if (!email || !password) {
        return res.status(400).json({ message: 'Email và mật khẩu không được để trống' });
    }

    // kết nối db và kiểm tra đăng nhập
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = rows[0];

        // kiểm tra mật khẩu bằng bcrypt.compareSync
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Sai mật khẩu' });
        }

        // tạo JWT
        const token = jwt.sign(
            {
                id: user.user_id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '168h' } // 1 session kéo dài 7 ngày
        );

        // trả về token và thông tin user
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Lỗi khi đăng nhập:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};
