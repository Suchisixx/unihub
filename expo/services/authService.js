const API_BASE_URL = 'http://192.168.1.41:3000';
// Nếu ở nhà thì dùng IP = '192.168.1.41';
// Nếu ra ngoài thì dùng IP = '10.0.2.2' để trỏ vào localhost

export async function register(username, email, password) {
    try {
        // SỬA: Dùng API_BASE_URL + '/api/auth/register'
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Lỗi khi đăng ký');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function login(email, password) {
    try {
        // Dùng API_BASE_URL + '/api/auth/login'
        // đã thay thế địa chỉ cứng 'http://10.196.65.105:3000/api/auth/login' bằng biến
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Lỗi khi đăng nhập');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// hàm gửi yêu cầu quên mật khẩu

export async function forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

// hàm đặt lại mật khẩu

export async function resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}
