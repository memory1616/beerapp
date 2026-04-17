# Beer POS Mobile

Ứng dụng di động cho hệ thống Beer POS - được xây dựng với React Native (Expo).

## Tính năng

- **POS Screen** - Màn hình bán hàng với grid sản phẩm, giỏ hàng, chọn khách hàng
- **Dashboard** - Tổng quan doanh thu, lợi nhuận, thống kê nhanh
- **Khách hàng** - Quản lý danh sách khách hàng, tìm kiếm, xem chi tiết
- **Đơn hàng** - Lịch sử đơn hàng, lọc theo trạng thái
- **Cài đặt** - Kết nối server, kiểm tra kết nối

## Yêu cầu

- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Server Beer POS đang chạy (mặc định: http://localhost:3000)

## Cài đặt

```bash
# Di chuyển vào thư mục mobile
cd mobile

# Cài đặt dependencies
npm install

# Hoặc sử dụng yarn
yarn install
```

## Chạy ứng dụng

```bash
# Development với Expo
npm start
# hoặc
npx expo start

# Chạy trên Android
npx expo start --android

# Chạy trên iOS
npx expo start --ios
```

## Cấu hình Server

1. Mở ứng dụng
2. Vào tab "Cài đặt"
3. Nhập địa chỉ server Beer POS
4. Nhấn "Lưu" và "Kiểm tra"

Mặc định: `http://localhost:3000`

## Cấu trúc thư mục

```
mobile/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── package.json
├── src/
│   ├── components/           # UI components
│   ├── navigation/           # Navigation setup
│   ├── screens/              # Screen components
│   │   ├── POSScreen.js     # Màn hình bán hàng
│   │   ├── DashboardScreen.js
│   │   ├── CustomerScreen.js
│   │   ├── OrdersScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   └── api.js           # API service layer
│   └── store/
│       └── index.js          # State management
└── assets/                   # Images, fonts
```

## API Endpoints

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products/prices` - Lấy giá theo khách hàng

### Sales
- `GET /api/sales` - Danh sách hóa đơn
- `POST /api/sales` - Tạo đơn hàng mới
- `GET /api/sales/:id` - Chi tiết hóa đơn
- `POST /api/sales/update-kegs` - Cập nhật vỏ

### Customers
- `GET /api/customers` - Danh sách khách hàng
- `POST /api/customers` - Tạo khách hàng
- `GET /api/customers/:id` - Chi tiết khách hàng
- `GET /api/customers/:id/stats` - Thống kê khách hàng

### Analytics
- `GET /report/data` - Báo cáo tổng hợp
- `GET /api/analytics/profit-by-product` - Lợi nhuận theo sản phẩm

### Kegs
- `GET /api/kegs/state` - Trạng thái vỏ keg
- `POST /api/kegs/deliver` - Giao vỏ
- `POST /api/kegs/collect` - Thu vỏ

## Lưu ý

- Ứng dụng sử dụng API có sẵn từ server Beer POS
- Không thay đổi backend
- Dữ liệu được đồng bộ trực tiếp với server
- Cần có kết nối mạng đến server để hoạt động
