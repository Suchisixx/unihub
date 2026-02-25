// screens/ScheduleScreen.js 
→ components/schedule/ScheduleModal.jsx 
→ context/scheduleContext.js 
→ services/api.js 
→ backend/controllers/schedulesController.js
→ services/scheduleService.js 
→ MySQL Stored Procedure (add_schedule) 
→ DB

KHỞI ĐỘNG & CHỌN HỌC KỲ
User đã đăng nhập → AuthContext cập nhật user info
→ Đã chọn học kỳ → SemesterContext cập nhật selectedSemester (có sem_id)
MỞ MODAL THÊM LỊCH THỦ CÔNG
Vào màn hình Thời khóa biểu → nhấn nút “Thêm mới”
→ Chọn “Nhập thủ công” → ScheduleModal hiện lên với form trống
→ Tự động load danh sách cơ sở (campus) từ campusContext
NHẬP THÔNG TIN MÔN HỌC
Người dùng điền các trường:
Tên môn học (bắt buộc)
Loại: Lý thuyết (LT) / Thực hành (TH)
Phòng học (bắt buộc)
Thứ trong tuần (Thứ 2 → Chủ nhật)
Giờ bắt đầu & Giờ kết thúc (dùng DateTimePicker)
Cơ sở (gợi ý từ danh sách đã lưu + hỗ trợ xóa cơ sở cũ bằng icon thùng rác)
→ Validate realtime: bắt buộc, giờ bắt đầu < giờ kết thúc, nếu tạo cơ sở mới phải nhập địa chỉ

GỬI YÊU CẦU THÊM LỊCH
Nhấn “Thêm mới” → gọi addSchedule(payload) từ ScheduleContext
→ Payload gửi đi (JSON):JSON{
  "subject_name": "Lập trình di động",
  "sem_id": 123,
  "type": "lt",
  "room": "A301",
  "day_of_week": 3,
  "start_time": "07:30:00",
  "end_time": "09:50:00",
  "campus_name": "Cơ sở 1",
  "campus_address": "123 Nguyễn Văn Cừ..."
}→ Gọi apiPost('/api/schedules', payload)
BACKEND XỬ LÝ QUA STORED PROCEDURE
Controller addSchedule → gọi scheduleService.addSchedule()
→ Service gọi Stored Procedure add_schedule (11 tham số)
Procedure thực hiện tuần tự:
Validate giờ kết thúc > giờ bắt đầu
Tự động tạo/tìm subject theo tên
Tự động tạo/tìm campus theo tên (nếu nhập mới)
Kiểm tra trùng môn cùng loại trong học kỳ
Kiểm tra trùng giờ toàn bộ lịch học trong học kỳ (check_time_conflict)
Insert thành công → trả LAST_INSERT_ID()

TRẢ KẾT QUẢ & CẬP NHẬT GIAO DIỆN
Thành công → context gọi fetchSchedules(sem_id)
→ ltSchedules / thSchedules được làm mới
→ Môn học mới xuất hiện ngay trên thời khóa biểu ở đúng thứ + giờ
→ Đóng modal → giao diện tự động render lại
→ Nếu bật thông báo & môn rơi vào hôm nay → tự động lên lịch thông báo

ĐIỀU KIỆN QUAN TRỌNG
THÊM LỊCH THỦ CÔNG CHỈ ĐƯỢC THỰC HIỆN KHI:

User đã đăng nhập (user !== null)
Đã chọn học kỳ (selectedSemester.sem_id tồn tại)
Điền đầy đủ tên môn học + phòng học
Giờ bắt đầu < giờ kết thúc
Không trùng giờ với bất kỳ môn nào khác trong cùng học kỳ
Nếu tạo cơ sở mới → phải nhập cả tên và địa chỉ

THÊM LỊCH BỊ HỦY KHI:

Thiếu trường bắt buộc → nút “Thêm mới” bị disable + Alert chi tiết
Giờ không hợp lệ → Alert “giờ kết thúc phải lớn hơn giờ bắt đầu”
Trùng môn cùng loại → Alert “môn này đã tồn tại với cùng loại trong học kỳ”
Trùng giờ học → Alert “trùng giờ với lịch học khác”
Lỗi mạng / server → Alert “Không thể lưu lịch”