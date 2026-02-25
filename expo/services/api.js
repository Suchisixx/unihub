import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://192.168.1.41:3000';

// Nếu ở nhà thì dùng IP = '192.168.1.41';
// Nếu ra ngoài thì dùng IP = '10.0.2.2' để trỏ vào localhost

// Lấy token user từ AsyncStorage và thêm vào header
// Lưu ý: Hàm này KHÔNG thêm Content-Type, Content-Type sẽ được thêm ở hàm gọi API (apiPost, apiPut)
export async function getAuthHeader() {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Hàm gọi API với phương thức GET, POST, PUT, DELETE

export async function apiGet(path) {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data.message || res.status));
    }
    return data;
}

export async function apiPost(path, body) {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json', // Thêm Content-Type cho JSON body
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data.message || res.status));
    }
    return data;
}

/**
 * Khôi phục hàm POST với FormData (dùng cho file upload)
 */
export async function apiPostFormData(path, formData) {
    const headers = await getAuthHeader(); // { Authorization: 'Bearer ...' }
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            ...headers,
            // KHÔNG THÊM 'Content-Type': 'multipart/form-data'
            // fetch sẽ tự thêm header này với boundary cần thiết
        },
        body: formData,
    });

    let data;
    try { data = await res.json(); } catch (e) { throw new Error('Không parse được response JSON'); }
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}


export async function apiPut(path, body) {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json', // Thêm Content-Type cho JSON body
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data.message || res.status));
    }
    return data;
}

export async function apiDelete(path) {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        headers,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data.message || res.status));
    }
    return data;
}