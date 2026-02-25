// components/schedule/ImportScheduleModal.js 
→ context/scheduleContext.js 
→ services/api.js 
→ backend/routes/schedules.js 
→ controllers/schedulesController.js 
→ services/scheduleService.js 
→ DB

1. NGƯỜI DÙNG BẮT ĐẦU IMPORT
User mở màn hình Thời khóa biểu → đã chọn học kỳ (selectedSemester.sem_id tồn tại)
→ Nhấn “Thêm mới” → chọn “Nhập từ file CSV” → ImportScheduleModal hiện lên

2.CHỌN VÀ KIỂM TRA FILE TRÊN FE
Người dùng nhấn “Chọn File CSV” → expo-document-picker mở
→ Trả về object { uri, name, mimeType } → hiển thị tên file trong modal
→ Nếu chưa chọn học kỳ → nút Import bị disable

3. GỬI YÊU CẦU IMPORT
Nhấn “Import & Lưu” → tạo FormData:
file (uri + name + type)
sem_id (selectedSemester.sem_id)
confirm = "true" (bắt buộc để import thật)
→ Gọi importSchedules(fileObject) từ ScheduleContext

4. SCHEDULE CONTEXT XỬ LÝ
importSchedules() trong ScheduleContext:
→ Kiểm tra lại selectedSemester.sem_id
→ Gọi apiPostFormData('/api/schedules/import', formData)
→ Chờ response từ backend

5. BACKEND NHẬN VÀ XỬ LÝ FILE
Route POST /api/schedules/import → authenticateToken + multer lưu file tạm vào uploads/
→ Controller importSchedules:
• Lấy user_id từ token
• Lấy sem_id và confirm từ body
• Gọi scheduleService.importFromCsv(filePath, user_id, sem_id, { confirm: true })

6. SERVICE ĐỌC VÀ IMPORT CSV
importFromCsv():
→ Đọc file bằng csv-parser + stream
→ Chuẩn hóa header qua HEADER_MAP (hỗ trợ tiếng Việt, không dấu, viết hoa/thường)
→ Với mỗi dòng: validate subject_name, day_of_week, start_time, end_time
→ Vì confirm = true → gọi addSchedule(data) cho từng dòng hợp lệ
→ Đếm imported + thu thập errors (dòng lỗi, trùng lịch, DB error)
→ Xóa file tạm

7. TRẢ KẾT QUẢ VỀ FRONTEND
Backend trả JSON:
{ success: true, imported: 28, errors: [...] } hoặc { success: false, message: "...", errors: [...] }
FRONTEND HIỂN THỊ KẾT QUẢ & CẬP NHẬT
Nếu success → Alert “Đã import X môn học!”
→ Gọi fetchSchedules(sem_id) → cập nhật ltSchedules & thSchedules
→ Đóng modal → gọi onSubmit() để reload giao diện TKB
Nếu có lỗi → hiện chi tiết dòng lỗi trong Alert

ĐIỀU KIỆN QUAN TRỌNG
NHẬP FILE CHỈ ĐƯỢC THỰC HIỆN KHI:

User đã đăng nhập (user !== null)
Đã chọn học kỳ (selectedSemester.sem_id tồn tại)
File được chọn và có định dạng .csv
Có ít nhất các cột bắt buộc (tên môn học, thứ, giờ bắt đầu, giờ kết thúc)
confirm = "true" trong request

NHẬP FILE BỊ HỦY/HỦY KHI:

Chưa chọn học kỳ → nút Import bị disable
Không chọn file → nút Import bị disable
Lỗi mạng / server → catch error → Alert chi tiết
Backend trả success: false → hiển thị lỗi (dòng nào sai, trùng lịch, v.v.)
File không hợp lệ → lỗi ở bước đọc CSV → trả về errors