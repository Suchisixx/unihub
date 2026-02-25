// screens/Schedule/utils/dateUtils.js
/* Thay toàn bộ nội dung file bằng phần sau (hàm tolerant với nhiều dạng input) */

export const dayName = (n) => {
    const map = {
        2: 'Thứ Hai',
        3: 'Thứ Ba',
        4: 'Thứ Tư',
        5: 'Thứ Năm',
        6: 'Thứ Sáu',
        7: 'Thứ Bảy',
        8: 'Chủ Nhật',
    };
    return map[n];
};

// Chuyển mọi dạng input (Date | "HH:MM" | "HH:MM:SS" | ISO string | timestamp) -> Date hoặc null
const toDate = (input) => {
    if (!input && input !== 0) return null;
    if (input instanceof Date) return input;
    if (typeof input === 'number') return new Date(input);
    if (typeof input !== 'string') return null;
    const s = input.trim();
    // ISO full datetime
    if (s.includes('T') || s.includes('-') && s.includes(':')) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    // time-only "HH:MM" or "HH:MM:SS"
    const parts = s.split(':').map(p => parseInt(p, 10));
    if (parts.length >= 2 && parts.every(p => !Number.isNaN(p))) {
        const d = new Date();
        d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        return d;
    }
    return null;
};

export const getTimeAsDate = (timeString) => {
    const d = toDate(timeString);
    return d || new Date();
};

export const parseTime = (timeString = "08:00") => {
    const d = toDate(timeString);
    return d || new Date();
};

export const formatTimeForAPI = (dateOrString) => {
    const d = toDate(dateOrString);
    if (!d) return null;
    const h = ('0' + d.getHours()).slice(-2);
    const m = ('0' + d.getMinutes()).slice(-2);
    return `${h}:${m}:00`;
};

export const formatTimeForDisplay = (dateOrString) => {
    const d = toDate(dateOrString);
    if (!d) return '';
    const h = ('0' + d.getHours()).slice(-2);
    const m = ('0' + d.getMinutes()).slice(-2);
    return `${h}:${m}`;
};