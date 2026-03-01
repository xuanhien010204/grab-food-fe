// Generated from API Documentation

// ============ ENUMS ============

export enum RoleId {
    User = 1,
    Manager = 2,
    Admin = 3,
}

export enum OrderStatus {
    Pending = 0,
    Confirmed = 1,
    Preparing = 2,
    Ready = 3,
    Delivering = 4,
    Completed = 5,
    Cancelled = 6,
}

export const OrderStatusName: Record<number, string> = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Preparing',
    3: 'Ready',
    4: 'Delivering',
    5: 'Completed',
    6: 'Cancelled',
};

export enum PaymentMethod {
    Wallet = 1,
    CashOnDelivery = 2,
    MoMo = 3,
}

export const PaymentMethodName: Record<number, string> = {
    1: 'Wallet',
    2: 'Cash On Delivery',
    3: 'MoMo',
};

export enum PaymentStatus {
    Unpaid = 0,
    Paid = 1,
    Refunded = 2,
    Failed = 3,
}

export enum VoucherType {
    Percent = 1,
    FixedAmount = 2,
    FreeShipping = 3,
}

export const VoucherTypeName: Record<number, string> = {
    1: 'Percent',
    2: 'Fixed Amount',
    3: 'Free Shipping',
};

export enum TransactionType {
    Deposit = 1,
    Payment = 2,
    Refund = 3,
    Withdrawal = 4,
    Bonus = 5,
}

export enum TransactionStatus {
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Cancelled = 3,
}

export enum NotificationType {
    System = 0,
    Order = 1,
    Promotion = 2,
    Wallet = 3,
    Review = 4,
    Feature = 5,
}

// ============ USER ============

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface UserDto {
    id: number;
    name: string;
    email: string;
    phone: string;
    roleId: number;
    roleName: string;
    tempCartMeta?: string | null;
}

// Alias for backward compatibility
export type UserProfileDto = UserDto;

export interface EditProfileRequest {
    name: string;
    email: string;
    phone: string;
}

export interface RegisterManagerRequest {
    storeName: string;
    description?: string;
    address: string;
    latitude?: string;
    longitude?: string;
    phone?: string;
    openTime?: string;
    closeTime?: string;
    imageSrc?: string;
}

// ============ STORE ============

export interface StoreDto {
    id: number;
    tenantId: number;
    name?: string;
    description?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    imageSrc?: string;
    phone?: string;
    openTime?: string;
    closeTime?: string;
    isOpen?: boolean;
    isActive?: boolean;
    managerId?: number;
    isApproved?: boolean;
}

export interface StoreDetailDto extends StoreDto {
    foodStores?: FoodStoreDto[];
}

// ============ FOOD ============

export interface FoodDto {
    id: number;
    name?: string;
    foodTypeId: number;
    foodTypeName?: string;
    imageSrc?: string;
    isAvailable: boolean;
}

export interface FoodRequest {
    name: string;
    imageSrc?: string;
    foodTypeId: number;
}

export interface FoodUpdate {
    name: string;
    imageSrc?: string;
    foodTypeId: number;
    isAvaiable: boolean;
}

// ============ FOOD STORE ============

export interface FoodStoreDto {
    id: string; // Guid
    storeId: number;
    store?: StoreDto;
    foodId: number;
    food?: FoodDto;
    sizeId?: number;
    size?: any;
    price: number;
    isAvailable?: boolean;
}

export interface FoodStoreCreateRequest {
    id: string;
    storeId: number;
    foodId: number;
    sizeId?: number;
    price: number;
    isAvailable: boolean;
}

export interface FoodStoreUpdateRequest {
    id: string;
    price: number;
    sizeId?: number;
    isAvailable: boolean;
}

// ============ FOOD TYPE ============

export interface FoodTypeDto {
    id: number;
    name: string;
    imgSrc?: string;
}

export interface FoodTypeCreateRequest {
    name: string;
    imgSrc?: string;
}

export interface FoodTypeUpdateRequest {
    id: number;
    name: string;
    imgSrc?: string;
}

// ============ TENANT ============

export interface TenantDto {
    id: number;
    name: string;
    createTime?: string;
    updateTime?: string | null;
}

export interface TenantRequest {
    name: string;
}

export interface TenantUpdateRequest {
    id: number;
    name: string;
}

// ============ ORDER ============

export interface OrderCreateRequest {
    storeId: number;
    paymentMethod: number;
    deliveryAddress: string;
    recipientPhone: string;
    recipientName: string;
    note?: string;
    deliveryFee: number;
    discount: number;
    items: OrderItemRequest[];
}

export interface OrderItemRequest {
    foodStoreId: string;
    quantity: number;
}

export interface OrderDto {
    id: string;
    userId: number;
    storeId: number;
    storeName?: string;
    storeAddress?: string;
    storeImage?: string;
    purchaseDate: string;
    status: number;
    statusName?: string;
    paymentMethod: number;
    paymentMethodName?: string;
    paymentStatus: number;
    paymentStatusName?: string;
    subTotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    deliveryAddress?: string;
    recipientPhone?: string;
    recipientName?: string;
    note?: string;
    confirmedAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
    cancelReason?: string | null;
    totalItems: number;
    items?: OrderItemDto[];
}

export interface OrderItemDto {
    orderId: string;
    foodStoreId: string;
    foodId: number;
    foodName?: string;
    foodImage?: string;
    sizeId?: number;
    sizeName?: string;
    price: number;
    quantity: number;
    total: number;
}

export interface CancelOrderRequest {
    reason: string;
}

export interface UpdateOrderStatusRequest {
    status: number;
    reason?: string;
}

// ============ WALLET ============

export interface WalletResponse {
    userId: number;
    userName: string;
    balance: number;
    formattedBalance: string;
    lastUpdated: string;
}

export interface DepositRequest {
    amount: number;
    note?: string;
}

export interface PaymentResponse {
    orderId: string;
    amount: number;
    payUrl: string;
    deepLink?: string;
    qrCodeUrl?: string;
    message: string;
    success: boolean;
}

export interface WalletTransactionDto {
    id: string;
    transactionType: number;
    transactionTypeName: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: number;
    statusName: string;
    description?: string;
    externalReference?: string;
    paymentMethod?: string;
    createdAt: string;
    completedAt?: string | null;
}

export interface CheckBalanceResponse {
    amount: number;
    hasSufficientBalance: boolean;
}

// ============ ADDRESS ============

export interface DeliveryAddressDto {
    id: number;
    userId: number;
    label?: string;
    recipientName: string;
    phone: string;
    address: string;
    addressDetail?: string;
    latitude?: string;
    longitude?: string;
    isDefault: boolean;
    createdAt: string;
}

export interface AddressRequest {
    label?: string;
    recipientName: string;
    phone: string;
    address: string;
    addressDetail?: string;
    latitude?: string;
    longitude?: string;
    isDefault?: boolean;
}

export type AddressDto = DeliveryAddressDto;

// ============ FAVORITE ============

export interface FavoriteDto {
    id: number;
    userId: number;
    storeId?: number;
    storeName?: string;
    storeImage?: string;
    storeAddress?: string;
    storeRating?: number;
    foodId?: number;
    foodName?: string;
    foodImage?: string;
    foodPrice?: number;
    createdAt: string;
}

// ============ NOTIFICATION ============

export interface NotificationDto {
    id: string;
    userId: number;
    title: string;
    content: string;
    type: number;
    typeName?: string;
    referenceId?: string;
    imageUrl?: string;
    deepLink?: string;
    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
    timeAgo?: string;
}

export interface NotificationListResponse {
    notifications: NotificationDto[];
    unreadCount: number;
    pageNumber: number;
    pageSize: number;
}

// ============ REVIEW ============

export interface ReviewDto {
    id: string;
    userId: number;
    userName: string;
    userAvatar?: string;
    orderId: string;
    storeId: number;
    storeName?: string;
    foodId?: number;
    foodName?: string;
    rating: number;
    comment?: string;
    images?: string[];
    storeReply?: string;
    storeReplyAt?: string | null;
    createdAt: string;
}

export interface ReviewCreateRequest {
    orderId: string;
    storeId: number;
    foodId?: number;
    rating: number;
    comment?: string;
    images?: string[];
}

export interface ReviewReplyRequest {
    reply: string;
}

export interface ReviewStoreResponse {
    stats: any;
    reviews: ReviewDto[];
    pageNumber: number;
    pageSize: number;
}

// ============ VOUCHER ============

export interface VoucherDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: number;
    typeName?: string;
    value: number;
    minOrderAmount: number;
    maxDiscount: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usageLimitPerUser: number;
    usedCount: number;
    isActive: boolean;
    storeId?: number | null;
    storeName?: string | null;
    isValid?: boolean;
    discountText?: string;
}

export interface VoucherCreateRequest {
    code: string;
    name: string;
    description?: string;
    type: number;
    value: number;
    minOrderAmount: number;
    maxDiscount: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usageLimitPerUser: number;
    storeId?: number | null;
}

export interface VoucherUpdateRequest {
    name?: string;
    description?: string;
    minOrderAmount?: number;
    maxDiscount?: number;
    endDate?: string;
    usageLimit?: number;
    usageLimitPerUser?: number;
    isActive?: boolean;
}

export interface VoucherApplyRequest {
    code: string;
    orderAmount: number;
    storeId?: number;
}

export interface VoucherApplyResponse {
    voucher: VoucherDto;
    discountAmount: number;
    finalAmount: number;
}

// ============ CART ============

export interface CartItemDto {
    quantity: number;
    foodStore?: FoodStoreDto;
}

export interface CartDto {
    orderList: Record<string, CartItemDto>;
}

