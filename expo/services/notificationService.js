// services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Khởi tạo channel cho Android (chạy một lần)
// Bước 1: Thiết lập môi trường thông báo
if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
    });
}

// Bước 2: Cấu hình hiển thị khi app đang mở
// Cho phép thông báo hiện khi app mở
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Hiện popup
        shouldPlaySound: true, // Phát âm thanh
        shouldSetBadge: false,
    }),
});

// Bước 3: Xin quyền người dùng
/**
 *  Xin quyền thông báo
 */
export const registerForNotificationsAsync = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Không có quyền thông báo!');
            return false;
        }
        // Trả về true/false
        console.log(' Quyền thông báo OK');
        return true;
    } catch (error) {
        console.error(' Lỗi xin quyền:', error);
        return false;
    }
};

// Bước 4: Lên lịch thông báo cho các lịch học trong ngày
/**
 * Kiểm tra lịch học hôm nay và lên lịch thông báo
 * @param {Array} schedules Mảng lịch học
 */
export const checkAndNotifyTodaySchedules = async (schedules) => {
    if (!Array.isArray(schedules) || schedules.length === 0) return;

    // Bước 1: Xác định hôm nay là thứ mấy
    const now = new Date();
    const currentDay = now.getDay(); // 0 = CN
    const currentTKBday = currentDay === 0 ? 8 : currentDay + 1;

    // Bước 2: Lọc lịch học của hôm nay
    const todaySchedules = schedules.filter(
        (s) => Number(s.day_of_week) === currentTKBday
    );

    if (todaySchedules.length === 0) return;

    // Bước 3: Duyệt qua từng môn học và lên lịch thông báo
    for (const s of todaySchedules) {
        if (!s.start_time) continue;

        // Tính toán thời gian
        const [h, m] = s.start_time.split(':').map(Number);
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        const diffSec = Math.floor((start - now) / 1000) - 2; // Thông báo trước x giây
        const diffMin = Math.floor((start - now) / 60000);    // Chênh lệch tính bằng phút

        //  Hàm format khoảng cách
        const formatTimeDiff = (minutes) => {
            if (minutes < 1) return 'chỉ còn vài giây nữa!';
            if (minutes < 60) return `còn ${minutes} phút nữa`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins === 0
                ? `còn ${hours} giờ nữa`
                : `còn ${hours} giờ ${mins} phút nữa`;
        };

        // Điều kiện: chỉ lên lịch nếu môn học CHƯA diễn ra
        if (diffSec > 0) {
            const timeText = formatTimeDiff(diffMin);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Môn 📚 ${s.subject_name || 'Môn học'} sắp bắt đầu!`,
                    body: `Thời gian: ${s.start_time} - ${s.end_time}\nPhòng: ${s.room || 'Chưa rõ'}\nCơ sở: ${s.campus_name || 'Chính'}\n⏰ ${timeText}`,
                    sound: true,
                },
                trigger: { seconds: diffSec },
            });

            console.log(
                `📅 Đã lên lịch thông báo cho ${s.subject_name} (${s.start_time}) – ${timeText}.`
            );
        } else {
            console.log(`Bỏ qua ${s.subject_name} (đã quá giờ học).`);
        }
    }

    console.log(`Hoàn tất lên lịch thông báo hôm nay lúc ${now.toLocaleTimeString()}`);
};


/**
 * Test nhanh
 */
export const testNotification = async () => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '📢 Test Notification',
            body: 'Thông báo thử thành công!',
            sound: true,
        },
        trigger: { seconds: 2 },
    });
    console.log('Đã gửi test notification');
};