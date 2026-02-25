// services/notificationService.js   → Logic nghiệp vụ thông báo
// context/scheduleContext.js        → Quản lý state lịch học
// screens/SettingScreen.js          → Giao diện điều khiển
// context/authContext.js            → Quản lý đăng nhập
// context/semesterContext.js        → Quản lý học kỳ

// LUỒNG THÔNG BÁO LỊCH HỌC

// 1. KHỞI ĐỘNG & ĐĂNG NHẬP
//    User login → AuthContext cập nhật user info
//    → Chọn học kỳ → SemesterContext cập nhật selectedSemester

// 2. FETCH DỮ LIỆU LỊCH HỌC
//    ScheduleContext lắng nghe selectedSemester thay đổi
//    → Gọi API: GET /api/schedules/semester/{sem_id}
//    → Backend trả về JSON danh sách môn học
//    → Phân loại: ltSchedules (lý thuyết) + thSchedules (thực hành)

// 3. XỬ LÝ THÔNG BÁO
//    Kiểm tra AsyncStorage: schedule_reminder_enabled = true/false
//    Nếu BẬT:
//       - Xin quyền thông báo (iOS/Android)
//       - Xoá TẤT CẢ thông báo cũ (tránh trùng)
//       - Lọc lịch học HÔM NAY theo day_of_week
//       - Tính toán thời gian: (giờ_bắt_đầu - thời_điểm_hiện_tại)
//       - Lên lịch thông báo cho từng môn sắp diễn ra
//    Nếu TẮT: Xoá hết thông báo đã lên lịch

// 4. KÍCH HOẠT THÔNG BÁO
//    Hệ thống OS tự động hiện thông báo khi đến giờ
//    Hiển thị cả khi app đang mở (setNotificationHandler)

// 5. ĐIỀU KHIỂN TỪ SETTING SCREEN
//    User bật/tắt switch → Lưu vào AsyncStorage
//    → useEffect tự động đồng bộ thông báo
//    → Test notification để kiểm tra

// ĐIỀU KIỆN QUAN TRỌNG

// THÔNG BÁO CHỈ ĐƯỢC TẠO KHI:
//    - User đã đăng nhập (user !== null)
//    - Đã chọn học kỳ (selectedSemester !== null)  
//    - Đã bật thông báo trong setting (schedule_reminder_enabled = true)
//    - Được cấp quyền thông báo (status = 'granted')
//    - Môn học thuộc ngày hôm nay (day_of_week khớp)
//    - Môn học CHƯA diễn ra (thời gian hiện tại < giờ bắt đầu)

// THÔNG BÁO BỊ HUỶ KHI:
//    - User đăng xuất
//    - Đổi học kỳ (xoá cũ, tạo mới)
//    - Tắt switch thông báo
//    - App bị force close (vẫn chạy vì là system scheduling)