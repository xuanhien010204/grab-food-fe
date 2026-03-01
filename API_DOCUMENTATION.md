# 🍔 Food Ordering API Documentation

> **Base URL:** `http://localhost:5204/api`
>
> **Authentication:** Cookie-based (`auth_cookie`). Gửi request `POST /api/users/login` để nhận cookie, trình duyệt tự đính kèm cookie cho các request tiếp theo.
>
> **OpenAPI UI:** `http://localhost:5204/scalar/v1`

---

## 📌 Response Format chung

Mọi API đều trả về cùng format:

```json
{
  "message": "string",
  "result": object | null
}
```

| Field     | Type     | Mô tả                                           |
|-----------|----------|--------------------------------------------------|
| `message` | `string` | Thông báo kết quả                                |
| `result`  | `object` | Dữ liệu trả về (chỉ có khi API trả dữ liệu) |

---

## 📌 Enum Values

### RoleId
| Value | Name      |
|-------|-----------|
| 1     | User      |
| 2     | Manager   |
| 3     | Admin     |

### OrderStatus
| Value | Name        |
|-------|-------------|
| 0     | Pending     |
| 1     | Confirmed   |
| 2     | Preparing   |
| 3     | Ready       |
| 4     | Delivering  |
| 5     | Completed   |
| 6     | Cancelled   |

### PaymentMethod
| Value | Name           |
|-------|----------------|
| 1     | Wallet         |
| 2     | CashOnDelivery |
| 3     | MoMo           |

### PaymentStatus
| Value | Name     |
|-------|----------|
| 0     | Unpaid   |
| 1     | Paid     |
| 2     | Refunded |
| 3     | Failed   |

### VoucherType
| Value | Name         |
|-------|--------------|
| 1     | Percent      |
| 2     | FixedAmount  |
| 3     | FreeShipping |

### TransactionType
| Value | Name       |
|-------|------------|
| 1     | Deposit    |
| 2     | Payment    |
| 3     | Refund     |
| 4     | Withdrawal |
| 5     | Bonus      |

### TransactionStatus
| Value | Name      |
|-------|-----------|
| 0     | Pending   |
| 1     | Completed |
| 2     | Failed    |
| 3     | Cancelled |

### NotificationType
| Value | Name      |
|-------|-----------|
| 0     | System    |
| 1     | Order     |
| 2     | Promotion |
| 3     | Wallet    |
| 4     | Review    |
| 5     | Feature   |

---

# 🔓 PUBLIC APIs (Không cần đăng nhập)

## 1. Users – Đăng nhập / Đăng ký

### `POST /api/users/login`
Đăng nhập, nhận cookie xác thực.

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required)"
}
```

**Response `result`:** `UserDto`
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "a@gmail.com",
  "phone": "0901234567",
  "roleId": 1,
  "roleName": "User",
  "tempCartMeta": "string | null"
}
```

---

### `POST /api/users/register`
Đăng ký tài khoản mới (role mặc định = User).

**Request Body:**
```json
{
  "name": "string (required, max 256)",
  "email": "string (required, max 256, email format)",
  "phone": "string (required, max 15)",
  "password": "string (required)"
}
```

**Response:** Chỉ có `message`.

---

## 2. Stores – Danh sách cửa hàng

### `GET /api/stores`
Lấy tất cả cửa hàng đã được duyệt.

**Response `result`:** `StoreDto[]`
```json
[
  {
    "id": 1,
    "tenantId": 1,
    "name": "Quán ABC",
    "description": "Mô tả",
    "address": "123 Đường XYZ",
    "latitude": "10.762622",
    "longitude": "106.660172",
    "imageSrc": "https://...",
    "phone": "0901234567",
    "openTime": "08:00",
    "closeTime": "22:00",
    "isOpen": true,
    "isActive": true,
    "managerId": 5,
    "isApproved": true
  }
]
```

---

### `GET /api/stores/tenant/{tenantId}`
Lấy cửa hàng theo tenant (khu vực).

| Param      | Type  | Mô tả    |
|------------|-------|----------|
| `tenantId` | `int` | ID tenant |

**Response `result`:** `StoreDto[]` (giống trên)

---

### `GET /api/stores/{id}`
Lấy chi tiết cửa hàng kèm danh sách món ăn.

| Param | Type   | Mô tả     |
|-------|--------|-----------|
| `id`  | `long` | ID store  |

**Response `result`:** `StoreDetailDto`
```json
{
  "id": 1,
  "tenantId": 1,
  "name": "Quán ABC",
  "description": "...",
  "address": "...",
  "latitude": "...",
  "longitude": "...",
  "imageSrc": "...",
  "phone": "...",
  "openTime": "08:00",
  "closeTime": "22:00",
  "isOpen": true,
  "isActive": true,
  "managerId": 5,
  "isApproved": true,
  "foodStores": [
    {
      "id": "guid",
      "storeId": 1,
      "store": null,
      "foodId": 10,
      "food": {
        "id": 10,
        "name": "Phở bò",
        "foodTypeId": 1,
        "foodTypeName": "Món nước",
        "imageSrc": "https://...",
        "isAvailable": true
      },
      "sizeId": 1,
      "size": null,
      "price": 45000,
      "isAvailable": true
    }
  ]
}
```

---

## 3. Food Stores – Menu món ăn

### `GET /api/food-stores`
Lấy tất cả food store (lọc theo tên, loại món).

| Query Param  | Type     | Mô tả                  |
|-------------|----------|------------------------|
| `foodName`  | `string` | Tìm theo tên món (optional) |
| `foodTypeId`| `int`    | Lọc theo loại món (optional) |

**Response `result`:** `FoodStoreDto[]`
```json
[
  {
    "id": "guid",
    "storeId": 1,
    "store": { "id": 1, "name": "Quán ABC", ... },
    "foodId": 10,
    "food": { "id": 10, "name": "Phở bò", "foodTypeId": 1, "foodTypeName": "Món nước", "imageSrc": "...", "isAvailable": true },
    "sizeId": 1,
    "size": null,
    "price": 45000,
    "isAvailable": true
  }
]
```

---

## 4. Food Types – Loại món ăn

### `GET /api/food-types`
Lấy tất cả loại món.

**Response `result`:** `FoodTypeDto[]`
```json
[
  { "id": 1, "name": "Món nước", "imgSrc": "https://..." },
  { "id": 2, "name": "Cơm", "imgSrc": "https://..." }
]
```

---

### `GET /api/food-types/{id}`
Lấy loại món theo ID.

---

## 5. Tenants – Khu vực

### `GET /api/tenants`
Lấy tất cả tenant.

**Response `result`:** `TenantDto[]`
```json
[
  { "id": 1, "name": "HCM", "createTime": "2025-01-01T00:00:00", "updateTime": null }
]
```

---

### `GET /api/tenants/{id}`
Lấy tenant theo ID.

---

## 6. Vouchers – Mã giảm giá (Public)

### `GET /api/vouchers/{id}`
Lấy voucher theo ID (Guid).

**Response `result`:** `VoucherDto`
```json
{
  "id": "guid",
  "code": "SALE10",
  "name": "Giảm 10%",
  "description": "...",
  "type": 1,
  "typeName": "Percent",
  "value": 10,
  "minOrderAmount": 50000,
  "maxDiscount": 20000,
  "startDate": "2025-01-01T00:00:00",
  "endDate": "2025-12-31T23:59:59",
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "usedCount": 5,
  "isActive": true,
  "storeId": null,
  "storeName": null,
  "isValid": true,
  "discountText": "Giảm 10%"
}
```

---

### `GET /api/vouchers/code/{code}`
Lấy voucher theo mã code.

---

### `GET /api/vouchers/active`
Lấy các voucher đang hoạt động.

| Query Param | Type   | Mô tả                       |
|------------|--------|------------------------------|
| `storeId`  | `long` | Lọc theo store (optional)    |

---

## 7. Reviews – Đánh giá (Public)

### `GET /api/reviews/{id}`
Lấy đánh giá theo ID (Guid).

**Response `result`:** `ReviewDto`
```json
{
  "id": "guid",
  "userId": 1,
  "userName": "Nguyễn Văn A",
  "userAvatar": "https://...",
  "orderId": "guid",
  "storeId": 1,
  "storeName": "Quán ABC",
  "foodId": null,
  "foodName": null,
  "rating": 5,
  "comment": "Rất ngon!",
  "images": ["https://..."],
  "storeReply": "Cảm ơn bạn!",
  "storeReplyAt": "2025-01-15T10:00:00",
  "createdAt": "2025-01-14T10:00:00"
}
```

---

### `GET /api/reviews/store/{storeId}`
Lấy đánh giá của cửa hàng (có phân trang).

| Query Param  | Type  | Default | Mô tả          |
|-------------|-------|---------|-----------------|
| `pageNumber`| `int` | 1       | Trang hiện tại  |
| `pageSize`  | `int` | 20      | Số item/trang   |

**Response `result`:**
```json
{
  "stats": { ... },
  "reviews": [ ReviewDto, ... ],
  "pageNumber": 1,
  "pageSize": 20
}
```

---

### `GET /api/reviews/food/{foodId}`
Lấy đánh giá theo món ăn (có phân trang).

| Query Param  | Type  | Default |
|-------------|-------|---------|
| `pageNumber`| `int` | 1       |
| `pageSize`  | `int` | 20      |

---

## 8. Wallet – MoMo Callback (Public webhook)

### `POST /api/wallet/momo/ipn`
MoMo IPN webhook (hệ thống gọi, frontend không cần gọi).

### `GET /api/wallet/momo/return`
MoMo redirect sau thanh toán.

| Query Param  | Type     | Mô tả               |
|-------------|----------|----------------------|
| `orderId`   | `string` | Mã đơn hàng MoMo    |
| `resultCode`| `int`    | 0 = Thành công       |
| `message`   | `string` | Thông báo từ MoMo    |

---

---

# 🔐 AUTHENTICATED USER APIs (Cần đăng nhập – Mọi role)

## 1. Users – Quản lý tài khoản

### `GET /api/users/profile`
Lấy thông tin cá nhân.

**Response `result`:** `UserDto`

---

### `GET /api/users/sign-out`
Đăng xuất (xoá cookie).

---

### `PUT /api/users/edit-profile`
Cập nhật thông tin cá nhân.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string"
}
```

---

### `PATCH /api/users/temp-data`
Lưu giỏ hàng tạm (TempCartMeta) – client gửi JSON cart.

**Request Body:**
```json
{
  "orderList": {
    "foodStoreId_1": { "quantity": 2, "foodStore": { ... } },
    "foodStoreId_2": { "quantity": 1, "foodStore": { ... } }
  }
}
```

---

### `DELETE /api/users/temp-data`
Xoá giỏ hàng tạm.

---

### `POST /api/users/register-manager`
Đăng ký làm chủ cửa hàng (chờ Admin duyệt).

**Request Body:**
```json
{
  "storeName": "string (required, max 256)",
  "description": "string (max 1000)",
  "address": "string (required, max 256)",
  "latitude": "string (max 20)",
  "longitude": "string (max 20)",
  "phone": "string (max 15)",
  "openTime": "string (max 10, vd: 08:00)",
  "closeTime": "string (max 10, vd: 22:00)",
  "imageSrc": "string (URL ảnh)"
}
```

**Response `result`:** `StoreDto`

---

## 2. Orders – Đặt hàng

### `POST /api/orders`
Tạo đơn hàng mới.

**Request Body:**
```json
{
  "storeId": 1,
  "paymentMethod": 1,
  "deliveryAddress": "string (required, max 500)",
  "recipientPhone": "string (required, phone format)",
  "recipientName": "string (required, max 100)",
  "note": "string (max 500, optional)",
  "deliveryFee": 15000,
  "discount": 0,
  "items": [
    { "foodStoreId": "guid (required)", "quantity": 2 },
    { "foodStoreId": "guid", "quantity": 1 }
  ]
}
```

**Response `result`:** `OrderDto`
```json
{
  "id": "guid",
  "userId": 1,
  "storeId": 1,
  "storeName": "Quán ABC",
  "storeAddress": "...",
  "storeImage": "...",
  "purchaseDate": "2025-06-01T10:00:00",
  "status": 0,
  "statusName": "Pending",
  "paymentMethod": 1,
  "paymentMethodName": "Wallet",
  "paymentStatus": 0,
  "paymentStatusName": "Unpaid",
  "subTotal": 90000,
  "deliveryFee": 15000,
  "discount": 0,
  "total": 105000,
  "deliveryAddress": "...",
  "recipientPhone": "...",
  "recipientName": "...",
  "note": "...",
  "confirmedAt": null,
  "completedAt": null,
  "cancelledAt": null,
  "cancelReason": null,
  "totalItems": 3,
  "items": [
    {
      "orderId": "guid",
      "foodStoreId": "guid",
      "foodId": 10,
      "foodName": "Phở bò",
      "foodImage": "...",
      "sizeId": 1,
      "sizeName": "Lớn",
      "price": 45000,
      "quantity": 2,
      "total": 90000
    }
  ]
}
```

---

### `GET /api/orders/{id}`
Xem chi tiết đơn hàng.

| Param | Type   | Mô tả       |
|-------|--------|-------------|
| `id`  | `Guid` | ID đơn hàng |

**Response `result`:** `OrderDto`

---

### `GET /api/orders/history`
Xem lịch sử đơn hàng cá nhân.

| Query Param | Type  | Mô tả                                   |
|------------|-------|------------------------------------------|
| `status`   | `int` | Lọc theo trạng thái (optional, enum OrderStatus) |

**Response `result`:** `OrderDto[]`

---

### `POST /api/orders/{id}/cancel`
Hủy đơn hàng.

| Param | Type   | Mô tả       |
|-------|--------|-------------|
| `id`  | `Guid` | ID đơn hàng |

**Request Body:**
```json
{
  "reason": "string"
}
```

---

### `GET /api/orders/store/{storeId}`
Xem đơn hàng của cửa hàng.

| Param      | Type   | Mô tả     |
|-----------|--------|-----------|
| `storeId` | `long` | ID store  |
| `status`  | `int`  | Query param, optional |

---

### `PUT /api/orders/{id}/status`
Cập nhật trạng thái đơn hàng.

**Request Body:**
```json
{
  "status": 1,
  "reason": "string (optional, required nếu cancel)"
}
```

---

### `POST /api/orders/legacy` ⚠️ Legacy
Tạo đơn hàng cũ (backward compatibility).

**Request Body:** `IDictionary<string, int>` (foodStoreId → quantity)
```json
{
  "guid-1": 2,
  "guid-2": 1
}
```

---

### `GET /api/orders/{id}/legacy` ⚠️ Legacy
Xem chi tiết đơn hàng cũ.

**Response `result`:** `DetailOrderResponse`
```json
{
  "order": { OrderDto },
  "store": { StoreDto },
  "orderDetails": [ OrderDetailDto, ... ]
}
```

---

## 3. Wallet – Ví điện tử

### `GET /api/wallet/balance`
Xem số dư ví.

**Response `result`:** `WalletResponse`
```json
{
  "userId": 1,
  "userName": "Nguyễn Văn A",
  "balance": 500000,
  "formattedBalance": "500,000 VND",
  "lastUpdated": "2025-06-01T10:00:00"
}
```

---

### `POST /api/wallet/deposit`
Nạp tiền qua MoMo.

**Request Body:**
```json
{
  "amount": 100000,
  "note": "string (optional, max 200)"
}
```
> `amount`: 10,000 – 50,000,000 VND

**Response `result`:** `PaymentResponse`
```json
{
  "orderId": "string",
  "amount": 100000,
  "payUrl": "https://test-payment.momo.vn/...",
  "deepLink": "momo://...",
  "qrCodeUrl": "https://...",
  "message": "string",
  "success": true
}
```

---

### `GET /api/wallet/transactions`
Xem lịch sử giao dịch (có phân trang).

| Query Param  | Type  | Default | Mô tả           |
|-------------|-------|---------|------------------|
| `pageNumber`| `int` | 1       | Trang hiện tại   |
| `pageSize`  | `int` | 20      | Số item/trang (max 100) |

**Response `result`:**
```json
{
  "pageNumber": 1,
  "pageSize": 20,
  "transactions": [
    {
      "id": "guid",
      "transactionType": 1,
      "transactionTypeName": "Deposit",
      "amount": 100000,
      "balanceBefore": 400000,
      "balanceAfter": 500000,
      "status": 1,
      "statusName": "Completed",
      "description": "Nạp tiền qua MoMo",
      "externalReference": "...",
      "paymentMethod": "MoMo",
      "createdAt": "2025-06-01T10:00:00",
      "completedAt": "2025-06-01T10:01:00"
    }
  ]
}
```

---

### `GET /api/wallet/check-balance/{amount}`
Kiểm tra số dư đủ hay không.

**Response `result`:**
```json
{
  "amount": 100000,
  "hasSufficientBalance": true
}
```

---

## 4. Delivery Addresses – Địa chỉ giao hàng

### `GET /api/addresses`
Lấy tất cả địa chỉ của user.

**Response `result`:** `DeliveryAddressDto[]`
```json
[
  {
    "id": 1,
    "userId": 1,
    "label": "Home",
    "recipientName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Đường ABC",
    "addressDetail": "Tầng 3",
    "latitude": "10.762622",
    "longitude": "106.660172",
    "isDefault": true,
    "createdAt": "2025-01-01T00:00:00"
  }
]
```

---

### `GET /api/addresses/{id}`
Lấy địa chỉ theo ID.

---

### `GET /api/addresses/default`
Lấy địa chỉ mặc định.

---

### `POST /api/addresses`
Tạo địa chỉ mới.

**Request Body:**
```json
{
  "label": "string (max 50, default: Home)",
  "recipientName": "string (required, max 100)",
  "phone": "string (required, phone format)",
  "address": "string (required, max 500)",
  "addressDetail": "string (max 200, optional)",
  "latitude": "string (optional)",
  "longitude": "string (optional)",
  "isDefault": false
}
```

---

### `PUT /api/addresses/{id}`
Cập nhật địa chỉ (cùng body như `POST`).

---

### `DELETE /api/addresses/{id}`
Xoá địa chỉ.

---

### `PUT /api/addresses/{id}/default`
Đặt địa chỉ làm mặc định.

---

## 5. Favorites – Yêu thích

### `GET /api/favorites/stores`
Lấy danh sách store yêu thích.

**Response `result`:** `FavoriteDto[]`
```json
[
  {
    "id": 1,
    "userId": 1,
    "storeId": 1,
    "storeName": "Quán ABC",
    "storeImage": "...",
    "storeAddress": "...",
    "storeRating": 4.5,
    "foodId": null,
    "foodName": null,
    "foodImage": null,
    "foodPrice": null,
    "createdAt": "2025-01-01T00:00:00"
  }
]
```

---

### `GET /api/favorites/foods`
Lấy danh sách món ăn yêu thích.

---

### `POST /api/favorites/stores/{storeId}`
Thêm store vào yêu thích.

---

### `POST /api/favorites/foods/{foodId}`
Thêm món ăn vào yêu thích.

---

### `DELETE /api/favorites/stores/{storeId}`
Bỏ store khỏi yêu thích.

---

### `DELETE /api/favorites/foods/{foodId}`
Bỏ món ăn khỏi yêu thích.

---

### `GET /api/favorites/stores/{storeId}/check`
Kiểm tra đã thích store chưa.

**Response `result`:**
```json
{ "isFavorited": true }
```

---

### `GET /api/favorites/foods/{foodId}/check`
Kiểm tra đã thích món ăn chưa.

---

## 6. Notifications – Thông báo

### `GET /api/notifications`
Lấy thông báo (có phân trang, lọc đọc/chưa đọc).

| Query Param  | Type   | Default | Mô tả                      |
|-------------|--------|---------|------------------------------|
| `pageNumber`| `int`  | 1       | Trang hiện tại               |
| `pageSize`  | `int`  | 20      | Số item/trang                |
| `isRead`    | `bool` | null    | `true`/`false`/null (tất cả) |

**Response `result`:**
```json
{
  "notifications": [
    {
      "id": "guid",
      "userId": 1,
      "title": "Đơn hàng đã xác nhận",
      "content": "Đơn hàng #123 đã được xác nhận",
      "type": 1,
      "typeName": "Order",
      "referenceId": "guid",
      "imageUrl": "...",
      "deepLink": "...",
      "isRead": false,
      "readAt": null,
      "createdAt": "2025-06-01T10:00:00",
      "timeAgo": "5 phút trước"
    }
  ],
  "unreadCount": 3,
  "pageNumber": 1,
  "pageSize": 20
}
```

---

### `GET /api/notifications/unread-count`
Đếm thông báo chưa đọc.

**Response `result`:**
```json
{ "unreadCount": 3 }
```

---

### `PUT /api/notifications/{id}/read`
Đánh dấu đã đọc.

---

### `PUT /api/notifications/read-all`
Đánh dấu tất cả đã đọc.

**Response `result`:**
```json
{ "markedCount": 5 }
```

---

### `DELETE /api/notifications/{id}`
Xoá thông báo.

---

## 7. Reviews – Đánh giá (Authenticated)

### `POST /api/reviews`
Tạo đánh giá.

**Request Body:**
```json
{
  "orderId": "guid (required)",
  "storeId": 1,
  "foodId": null,
  "rating": 5,
  "comment": "string (max 1000)",
  "images": ["https://img1.jpg", "https://img2.jpg"]
}
```
> `rating`: 1–5

---

### `GET /api/reviews/my-reviews`
Xem đánh giá của tôi (có phân trang).

| Query Param  | Type  | Default |
|-------------|-------|---------|
| `pageNumber`| `int` | 1       |
| `pageSize`  | `int` | 20      |

---

### `POST /api/reviews/{id}/reply`
Trả lời đánh giá (dành cho chủ store).

**Request Body:**
```json
{
  "reply": "string (required, max 500)"
}
```

---

### `DELETE /api/reviews/{id}`
Xoá đánh giá (chỉ chủ review).

---

### `GET /api/reviews/can-review/{orderId}`
Kiểm tra có thể đánh giá đơn hàng không.

**Response `result`:**
```json
{ "canReview": true }
```

---

## 8. Vouchers – Mã giảm giá (Authenticated)

### `GET /api/vouchers/available`
Lấy voucher khả dụng cho user theo giá đơn hàng.

| Query Param   | Type      | Mô tả                  |
|--------------|-----------|------------------------|
| `orderAmount`| `decimal` | Giá trị đơn hàng (required) |
| `storeId`    | `long`    | ID cửa hàng (optional) |

---

### `POST /api/vouchers/apply`
Áp dụng voucher (tính giảm giá).

**Request Body:**
```json
{
  "code": "string (required)",
  "orderAmount": 100000,
  "storeId": 1
}
```

**Response `result`:**
```json
{
  "voucher": { VoucherDto },
  "discountAmount": 10000,
  "finalAmount": 90000
}
```

---

---

# 👨‍🍳 MANAGER APIs (Role = Manager)

> Các API này yêu cầu user đã được Admin duyệt làm Manager.

## 1. Food Stores – Quản lý menu cửa hàng

### `GET /api/food-stores/my-store`
Xem danh sách food-store của cửa hàng mình.

**Response `result`:** `FoodStoreDto[]`

---

### `POST /api/food-stores`
Thêm món vào menu cửa hàng.

**Request Body:**
```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "storeId": 1,
  "foodId": 10,
  "sizeId": 1,
  "price": 45000,
  "isAvailable": true
}
```

---

### `PUT /api/food-stores`
Cập nhật món trong menu.

**Request Body:**
```json
{
  "id": "guid (required)",
  "price": 50000,
  "sizeId": 2,
  "isAvailable": true
}
```

---

### `DELETE /api/food-stores/{id}`
Xoá món khỏi menu.

| Param | Type   | Mô tả             |
|-------|--------|--------------------|
| `id`  | `Guid` | ID food store item |

---

## 2. Users – Khoá người dùng

### `PUT /api/users/lock{userId}`
Manager khoá user.

| Param    | Type   | Mô tả      |
|----------|--------|-------------|
| `userId` | `long` | ID user     |

---

## 3. Foods – Quản lý món ăn (Admin, Manager)

### `GET /api/foods`
Lấy tất cả món ăn.

**Response `result`:** `FoodDto[]`
```json
[
  {
    "id": 10,
    "name": "Phở bò",
    "foodTypeId": 1,
    "foodTypeName": "Món nước",
    "imageSrc": "https://...",
    "isAvailable": true
  }
]
```

---

### `GET /api/foods/{id}`
Lấy món ăn theo ID.

---

### `POST /api/foods`
Tạo món ăn mới.

**Request Body:**
```json
{
  "name": "string (required)",
  "imageSrc": "string",
  "foodTypeId": 1
}
```

---

### `PUT /api/foods`
Cập nhật món ăn.

**Request Body:**
```json
{
  "name": "string (required)",
  "imageSrc": "string",
  "foodTypeId": 1,
  "isAvaiable": true
}
```

---

## 4. Food Types – Quản lý loại món (Admin, Manager)

### `POST /api/food-types`
Tạo loại món mới.

**Request Body:**
```json
{
  "name": "string (required, max 256)",
  "imgSrc": "string (default: empty)"
}
```

---

### `PUT /api/food-types`
Cập nhật loại món.

**Request Body:**
```json
{
  "id": 1,
  "name": "string (required, max 256)",
  "imgSrc": "string"
}
```

---

### `DELETE /api/food-types/{id}`
Xoá loại món.

---

## 5. Tenants – Quản lý khu vực (Admin, Manager)

### `POST /api/tenants`
Tạo tenant mới.

**Request Body:**
```json
{ "name": "string" }
```

---

### `PUT /api/tenants`
Cập nhật tenant.

**Request Body:**
```json
{ "id": 1, "name": "string" }
```

---

## 6. Vouchers – Quản lý mã giảm giá (Admin, Manager)

### `POST /api/vouchers`
Tạo voucher mới.

**Request Body:**
```json
{
  "code": "string (required, max 50)",
  "name": "string (required, max 200)",
  "description": "string (max 500)",
  "type": 1,
  "value": 10,
  "minOrderAmount": 50000,
  "maxDiscount": 20000,
  "startDate": "2025-01-01T00:00:00",
  "endDate": "2025-12-31T23:59:59",
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "storeId": null
}
```
> `type`: 1=Percent, 2=FixedAmount, 3=FreeShipping
> `storeId`: null = voucher toàn hệ thống, có giá trị = riêng cho cửa hàng

---

### `PUT /api/vouchers/{id}`
Cập nhật voucher.

**Request Body:**
```json
{
  "name": "string (max 200)",
  "description": "string (max 500)",
  "minOrderAmount": 50000,
  "maxDiscount": 25000,
  "endDate": "2025-12-31T23:59:59",
  "usageLimit": 200,
  "usageLimitPerUser": 2,
  "isActive": true
}
```

---

### `DELETE /api/vouchers/{id}`
Vô hiệu hoá voucher.

---

---

# 🛡️ ADMIN APIs (Role = Admin)

> Bao gồm tất cả quyền Manager + các API quản trị bên dưới.

## 1. Users – Quản trị cửa hàng

### `PUT /api/users/approve-store/{storeId}`
Duyệt cửa hàng → user trở thành Manager.

| Param     | Type   | Mô tả       |
|-----------|--------|-------------|
| `storeId` | `long` | ID cửa hàng |

---

### `GET /api/users/pending-stores`
Xem danh sách cửa hàng chờ duyệt.

**Response `result`:** `StoreDto[]`

---

## 2. Tenants – Xoá khu vực

### `DELETE /api/tenants/{id}`
Xoá tenant (chỉ Admin).

---

---

# 📊 Tổng hợp API theo Role

| API                                          | Public | User | Manager | Admin |
|----------------------------------------------|:------:|:----:|:-------:|:-----:|
| `POST /api/users/login`                      |   ✅   |      |         |       |
| `POST /api/users/register`                   |   ✅   |      |         |       |
| `GET /api/users/profile`                     |        |  ✅  |   ✅    |  ✅   |
| `GET /api/users/sign-out`                    |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/users/edit-profile`                |        |  ✅  |   ✅    |  ✅   |
| `PATCH /api/users/temp-data`                 |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/users/temp-data`                |        |  ✅  |   ✅    |  ✅   |
| `POST /api/users/register-manager`           |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/users/lock{userId}`                |        |      |   ✅    |  ✅   |
| `PUT /api/users/approve-store/{storeId}`     |        |      |         |  ✅   |
| `GET /api/users/pending-stores`              |        |      |         |  ✅   |
| **Stores**                                   |        |      |         |       |
| `GET /api/stores`                            |   ✅   |      |         |       |
| `GET /api/stores/tenant/{id}`                |   ✅   |      |         |       |
| `GET /api/stores/{id}`                       |   ✅   |      |         |       |
| **Food Stores**                              |        |      |         |       |
| `GET /api/food-stores`                       |   ✅   |      |         |       |
| `GET /api/food-stores/my-store`              |        |      |   ✅    |       |
| `POST /api/food-stores`                      |        |      |   ✅    |       |
| `PUT /api/food-stores`                       |        |      |   ✅    |       |
| `DELETE /api/food-stores/{id}`               |        |      |   ✅    |       |
| **Foods**                                    |        |      |         |       |
| `GET /api/foods`                             |        |      |   ✅    |  ✅   |
| `GET /api/foods/{id}`                        |        |      |   ✅    |  ✅   |
| `POST /api/foods`                            |        |      |   ✅    |  ✅   |
| `PUT /api/foods`                             |        |      |   ✅    |  ✅   |
| **Food Types**                               |        |      |         |       |
| `GET /api/food-types`                        |   ✅   |      |         |       |
| `GET /api/food-types/{id}`                   |   ✅   |      |         |       |
| `POST /api/food-types`                       |        |      |   ✅    |  ✅   |
| `PUT /api/food-types`                        |        |      |   ✅    |  ✅   |
| `DELETE /api/food-types/{id}`                |        |      |   ✅    |  ✅   |
| **Tenants**                                  |        |      |         |       |
| `GET /api/tenants`                           |   ✅   |      |         |       |
| `GET /api/tenants/{id}`                      |   ✅   |      |         |       |
| `POST /api/tenants`                          |        |      |   ✅    |  ✅   |
| `PUT /api/tenants`                           |        |      |   ✅    |  ✅   |
| `DELETE /api/tenants/{id}`                   |        |      |         |  ✅   |
| **Orders**                                   |        |      |         |       |
| `POST /api/orders`                           |        |  ✅  |   ✅    |  ✅   |
| `GET /api/orders/{id}`                       |        |  ✅  |   ✅    |  ✅   |
| `GET /api/orders/history`                    |        |  ✅  |   ✅    |  ✅   |
| `GET /api/orders/store/{storeId}`            |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/orders/{id}/status`                |        |  ✅  |   ✅    |  ✅   |
| `POST /api/orders/{id}/cancel`               |        |  ✅  |   ✅    |  ✅   |
| `POST /api/orders/legacy`                    |        |  ✅  |   ✅    |  ✅   |
| `GET /api/orders/{id}/legacy`                |        |  ✅  |   ✅    |  ✅   |
| **Wallet**                                   |        |      |         |       |
| `GET /api/wallet/balance`                    |        |  ✅  |   ✅    |  ✅   |
| `POST /api/wallet/deposit`                   |        |  ✅  |   ✅    |  ✅   |
| `GET /api/wallet/transactions`               |        |  ✅  |   ✅    |  ✅   |
| `GET /api/wallet/check-balance/{amount}`     |        |  ✅  |   ✅    |  ✅   |
| `POST /api/wallet/momo/ipn`                  |   ✅   |      |         |       |
| `GET /api/wallet/momo/return`                |   ✅   |      |         |       |
| **Addresses**                                |        |      |         |       |
| `GET /api/addresses`                         |        |  ✅  |   ✅    |  ✅   |
| `GET /api/addresses/{id}`                    |        |  ✅  |   ✅    |  ✅   |
| `GET /api/addresses/default`                 |        |  ✅  |   ✅    |  ✅   |
| `POST /api/addresses`                        |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/addresses/{id}`                    |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/addresses/{id}`                 |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/addresses/{id}/default`            |        |  ✅  |   ✅    |  ✅   |
| **Favorites**                                |        |      |         |       |
| `GET /api/favorites/stores`                  |        |  ✅  |   ✅    |  ✅   |
| `GET /api/favorites/foods`                   |        |  ✅  |   ✅    |  ✅   |
| `POST /api/favorites/stores/{storeId}`       |        |  ✅  |   ✅    |  ✅   |
| `POST /api/favorites/foods/{foodId}`         |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/favorites/stores/{storeId}`     |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/favorites/foods/{foodId}`       |        |  ✅  |   ✅    |  ✅   |
| `GET /api/favorites/stores/{storeId}/check`  |        |  ✅  |   ✅    |  ✅   |
| `GET /api/favorites/foods/{foodId}/check`    |        |  ✅  |   ✅    |  ✅   |
| **Notifications**                            |        |      |         |       |
| `GET /api/notifications`                     |        |  ✅  |   ✅    |  ✅   |
| `GET /api/notifications/unread-count`        |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/notifications/{id}/read`           |        |  ✅  |   ✅    |  ✅   |
| `PUT /api/notifications/read-all`            |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/notifications/{id}`             |        |  ✅  |   ✅    |  ✅   |
| **Reviews**                                  |        |      |         |       |
| `GET /api/reviews/{id}`                      |   ✅   |      |         |       |
| `GET /api/reviews/store/{storeId}`           |   ✅   |      |         |       |
| `GET /api/reviews/food/{foodId}`             |   ✅   |      |         |       |
| `POST /api/reviews`                          |        |  ✅  |   ✅    |  ✅   |
| `GET /api/reviews/my-reviews`                |        |  ✅  |   ✅    |  ✅   |
| `POST /api/reviews/{id}/reply`               |        |  ✅  |   ✅    |  ✅   |
| `DELETE /api/reviews/{id}`                   |        |  ✅  |   ✅    |  ✅   |
| `GET /api/reviews/can-review/{orderId}`      |        |  ✅  |   ✅    |  ✅   |
| **Vouchers**                                 |        |      |         |       |
| `GET /api/vouchers/{id}`                     |   ✅   |      |         |       |
| `GET /api/vouchers/code/{code}`              |   ✅   |      |         |       |
| `GET /api/vouchers/active`                   |   ✅   |      |         |       |
| `GET /api/vouchers/available`                |        |  ✅  |   ✅    |  ✅   |
| `POST /api/vouchers/apply`                   |        |  ✅  |   ✅    |  ✅   |
| `POST /api/vouchers`                         |        |      |   ✅    |  ✅   |
| `PUT /api/vouchers/{id}`                     |        |      |   ✅    |  ✅   |
| `DELETE /api/vouchers/{id}`                  |        |      |   ✅    |  ✅   |

---

## ⚠️ Lưu ý cho Frontend

1. **Authentication**: Sử dụng cookie. Khi gọi API cần thêm `credentials: 'include'` (fetch) hoặc `withCredentials: true` (axios).
2. **CORS**: Đảm bảo frontend domain được cấu hình CORS trên backend.
3. **Error handling**: Khi nhận HTTP 401 → redirect đến trang login. HTTP 400/404 → hiển thị `message`.
4. **Enum values**: Gửi giá trị **số** (int), không gửi tên. VD: `"status": 1` (không phải `"Confirmed"`).
5. **Guid format**: Các ID dạng Guid phải đúng format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
6. **Pagination**: Các API có phân trang sử dụng query params `pageNumber` và `pageSize`.
7. **MoMo Payment Flow**: `POST /api/wallet/deposit` → nhận `payUrl` → redirect user đến MoMo → MoMo callback về `/api/wallet/momo/ipn` (server) và redirect user về `/api/wallet/momo/return`.
