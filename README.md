# UniHub - Ứng dụng Trợ lý Cá nhân cho Sinh viên

UniHub là một ứng dụng di động được thiết kế nhằm hỗ trợ sinh viên quản lý hiệu quả đời sống học tập và cá nhân. Dự án này là Đồ án chuyên ngành thuộc Khoa Công nghệ Thông tin - Trường Đại học Tài nguyên và Môi trường TP.HCM.

## 🚀 Tính năng chính

Ứng dụng cung cấp các công cụ thiết yếu để tối ưu hóa thời gian và quản lý tài chính của sinh viên:

- **Quản lý Thời khóa biểu:** Xem lịch học chi tiết theo ngày/giờ, hỗ trợ thêm lịch thủ công hoặc nhập file để tạo lịch tự động.
- **Quản lý Thu chi:** Theo dõi các giao dịch tài chính hàng ngày, lọc giao dịch theo thời gian và xem tổng quan ngân sách.
- **Ghi chú & Nhắc nhở:** Lưu trữ các thông tin quan trọng và nhắc lịch học, lịch thi.
- **Quản lý Điểm số:** Theo dõi kết quả học tập cá nhân.

## 🛠 Công nghệ sử dụng

Dự án được xây dựng theo mô hình kiến trúc 3 tầng (3-tier architecture):

- **Frontend:** [React Native](https://reactnative.dev/) với nền tảng [Expo](https://expo.dev/).
- **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) framework.
- **Database:** [MySQL](https://www.mysql.com/).
- **Ngôn ngữ:** JavaScript.

## 📂 Cấu trúc dự án

```text
UNIHUB/
├── expo/       # Mã nguồn ứng dụng di động (Frontend)
├── express/    # Mã nguồn máy chủ API (Backend)
├── .gitignore  # Cấu hình các tệp tin loại trừ khi đẩy lên Git
└── package.json

Tầng giao diện: Quản lý màn hình trong expo/screens và trạng thái dữ liệu trong expo/context.
Tầng logic: Xử lý nghiệp vụ tại express/controllers và định tuyến API tại express/routes.

⚙️ Cài đặt & Chạy thử
Yêu cầu hệ thống
Node.js (phiên bản mới nhất)

MySQL Server

Expo Go trên điện thoại hoặc trình giả lập

Các bước thực hiện
Clone dự án:

Bash
git clone [https://github.com/Suchisixx/unihub.git](https://github.com/Suchisixx/unihub.git)
cd unihub
Cài đặt Backend:

Bash
cd express
npm install
# Cấu hình file .env với thông tin Database của bạn
npm start
Cài đặt Frontend:

Bash
cd ../expo
npm install
npx expo start
