# Swinburne Hackathon: Advanced Fraud Detection System

## Tổng quan dự án (Project Overview)
Hệ thống phát hiện gian lận giao dịch ngân hàng theo thời gian thực (Real-time Fraud Detection), ứng dụng kiến trúc đa cơ sở dữ liệu (Multi-Database Architecture) và AI Agents để quy trình phân tích rủi ro đa chiều đạt độ chính xác cao nhất mà không hi sinh trải nghiệm người dùng hợp lệ.

Dự án bao gồm 2 phần chính:
- **Backend:** Ứng dụng mô hình AI Agents (Planner, Vision, Detective, Report) kết hợp với 4 cơ sở dữ liệu chuyên biệt (Redis, MongoDB, Neo4j, ChromaDB).
- **Frontend:** Ứng dụng di động mô phỏng Mobile Banking trực quan, xây dựng bằng React Native (Expo).


---

## Lưu ý về file `simulators.py`

File `backend/simulators.py` chỉ dùng cho mục đích giả lập backend (demo offline hoặc phát triển nhanh). Khi demo ứng dụng thực tế trên app, hệ thống sẽ sử dụng các database thật (Redis, MongoDB, Neo4j, ChromaDB) và không cần sử dụng file này. Bạn có thể bỏ qua hoặc xóa file này khi triển khai thực tế.

## 1. Cài đặt môi trường & Clone Code

```bash
# Clone repository
git clone https://github.com/Khoa-Neee/fraud-detection-system.git
cd fraud-detection-system
```

---

## 2. Thiết lập Backend (4 Databases & API Keys)

### 2.1 Cài đặt thư viện Python

Mở terminal, di chuyển vào thư mục Backend và tạo môi trường ảo. Bạn có thể chọn sử dụng `venv` hoặc `conda`:

**Tùy chọn 1: Sử dụng venv (Mặc định của Python)**
```bash
cd backend
python -m venv venv

# Kích hoạt venv (Windows):
venv\Scripts\activate
# Kích hoạt venv (Mac/Linux):
source venv/bin/activate

# Cài đặt các thư viện cần thiết:
pip install -r requirements.txt
```
**Tùy chọn 2: Sử dụng Conda (Khuyên dùng nếu đã cài Anaconda/Miniconda)**
``` bash
cd backend
# Tạo môi trường ảo có tên là 'backend_env' (bạn có thể đổi phiên bản Python nếu cần):
conda create -n backend_env python=3.10 -y

# Kích hoạt môi trường:
conda activate backend_env

# Cài đặt các thư viện cần thiết:
pip install -r requirements.txt
```
### 2.2 Đăng ký API Keys & Databases
Bạn cần tạo tài khoản tự do (Free Tier) tại 4 nền tảng sau và lấy thông tin cấu hình:
1. **Redis Enterprise Cloud**: Lưu trữ dữ liệu screening cực nhanh cho Phase 1.
2. **Neo4j AuraDB**: Cơ sở dữ liệu đồ thị (Graph DB) để phân tích hành vi và luồng tiền ngầm (hiện ẩn danh).
3. **MongoDB Atlas**: Tương đương CSDL lõi của ngân hàng, lưu trữ hồ sơ người dùng (Profiles) và lịch sử giao dịch gốc.
4. **ChromaDB Cloud / Local**: Lưu trữ Knowledge Base lưu giữ các mẫu gian lận (Fraud Patterns).
5. **Google Gemini API**: Lấy API Key từ Google AI Studio để cấp luồng suy luận cho các AI Agents.

### 2.3 Cấu hình `.env`
Tạo file `.env` trong thư mục `backend` (có thể copy từ mẫu `.env.example`):
```bash
cp .env.example .env
```
Mở file `.env` và điền đầy đủ các thông tin Credentials / API Keys bạn vừa khởi tạo ở trên.

### 2.4 Sinh Dữ liệu và Đẩy (Push) lên Databases
Bước này giúp đổ các dữ liệu mô phỏng (Profiles, Transactions, Relationships, Rule) vào các DB để có dữ liệu thực nghiệm:
```bash
# Hệ thống sẽ đọc file dữ liệu mẫu và push tự động lên 4 cơ sở dữ liệu tương ứng
python setup_demo.py
```

---

## 3. Khởi chạy Ứng dụng

### 3.1 Chạy Backend Server
Giữ nguyên terminal đang ở thư mục `backend`, khởi chạy server FastAPI:
```bash
python main.py --serve
```

### 3.2 Cấu hình kết nối API cho Frontend
Chạy ứng dụng di động trên điện thoại thật yêu cầu bạn phải trỏ đúng địa chỉ IP LAN của máy tính đang chạy Backend:
1. Mở ứng dụng **Command Prompt (cmd)** trên Windows và gõ lệnh `ipconfig`.
2. Tìm dòng **IPv4 Address** của mạng Wi-Fi/LAN bạn đang kết nối (ví dụ: `192.168.1.10`).
3. Mở file mã nguồn `frontend/src/services/api.js`.
4. Sửa giá trị của biến `BACKEND_HOST` bằng dải IPv4 mà bạn vừa lấy được. *(Lưu ý: Không được để là `localhost` vì điện thoại của bạn sẽ không hiểu `localhost` là máy tính).*

### 3.3 Khởi chạy Frontend (Expo)
Mở một Terminal **mới**, di chuyển vào trực tiếp thư mục `frontend`:
```bash
cd frontend
npm install
npx expo start -c
```

### 3.4 Trải nghiệm trên Điện thoại qua Expo Go
- **Đối với iOS:** Truy cập **App Store** và kiếm ứng dụng tên **"Expo Go"**. Tải về, sau đó mở ứng dụng Camera gốc của iPhone quét mã QR ở trên Terminal của bước 3.2.
- **Đối với Android:** Tải **"Expo Go"** từ **Google Play**. Mở ứng dụng Expo Go lên và chọn tính năng quét mã QR, sau đó quét mã hiển thị trên Terminal.

*Lưu ý bắt buộc: Điện thoại và Máy tính (chạy backend & expo) phải được kết nối chung vào CÙNG MỘT MẠNG Wi-Fi/LAN.*

---

## 4. Hướng dẫn Test Kịch Bản Demo (Demo Scenarios)

Trên ứng dụng điện thoại, tiến hành **Đăng nhập (Sign In)** bằng định danh:
👉 `C1003668831` *(Huỳnh Vinh Hải - Khách hàng có lịch sử giao dịch minh bạch, uy tín, thuộc nhóm rủi ro thấp).* 

Nhấn vào **Chuyển tiền trong nước**. Sau đó, trải nghiệm kiểm tra sức mạnh hệ thống với 2 kịch bản chuyển khoản sau:

### Kịch bản 1: Giao dịch thông thường (Xử lý nhanh)
Khách hàng thực hiện chuyển khoản với số tiền nhỏ, hợp lý đến một tài khoản uy tín khác.
- **Tới (Receiver / To Account ID):** `C1004838919` *(Bùi Uyên An - Khách hàng có lịch sử giao dịch tốt, rủi ro thấp)*
- **Số tiền (Amount):** `10` *(Số tiền nhỏ, phù hợp với chi tiêu cá nhân thông thường)*
- **Nội dung (Description):** `Tra tien ca phe`

**Kết quả kỳ vọng:** Giao dịch được hệ thống kiểm tra và phê duyệt ngay lập tức nhờ điểm rủi ro thấp, không cần kích hoạt các phân tích chuyên sâu. Đảm bảo trải nghiệm người dùng mượt mà, không bị gián đoạn.

### Kịch bản 2: Giao dịch có dấu hiệu bất thường (Kích hoạt kiểm tra chuyên sâu)
Khách hàng thực hiện chuyển tiền đến một tài khoản có dấu hiệu liên quan đến mạng lưới tài chính ngầm, tuy chưa nằm trong danh sách chặn (Blacklist).
- **Tới (Receiver / To Account ID):** `C1102413633` *(Lê Hải Vinh - Tài khoản nghi vấn trong hệ thống)*
- **Số tiền (Amount):** `5000` *(Giao dịch có giá trị lớn, sát ngưỡng cảnh báo nhưng chưa vượt ngưỡng báo động chuẩn AML)*
- **Nội dung (Description):** `Thanh toan don hang`

**Kết quả kỳ vọng:** Giao dịch vượt qua kiểm tra sơ bộ nhờ uy tín của hai bên và giá trị giao dịch chưa vượt ngưỡng chặn tự động. Tuy nhiên, hệ thống sẽ tự động kích hoạt các AI Agent để phân tích sâu hơn về mối quan hệ, hành vi và lịch sử giao dịch. Nếu phát hiện rủi ro cao, giao dịch sẽ bị **Chặn (Block)** kèm theo giải trình chi tiết.
