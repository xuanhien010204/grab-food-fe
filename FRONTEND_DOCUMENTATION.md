# GrabFood Frontend — Tài liệu Source Code

> **Dự án**: GrabFood Clone – Ứng dụng đặt đồ ăn trực tuyến  
> **Công nghệ**: React 18 + TypeScript 5.6 + Vite 6  
> **Ngày tạo doc**: Tháng 6/2025

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Cấu hình dự án](#4-cấu-hình-dự-án)
5. [Kiến trúc ứng dụng](#5-kiến-trúc-ứng-dụng)
6. [Hệ thống Routing](#6-hệ-thống-routing)
7. [API Layer](#7-api-layer)
8. [Hệ thống Type/Interface](#8-hệ-thống-typeinterface)
9. [UI Components dùng chung](#9-ui-components-dùng-chung)
10. [Utilities & Helpers](#10-utilities--helpers)
11. [Tính năng Customer](#11-tính-năng-customer)
12. [Tính năng Admin](#12-tính-năng-admin)
13. [Tính năng Manager](#13-tính-năng-manager)
14. [Xác thực & Phân quyền](#14-xác-thực--phân-quyền)
15. [Các pattern kiến trúc](#15-các-pattern-kiến-trúc)

---

## 1. Tổng quan dự án

GrabFood Frontend là Single Page Application (SPA) phục vụ 3 vai trò người dùng:

| Vai trò | Prefix Route | Mô tả |
|---------|-------------|-------|
| **Customer** (User) | `/` | Duyệt cửa hàng, đặt hàng, quản lý ví, đánh giá |
| **Admin** | `/admin` | Quản lý người dùng, cửa hàng, danh mục, voucher, giao dịch |
| **Manager** | `/manager` | Quản lý đơn hàng cửa hàng, menu, tenant, phản hồi review |

**Backend API**: .NET Web API tại `http://grab-food.somee.com`, được proxy qua Vite dev server.

---

## 2. Tech Stack & Dependencies

### Production Dependencies

| Package | Version | Mục đích |
|---------|---------|---------|
| `react` | 18.3.1 | UI library |
| `react-dom` | 18.3.1 | React DOM renderer |
| `react-router-dom` | 6.28.1 | Client-side routing |
| `axios` | 1.7.9 | HTTP client |
| `tailwindcss` | 3.4.17 | Utility-first CSS framework |
| `lucide-react` | 0.469.0 | Icon library |
| `recharts` | 2.15.0 | Chart/biểu đồ |
| `framer-motion` | 11.15.0 | Animation library |
| `sonner` | 1.7.1 | Toast notification |
| `clsx` + `tailwind-merge` | — | Utility merge CSS classes |

### Dev Dependencies

| Package | Mục đích |
|---------|---------|
| `vite` 6.0.5 | Build tool & dev server |
| `typescript` ~5.6.2 | Static type checking |
| `@vitejs/plugin-react` | React Fast Refresh |
| `eslint` + plugins | Code linting |
| `postcss` + `autoprefixer` | CSS processing |

---

## 3. Cấu trúc thư mục

```
src/
├── main.tsx                  # Entry point, mount React app
├── App.tsx                   # Route definitions, BrowserRouter
├── index.css                 # Tailwind directives + custom styles
│
├── api/
│   └── api.ts                # Axios instance, interceptors, tất cả API modules
│
├── types/
│   ├── swagger.ts            # ~547 dòng: Enums, Interfaces từ backend API
│   ├── cart.ts               # CartItemDto, CartDto types
│   ├── store.ts              # Store-related types
│   └── user.ts               # User-related types
│
├── components/ui/            # Shared UI components
│   ├── Badge.tsx             # Badge với variants (default/success/warning/danger/info)
│   ├── Button.tsx            # Button với variants + sizes + loading state
│   ├── Card.tsx              # Card container component
│   ├── Input.tsx             # Input field với label + error handling
│   └── Modal.tsx             # Modal dialog overlay
│
├── lib/
│   └── utils.ts              # cn() helper: clsx + tailwind-merge
│
├── utils/
│   ├── auth.ts               # authStorage object, JWT parser
│   └── roleRedirect.ts       # Role-based redirect logic
│
├── routes/
│   └── RequireRole.tsx       # Route guard component
│
└── features/                 # Feature-based modules
    ├── customer/             # Trang cho khách hàng (~20 files)
    ├── admin/                # Trang cho admin (~15 files)
    └── manager/              # Trang cho manager (~7 files)
```

---

## 4. Cấu hình dự án

### `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://grab-food.somee.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```
- Tất cả request `/api/*` được proxy tới backend .NET
- Giúp tránh CORS trong development

### `tailwind.config.js`
- **Brand color**: Orange palette (`primary: colors.orange`)
- Content scan: `./src/**/*.{js,ts,jsx,tsx}`

### `tsconfig.json`
- TypeScript strict mode
- Target: ES2020
- Module: ESNext
- JSX: react-jsx

---

## 5. Kiến trúc ứng dụng

```
┌─────────────────────────────────────────────┐
│                  App.tsx                      │
│          (BrowserRouter + Routes)             │
├─────────────┬──────────────┬─────────────────┤
│ CustomerLayout│ AdminLayout  │ ManagerLayout   │
│   (public)    │ (RequireRole)│ (RequireRole)   │
├─────────────┴──────────────┴─────────────────┤
│              Feature Pages                    │
│         (useState + useEffect)                │
├──────────────────────────────────────────────┤
│             API Layer (api.ts)                │
│      Axios + Interceptors + Auto-unwrap       │
├──────────────────────────────────────────────┤
│        Backend: grab-food.somee.com           │
└──────────────────────────────────────────────┘
```

### Đặc điểm kiến trúc:
- **Không dùng state management** (Redux/Zustand): Toàn bộ state là local `useState`
- **Feature-based folders**: Mỗi role có thư mục riêng chứa pages + components
- **Dual layout system**: CustomerLayout (navbar + cart) vs AdminLayout/ManagerLayout (dark sidebar)
- **Server-side cart**: Giỏ hàng lưu trên server qua `/api/users/temp-data`, sync bằng debounce

---

## 6. Hệ thống Routing

### File: `src/App.tsx`

#### Customer Routes (Public — không cần đăng nhập)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/` | `HomePage` | Trang chủ: carousel, danh mục, cửa hàng nổi bật |
| `/login` | `LoginPage` | Đăng nhập |
| `/register` | `RegisterPage` | Đăng ký tài khoản |
| `/stores` | `StoresPage` | Danh sách cửa hàng |
| `/store/:id` | `StoreDetailPage` | Chi tiết cửa hàng + menu + reviews |
| `/foods` | `FoodsPage` | Danh sách món ăn + lọc + yêu thích |
| `/food/:id` | `FoodDetailPage` | Chi tiết món ăn |
| `/product/:id` | `ProductDetail` | Chi tiết sản phẩm + thêm giỏ hàng |
| `/cart` | `CartPage` | Giỏ hàng + voucher + checkout |
| `/wallet` | `WalletPage` | Nạp tiền ví + lịch sử giao dịch |
| `/orders` | `OrderHistoryPage` | Lịch sử đơn hàng (6 tab trạng thái) |
| `/orders/:id` | `OrderDetailPage` | Chi tiết đơn + hủy + đánh giá |
| `/profile` | `CustomerProfile` | Thông tin cá nhân + sửa |
| `/addresses` | `AddressPage` | CRUD địa chỉ giao hàng |
| `/favorites` | `FavoritesPage` | Cửa hàng + món ăn yêu thích |
| `/reviews` | `MyReviewsPage` | Đánh giá của tôi + xóa |
| `/notifications` | `NotificationsPage` | Thông báo |

#### Admin Routes (Yêu cầu role `Admin`)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/admin/dashboard` | `AdminDashboard` | Thống kê tổng quan |
| `/admin/users` | `UserManagement` | Quản lý người dùng + khóa |
| `/admin/stores` | `StoreManagement` | Quản lý cửa hàng + duyệt |
| `/admin/categories` | `CategoryManagement` | CRUD danh mục món ăn |
| `/admin/vouchers` | `VoucherManagement` | CRUD voucher |
| `/admin/transactions` | `Transactions` | Xem giao dịch toàn hệ thống |
| `/admin/settings` | `Settings` | Cài đặt (placeholder) |

#### Manager Routes (Yêu cầu role `Manager` hoặc `Admin`)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/manager/orders` | `OrderDashboard` | Quản lý đơn hàng (auto-poll 15s) |
| `/manager/menu` | `MenuManagement` | Quản lý menu cửa hàng |
| `/manager/reviews` | `ManagerReviews` | Xem + phản hồi review |
| `/manager/tenants` | `TenantManagement` | CRUD tenant |
| `/manager/store` | `StoreProfile` | Thông tin cửa hàng |

### Route Guard: `RequireRole`
```tsx
// Kiểm tra token + role
if (!token) → redirect /login
if (role không phù hợp) → redirect về trang home của role tương ứng
if (role hợp lệ) → render <Outlet />
```

---

## 7. API Layer

### File: `src/api/api.ts` (280 dòng)

### Axios Configuration
```typescript
const api = axios.create({
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});
```

### Interceptors

#### Request Interceptor
- Đọc token từ `localStorage`
- Auto-fix token bị wrapped trong quotes (`"token"` → `token`)
- Gắn `Authorization: Bearer <token>` vào header
- Log mọi request ra console

#### Response Interceptor
- **Auto-unwrap**: Backend trả `{ result: ..., message: "Success" }` → interceptor tự động unwrap `.result`
- **401 Handler**: Xóa auth data, redirect về `/login`
- Log mọi error ra console

### API Modules

| Module | Endpoints | Mô tả |
|--------|-----------|-------|
| `foodApi` | `GET/POST/PUT/DELETE /api/foods` | CRUD món ăn |
| `foodStoreApi` | `GET/POST/PUT/DELETE /api/food-stores` | CRUD food-store mapping |
| `foodTypeApi` | `GET/POST/PUT/DELETE /api/food-types` | CRUD danh mục (food types) |
| `orderApi` | `GET /api/orders/history`, `POST /api/orders`, `POST /api/orders/:id/cancel`, `GET /api/orders/store/:storeId`, `PUT /api/orders/:id/status` | Quản lý đơn hàng |
| `storeApi` | `GET /api/stores`, `GET /api/stores/:id`, `GET /api/stores/tenant/:id` | Đọc thông tin cửa hàng |
| `userApi` | `POST /api/users/login`, `POST /api/users/register`, `GET /api/users/profile`, `PUT /api/users/edit-profile`, `POST /api/users/register-manager`, cart CRUD, sign-out | Quản lý user + auth |
| `managerApi` | `GET /api/orders/store/:storeId`, `PUT /api/orders/:id/status` | API riêng cho manager |
| `addressApi` | `GET/POST/PUT/DELETE /api/addresses`, `GET /api/addresses/default`, `PUT /api/addresses/:id/default` | CRUD địa chỉ giao hàng |
| `favoriteApi` | `GET/POST/DELETE /api/favorites/stores/:id`, `GET/POST/DELETE /api/favorites/foods/:id` | Yêu thích cửa hàng + món ăn |
| `reviewApi` | `POST /api/reviews`, `GET /api/reviews/my-reviews`, `GET /api/reviews/food/:id`, `GET /api/reviews/store/:id`, `POST /api/reviews/:id/reply`, `DELETE /api/reviews/:id` | Đánh giá + phản hồi |
| `walletApi` | `GET /api/wallet/balance`, `POST /api/wallet/deposit`, `GET /api/wallet/transactions`, `GET /api/wallet/check-balance/:amount` | Ví điện tử |
| `notificationApi` | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id` | Thông báo |
| `tenantApi` | `GET/POST/PUT/DELETE /api/tenants` | CRUD tenant |
| `voucherApi` | `GET /api/vouchers/active`, `GET /api/vouchers/available`, `GET /api/vouchers/code/:code`, `POST /api/vouchers/apply`, `GET/POST/PUT/DELETE /api/vouchers/:id` | Voucher/mã giảm giá |
| `adminApi` | `GET /api/users/pending-stores`, `PUT /api/users/approve-store/:id`, `PUT /api/users/lock/:id`, `GET /api/stores`, `GET /api/food-types` | API riêng cho admin |

### Login Flow đặc biệt
```
1. POST /api/users/login
2. Check response body: string token OR data.token OR data.accessToken
3. Check response headers: authorization, x-token, token
4. Nếu tìm được token → lưu localStorage
5. Nếu không tìm được → BYPASS MODE: tạo fake token từ user ID
6. Parse JWT để lấy roleName → redirect theo role
```

---

## 8. Hệ thống Type/Interface

### File: `src/types/swagger.ts` (547 dòng)

### Enums

| Enum | Giá trị | Mô tả |
|------|---------|-------|
| `RoleId` | User=1, Manager=2, Admin=3 | Vai trò người dùng |
| `OrderStatus` | Pending=0, Confirmed=1, Preparing=2, Ready=3, Delivering=4, Completed=5, Cancelled=6 | Trạng thái đơn hàng |
| `PaymentMethod` | Wallet=1, CashOnDelivery=2, MoMo=3 | Phương thức thanh toán |
| `PaymentStatus` | Unpaid=0, Paid=1, Refunded=2, Failed=3 | Trạng thái thanh toán |
| `VoucherType` | Percent=1, FixedAmount=2, FreeShipping=3 | Loại voucher |
| `TransactionType` | Deposit=1, Payment=2, Refund=3, Withdrawal=4, Bonus=5 | Loại giao dịch ví |
| `TransactionStatus` | Pending=0, Completed=1, Failed=2, Cancelled=3 | Trạng thái giao dịch |
| `NotificationType` | System=0, Order=1, Promotion=2, Wallet=3, Review=4, Feature=5 | Loại thông báo |

### Lookup Maps
- `OrderStatusName` — Map number → tên trạng thái đơn hàng
- `PaymentMethodName` — Map number → tên phương thức thanh toán
- `VoucherTypeName` — Map number → tên loại voucher

### Interfaces chính

#### User
| Interface | Mô tả |
|-----------|-------|
| `LoginRequest` | `{ email, password }` |
| `RegisterRequest` | `{ name, email, phone, password }` |
| `UserDto` / `UserProfileDto` | `{ id, name, email, phone, roleId, roleName, tempCartMeta? }` |
| `EditProfileRequest` | `{ name, email, phone }` |
| `RegisterManagerRequest` | `{ storeName, description?, address, latitude?, longitude?, phone?, openTime?, closeTime?, imageSrc? }` |

#### Store
| Interface | Mô tả |
|-----------|-------|
| `StoreDto` | `{ id, tenantId, name, description, address, latitude, longitude, imageSrc, phone, openTime, closeTime, isOpen, isActive, managerId, isApproved }` |
| `StoreDetailDto` | extends `StoreDto` + `foodStores: FoodStoreDto[]` |

#### Food
| Interface | Mô tả |
|-----------|-------|
| `FoodDto` | `{ id, name, foodTypeId, foodTypeName, imageSrc, isAvailable }` |
| `FoodStoreDto` | `{ id(Guid), storeId, store?, foodId, food?, sizeId?, size?, price, isAvailable? }` |
| `FoodStoreCreateRequest` | `{ id, storeId, foodId, sizeId?, price, isAvailable }` |
| `FoodStoreUpdateRequest` | `{ id, price, sizeId?, isAvailable }` |
| `FoodTypeDto` | `{ id, name, imgSrc? }` |

#### Order
| Interface | Mô tả |
|-----------|-------|
| `OrderDto` | `{ id, userId, storeId, storeName, status, paymentMethod, subTotal, deliveryFee, discount, total, items[], ... }` |
| `OrderItemDto` | `{ orderId, foodStoreId, foodId, foodName, foodImage, sizeId?, sizeName?, price, quantity, total }` |
| `OrderCreateRequest` | `{ storeId, paymentMethod, deliveryAddress, recipientPhone, recipientName, note?, deliveryFee, discount, items[] }` |
| `CancelOrderRequest` | `{ reason }` |
| `UpdateOrderStatusRequest` | `{ status, reason? }` |

#### Wallet
| Interface | Mô tả |
|-----------|-------|
| `WalletResponse` | `{ userId, userName, balance, formattedBalance, lastUpdated }` |
| `DepositRequest` | `{ amount, note? }` |
| `PaymentResponse` | `{ orderId, amount, payUrl, deepLink?, qrCodeUrl?, message, success }` |
| `WalletTransactionDto` | `{ id, transactionType, amount, balanceBefore, balanceAfter, status, statusName, description?, createdAt, ... }` |

#### Address
| Interface | Mô tả |
|-----------|-------|
| `DeliveryAddressDto` | `{ id, userId, label?, recipientName, phone, address, addressDetail?, latitude?, longitude?, isDefault, createdAt }` |
| `AddressRequest` | `{ label?, recipientName, phone, address, addressDetail?, latitude?, longitude?, isDefault? }` |

#### Review
| Interface | Mô tả |
|-----------|-------|
| `ReviewDto` | `{ id, userId, userName, orderId, storeId, storeName?, foodId?, rating, comment?, images?, storeReply?, createdAt }` |
| `ReviewCreateRequest` | `{ orderId, storeId, foodId?, rating, comment?, images? }` |

#### Voucher
| Interface | Mô tả |
|-----------|-------|
| `VoucherDto` | `{ id, code, name, type, value, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, usedCount, isActive, storeId?, ... }` |
| `VoucherCreateRequest` | `{ code, name, type, value, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, usageLimitPerUser, storeId? }` |
| `VoucherApplyRequest` | `{ code, orderAmount, storeId? }` |

#### Khác
| Interface | Mô tả |
|-----------|-------|
| `TenantDto` | `{ id, name, createTime?, updateTime? }` |
| `NotificationDto` | `{ id, userId, title, content, type, isRead, createdAt, ... }` |
| `FavoriteDto` | `{ id, userId, storeId?, storeName?, foodId?, foodName?, createdAt }` |
| `CartDto` | `{ orderList: Record<string, CartItemDto> }` |
| `CartItemDto` | `{ quantity, foodStore? }` |

---

## 9. UI Components dùng chung

### File: `src/components/ui/`

| Component | Props | Mô tả |
|-----------|-------|-------|
| `Badge` | `variant: 'default' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `children` | Badge label với màu sắc theo variant |
| `Button` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg'`, `loading`, `disabled` | Button đa dạng style + loading spinner |
| `Card` | `className`, `children` | Container card với rounded corners + shadow |
| `Input` | `label`, `error`, `type`, `...inputProps` | Input field với label phía trên và error message phía dưới |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Modal overlay với title bar + close button, click outside to close |

---

## 10. Utilities & Helpers

### `src/utils/auth.ts`

```typescript
export const authStorage = {
  getToken()      // Lấy JWT từ localStorage
  getRole()       // Lấy roleName từ localStorage
  setToken(token) // Lưu token
  setRole(role)   // Lưu role
  clear()         // Xóa tất cả auth data
  getUserFromToken() // Parse JWT payload
}
```

- **parseJwt()**: Decode base64 JWT payload thành object
- **RoleName type**: `'Admin' | 'Manager' | 'Customer'`

### `src/utils/roleRedirect.ts`
- Xác định đường dẫn redirect dựa trên role sau đăng nhập
- Admin → `/admin`, Manager → `/manager`, Customer → `/`

### `src/lib/utils.ts`
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
- Utility kết hợp `clsx` + `tailwind-merge` để merge Tailwind classes thông minh

---

## 11. Tính năng Customer

### 11.1 LoginPage (`features/customer/LoginPage.tsx`)
- **Form**: Email + Password
- **Flow**: Gọi `userApi.login()` → nhận token → parse JWT lấy `roleName` → lưu localStorage → redirect theo role
- **Bypass mode**: Nếu backend không trả token, tạo fake session token
- **Giao diện**: Split layout — form trái, ảnh minh họa phải

### 11.2 RegisterPage (`features/customer/RegisterPage.tsx`)
- **Form**: Name, Email, Phone, Password, Confirm Password
- **Validation**: Client-side (required fields, password match)
- **API**: `userApi.register()` → redirect `/login`

### 11.3 HomePage (`features/customer/home/HomePage.tsx`)
- **Hero section**: Carousel auto-slide với gradient overlays
- **Danh mục**: Grid hiển thị food types từ `foodTypeApi.getAll()`
- **Cửa hàng nổi bật**: Cards hiển thị stores từ `storeApi.getAll()`
- **Animation**: Framer Motion fade-in effects

### 11.4 StoresPage (`features/customer/stores/StoresPage.tsx`)
- **Listing**: Tất cả cửa hàng từ `storeApi.getAll()`
- **Search + Filter**: Lọc theo tên, khoảng cách
- **Cards**: Hiển thị ảnh, tên, địa chỉ, trạng thái mở/đóng

### 11.5 StoreDetailPage (`features/customer/stores/StoreDetailPage.tsx`)
- **Chi tiết cửa hàng**: Thông tin, ảnh, giờ mở cửa
- **Menu**: Danh sách food-stores grouped theo food type
- **Reviews**: Hiển thị đánh giá từ `reviewApi.getByStore()`
- **Yêu thích**: Toggle favorite store

### 11.6 FoodsPage (`features/customer/foods/FoodsPage.tsx`)
- **Tất cả món ăn**: Grid cards từ `foodStoreApi.getAll()`
- **Filter**: Theo food type, tìm kiếm theo tên
- **Actions**: Thêm yêu thích, xem chi tiết

### 11.7 FoodDetailPage (`features/customer/foods/FoodDetailPage.tsx`)
- **Chi tiết món**: Ảnh, tên, giá, mô tả
- **Reviews**: Đánh giá từ `reviewApi.getByFood()`
- **Add to cart**: Chọn số lượng → thêm vào giỏ

### 11.8 ProductDetail (`features/customer/product/ProductDetail.tsx`)
- **Detail page**: Chi tiết food-store item
- **Thêm giỏ hàng**: Gọi `userApi.getCart()` → cập nhật quantity → `userApi.updateCart()`
- **Toast**: Thông báo thành công khi thêm

### 11.9 CartPage (`features/customer/cart/CartPage.tsx`)
- **Giỏ hàng**: Load từ `userApi.getCart()`, hiển thị items grouped theo store
- **Actions**: Tăng/giảm quantity, xóa item
- **Debounced sync**: Thay đổi quantity → debounce 500ms → `userApi.updateCart()`
- **Voucher**: Nhập mã giảm giá → `voucherApi.apply()`
- **Checkout**: Chọn payment method + address → `orderApi.create()`
- **Payment methods**: Wallet, COD, MoMo
- **Tính tiền**: subTotal + deliveryFee - discount = total

### 11.10 WalletPage (`features/customer/wallet/WalletPage.tsx`)
- **Số dư ví**: Từ `walletApi.getBalance()`
- **Nạp tiền**: Form nhập số tiền → `walletApi.deposit()` → redirect MoMo payUrl
- **Lịch sử**: Table giao dịch từ `walletApi.getTransactions()`
- **Data extraction**: `res.data.transactions` (API trả `{ transactions: [], pageNumber, pageSize }`)

### 11.11 OrderHistoryPage (`features/customer/orders/OrderHistoryPage.tsx`)
- **6 tab trạng thái**: All, Pending, Confirmed, Preparing, Delivering, Completed, Cancelled
- **Danh sách**: Từ `orderApi.getHistory({ status })`
- **Cards**: Hiển thị store name, ngày, tổng tiền, số items, trạng thái

### 11.12 OrderDetailPage (`features/customer/orders/OrderDetailPage.tsx`)
- **Chi tiết đơn**: Thông tin đơn hàng + danh sách items
- **Hủy đơn**: Nếu status = Pending → `orderApi.cancel()` với reason
- **Đánh giá**: Nếu status = Completed → kiểm tra `reviewApi.canReview()` → hiện form review
- **Timeline**: Hiển thị lịch sử trạng thái (confirmedAt, completedAt, cancelledAt)

### 11.13 AddressPage (`features/customer/address/AddressPage.tsx`)
- **CRUD**: Danh sách địa chỉ từ `addressApi.getAll()`
- **Thêm/Sửa**: Modal form với label, recipientName, phone, address, addressDetail
- **Xóa**: Confirm dialog → `addressApi.delete()`
- **Mặc định**: Toggle default address → `addressApi.setDefault()`

### 11.14 FavoritesPage (`features/customer/favorites/FavoritesPage.tsx`)
- **2 tab**: Cửa hàng yêu thích + Món ăn yêu thích
- **API**: `favoriteApi.getStores()`, `favoriteApi.getFoods()`
- **Actions**: Xóa khỏi yêu thích

### 11.15 MyReviewsPage (`features/customer/reviews/MyReviewsPage.tsx`)
- **Đánh giá của tôi**: Từ `reviewApi.getMyReviews()`
- **Hiển thị**: Rating stars, comment, store reply nếu có
- **Xóa**: `reviewApi.delete()` với confirm

### 11.16 NotificationsPage (`features/customer/notifications/NotificationsPage.tsx`)
- **Danh sách**: Từ `notificationApi.getAll()`
- **Actions**: Đánh dấu đã đọc, đánh dấu tất cả, xóa
- **Badge**: Số thông báo chưa đọc

### 11.17 Profile (`features/customer/pages/Profile.tsx`)
- **Thông tin**: Từ `userApi.profile()`
- **Chỉnh sửa**: Modal edit với name, email, phone → `userApi.editProfile()`
- **Bypass mode**: Nếu đang dùng session bypass, hiển thị stored user data

### 11.18 CustomerLayout (`features/customer/layout/CustomerLayout.tsx`)
- **Navbar**: Logo, navigation links, search, user menu
- **Responsive**: Hamburger menu trên mobile
- **Cart icon**: Badge hiển thị số items trong giỏ
- **User dropdown**: Profile, Orders, Wallet, Logout

---

## 12. Tính năng Admin

### 12.1 AdminLayout (`features/admin/layout/AdminLayout.tsx`)
- **Sidebar**: Dark theme, navigation links với icons
- **Menu items**: Dashboard, Users, Stores, Categories, Vouchers, Transactions, Settings
- **Responsive**: Collapsible sidebar
- **Header**: User info + logout

### 12.2 Dashboard (`features/admin/dashboard/Dashboard.tsx`)
- **Stats cards**: Tổng users, stores, orders, revenue
- **Charts**: Revenue chart (Recharts BarChart/LineChart)
- **Data**: Từ API endpoints tổng hợp

### 12.3 UserManagement (`features/admin/users/UserManagement.tsx`)
- **Bảng users**: Từ API hiển thị name, email, phone, role, status
- **Search + Filter**: Tìm theo tên/email, lọc theo role
- **Khóa tài khoản**: `adminApi.lockUser(userId)`
- **Pagination**: Client-side

### 12.4 StoreManagement (`features/admin/stores/StoreManagement.tsx`)
- **2 tab**: All Stores + Pending Approval
- **All Stores**: Từ `adminApi.getStores()`
- **Pending**: Từ `adminApi.getPendingStores()` → `adminApi.approveStore()`
- **Cards**: Hiển thị thông tin cửa hàng + trạng thái

### 12.5 CategoryManagement (`features/admin/categories/CategoryManagement.tsx`)
- **CRUD**: Food types từ `foodTypeApi.getAll()`
- **Thêm/Sửa**: Modal form với name, imgSrc
- **Xóa**: `foodTypeApi.delete()` với confirm
- **Grid**: Cards hiển thị icon + tên danh mục

### 12.6 VoucherManagement (`features/admin/vouchers/VoucherManagement.tsx`)
- **CRUD**: Vouchers từ `voucherApi.getActive()`
- **Thêm**: Form với code, name, type, value, dates, limits
- **Sửa**: Modal pre-filled với data hiện tại
- **Xóa**: `voucherApi.delete()` confirm
- **Badges**: Hiển thị type (Percent/Fixed/FreeShipping), active status

### 12.7 Transactions (`features/admin/transactions/Transactions.tsx`)
- **Bảng giao dịch**: Từ `walletApi.getTransactions()`
- **Data extraction**: `res.data.transactions` (paginated response)
- **Columns**: User, type, amount, before/after balance, status, date
- **Color coding**: Deposit=green, Payment=red, Refund=blue, etc.

### 12.8 Settings (`features/admin/settings/Settings.tsx`)
- **Placeholder**: Trang cài đặt hệ thống (chưa triển khai đầy đủ)

---

## 13. Tính năng Manager

### 13.1 ManagerLayout (`features/manager/layout/ManagerLayout.tsx`)
- **Sidebar**: Dark theme, navigation links
- **Menu items**: Orders, Menu, Reviews, Tenants, Store Profile
- **Store ID**: Lấy từ JWT token payload (`storeId` claim)

### 13.2 OrderDashboard (`features/manager/orders/OrderDashboard.tsx`)
- **Realtime**: Auto-poll mỗi 15 giây
- **Kanban view**: Columns theo trạng thái (Pending → Confirmed → Preparing → Ready → Delivering → Completed)
- **Actions**: Accept order, Start preparing, Mark ready, Start delivering, Complete
- **API**: `orderApi.getStoreOrders(storeId)` + `orderApi.updateStatus()`
- **Sound/Visual**: Highlight đơn mới

### 13.3 MenuManagement (`features/manager/menu/MenuManagement.tsx`)
- **Category sidebar**: Danh mục food types bên trái
- **Menu items**: Food-stores của cửa hàng từ `foodStoreApi.getMyStore()`
- **CRUD**: Thêm food-store item → `foodStoreApi.create()`, sửa giá/availability, xóa
- **Filter**: Theo danh mục đang chọn

### 13.4 RevenueAnalytics (`features/manager/dashboard/RevenueAnalytics.tsx`)
- **Charts**: Biểu đồ doanh thu (Recharts)
- **Stats**: Tổng doanh thu, đơn hàng, khách hàng
- **Note**: Phần lớn dùng static/mock data

### 13.5 StoreProfile (`features/manager/profile/StoreProfile.tsx`)
- **Thông tin cửa hàng**: Từ `storeApi.getById(storeId)`
- **Hiển thị**: Tên, địa chỉ, giờ mở cửa, trạng thái, ảnh
- **StoreId**: Parse từ JWT token

### 13.6 ManagerReviews (`features/manager/reviews/ManagerReviews.tsx`)
- **Đánh giá cửa hàng**: Từ `reviewApi.getByStore(storeId)`
- **Phản hồi**: Form reply → `reviewApi.reply()`
- **Hiển thị**: Rating stars, comment, user info, ngày

### 13.7 TenantManagement (`features/manager/tenants/TenantManagement.tsx`)
- **CRUD**: Tenants từ `tenantApi.getAll()`
- **Thêm/Sửa**: Modal form với tên tenant
- **Xóa**: `tenantApi.delete()` confirm

---

## 14. Xác thực & Phân quyền

### Flow đăng nhập

```
┌──────────────┐     POST /api/users/login     ┌──────────────┐
│   LoginPage  │ ──────────────────────────────>│   Backend    │
│              │<──────────────────────────────-│              │
└──────┬───────┘   Response: token/userData     └──────────────┘
       │
       ▼
┌──────────────┐
│ Parse JWT    │ → Extract: roleName, storeId, userId
│ Save to      │ → localStorage: token, roleName
│ localStorage │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redirect     │ → Admin: /admin
│ by Role      │ → Manager: /manager
│              │ → Customer: /
└──────────────┘
```

### Lưu trữ Auth
| Key | Giá trị | Mô tả |
|-----|---------|-------|
| `token` | JWT string | Bearer token cho API requests |
| `roleName` | `Admin` / `Manager` / `Customer` | Vai trò parsed từ JWT |
| `bypass_user` | JSON string | User data fallback khi không có token (bypass mode) |

### JWT Payload (expected fields)
```json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "userId",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin|Manager|User",
  "storeId": "123",
  "exp": 1234567890
}
```

### Bypass Mode
- Khi backend không trả token nhưng trả user data
- Tạo fake token: `session-bypass-token-{userId}-{timestamp}`
- Profile fetches: Fallback về stored user data thay vì gọi API

---

## 15. Các pattern kiến trúc

### 15.1 Response Unwrapping
```
Backend trả: { result: { ... }, message: "Success" }
                        ↓ Interceptor
Frontend nhận: res.data = { ... }  (đã unwrap .result)
```

Đối với paginated responses:
```
Backend trả: { result: { transactions: [...], pageNumber: 1, pageSize: 10 } }
                        ↓ Interceptor  
Frontend: res.data = { transactions: [...], pageNumber: 1, pageSize: 10 }
→ Extract: res.data.transactions
```

### 15.2 Server-side Cart
```
GET  /api/users/temp-data        → Load giỏ hàng
PATCH /api/users/temp-data       → Cập nhật giỏ hàng  
DELETE /api/users/temp-data      → Xóa giỏ hàng

Format: { orderList: { [foodStoreId]: { quantity, foodStore } } }
```
- Giỏ hàng lưu trên server dưới dạng `tempCartMeta` (JSON string)
- Client debounce 500ms trước khi sync lên server
- Giỏ hàng chỉ chứa items từ 1 cửa hàng (khác store → cảnh báo)

### 15.3 State Management Pattern
```typescript
// Mọi page dùng local state
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  setLoading(true);
  try {
    const res = await someApi.getAll();
    setData(res.data);
  } catch (err) {
    setError('...');
  } finally {
    setLoading(false);
  }
};
```

### 15.4 Toast Notifications  
```typescript
import { toast } from 'sonner';

toast.success('Thành công!');
toast.error('Có lỗi xảy ra');
```

### 15.5 CSS/Styling Pattern
- **Tailwind CSS utility classes** cho toàn bộ styling
- **Brand color**: Orange palette (`bg-orange-500`, `text-orange-600`)
- **Dark sidebar**: Admin/Manager layouts dùng `bg-gray-800/900`
- **Responsive**: `md:`, `lg:` breakpoints
- **cn() utility**: Merge conditional classes

### 15.6 Giao diện tiếng Việt
- UI chủ yếu bằng tiếng Việt
- Labels, messages, placeholders đều tiếng Việt
- Định dạng tiền: `toLocaleString('vi-VN')` + ` đ`
- Định dạng ngày: `toLocaleDateString('vi-VN')`

### 15.7 Error Handling Pattern
```typescript
try {
  // API call
} catch (err: any) {
  const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
  toast.error(message);
  // OR setError(message);
}
```

### 15.8 Loading States
- Mọi page có `loading` state
- Hiển thị spinner/skeleton khi đang load
- Disable buttons khi đang submit

---

## Phụ lục: Danh sách tất cả files

| # | File Path | Loại | Dòng code (ước tính) |
|---|-----------|------|---------------------|
| 1 | `src/main.tsx` | Entry point | ~15 |
| 2 | `src/App.tsx` | Router | ~105 |
| 3 | `src/index.css` | Styles | ~50 |
| 4 | `src/api/api.ts` | API layer | ~280 |
| 5 | `src/types/swagger.ts` | Types | ~547 |
| 6 | `src/types/cart.ts` | Types | ~15 |
| 7 | `src/types/store.ts` | Types | ~15 |
| 8 | `src/types/user.ts` | Types | ~15 |
| 9 | `src/lib/utils.ts` | Utility | ~5 |
| 10 | `src/utils/auth.ts` | Auth helper | ~45 |
| 11 | `src/utils/roleRedirect.ts` | Redirect helper | ~15 |
| 12 | `src/routes/RequireRole.tsx` | Route guard | ~30 |
| 13 | `src/components/ui/Badge.tsx` | UI component | ~30 |
| 14 | `src/components/ui/Button.tsx` | UI component | ~50 |
| 15 | `src/components/ui/Card.tsx` | UI component | ~15 |
| 16 | `src/components/ui/Input.tsx` | UI component | ~30 |
| 17 | `src/components/ui/Modal.tsx` | UI component | ~40 |
| 18 | `src/features/customer/LoginPage.tsx` | Page | ~200 |
| 19 | `src/features/customer/RegisterPage.tsx` | Page | ~150 |
| 20 | `src/features/customer/home/HomePage.tsx` | Page | ~300 |
| 21 | `src/features/customer/stores/StoresPage.tsx` | Page | ~150 |
| 22 | `src/features/customer/stores/StoreDetailPage.tsx` | Page | ~250 |
| 23 | `src/features/customer/foods/FoodsPage.tsx` | Page | ~200 |
| 24 | `src/features/customer/foods/FoodDetailPage.tsx` | Page | ~200 |
| 25 | `src/features/customer/product/ProductDetail.tsx` | Page | ~200 |
| 26 | `src/features/customer/cart/CartPage.tsx` | Page | ~400 |
| 27 | `src/features/customer/wallet/WalletPage.tsx` | Page | ~300 |
| 28 | `src/features/customer/orders/OrderHistoryPage.tsx` | Page | ~250 |
| 29 | `src/features/customer/orders/OrderDetailPage.tsx` | Page | ~350 |
| 30 | `src/features/customer/address/AddressPage.tsx` | Page | ~300 |
| 31 | `src/features/customer/favorites/FavoritesPage.tsx` | Page | ~200 |
| 32 | `src/features/customer/reviews/MyReviewsPage.tsx` | Page | ~200 |
| 33 | `src/features/customer/notifications/NotificationsPage.tsx` | Page | ~200 |
| 34 | `src/features/customer/pages/Profile.tsx` | Page | ~200 |
| 35 | `src/features/customer/layout/CustomerLayout.tsx` | Layout | ~200 |
| 36 | `src/features/customer/components/Layout.tsx` | Component | ~50 |
| 37 | `src/features/customer/components/Cart.tsx` | Component | ~100 |
| 38 | `src/features/customer/components/SearchBar.tsx` | Component | ~50 |
| 39 | `src/features/admin/layout/AdminLayout.tsx` | Layout | ~200 |
| 40 | `src/features/admin/dashboard/Dashboard.tsx` | Page | ~300 |
| 41 | `src/features/admin/users/UserManagement.tsx` | Page | ~300 |
| 42 | `src/features/admin/stores/StoreManagement.tsx` | Page | ~300 |
| 43 | `src/features/admin/categories/CategoryManagement.tsx` | Page | ~250 |
| 44 | `src/features/admin/vouchers/VoucherManagement.tsx` | Page | ~400 |
| 45 | `src/features/admin/transactions/Transactions.tsx` | Page | ~250 |
| 46 | `src/features/admin/settings/Settings.tsx` | Page | ~50 |
| 47 | `src/features/manager/layout/ManagerLayout.tsx` | Layout | ~200 |
| 48 | `src/features/manager/orders/OrderDashboard.tsx` | Page | ~400 |
| 49 | `src/features/manager/menu/MenuManagement.tsx` | Page | ~350 |
| 50 | `src/features/manager/dashboard/RevenueAnalytics.tsx` | Page | ~250 |
| 51 | `src/features/manager/profile/StoreProfile.tsx` | Page | ~200 |
| 52 | `src/features/manager/reviews/ManagerReviews.tsx` | Page | ~250 |
| 53 | `src/features/manager/tenants/TenantManagement.tsx` | Page | ~250 |

**Tổng**: ~53 source files, ~7,500+ dòng code (ước tính)

---

*Tài liệu được tạo tự động bởi AI dựa trên phân tích toàn bộ source code.*
