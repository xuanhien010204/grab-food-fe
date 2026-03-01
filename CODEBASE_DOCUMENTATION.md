# GrabFood Frontend — Comprehensive Codebase Documentation

> **Project:** `grabfood-fe`  
> **Stack:** React 18.3.1 + TypeScript 5.6.2 + Vite 6.0.5 + Tailwind CSS 3.4.17  
> **Backend API:** `http://grab-food.somee.com` (proxied via Vite dev server at `/api`)  
> **Architecture:** Feature-based folder structure with 3 role domains (Customer, Manager, Admin)

---

## Table of Contents

1. [Configuration Files](#1-configuration-files)
2. [Core Source Files](#2-core-source-files)
3. [API Layer](#3-api-layer)
4. [Type Definitions](#4-type-definitions)
5. [Shared UI Components](#5-shared-ui-components)
6. [Utilities](#6-utilities)
7. [Routing & Auth Guards](#7-routing--auth-guards)
8. [Customer Features](#8-customer-features)
9. [Admin Features](#9-admin-features)
10. [Manager Features](#10-manager-features)

---

## 1. Configuration Files

### `package.json`
- **Project name:** `grabfood-fe`, private, ESM (`"type": "module"`)
- **Key dependencies:** react `18.3.1`, react-dom, react-router-dom `6.28.1`, axios `1.7.9`, framer-motion `11.15.0`, recharts `2.15.0`, sonner `1.7.1`, lucide-react `0.469.0`, clsx, tailwind-merge
- **Dev dependencies:** vite `6.0.5`, typescript `5.6.2`, tailwindcss `3.4.17`, autoprefixer, postcss, eslint, @vitejs/plugin-react
- **Scripts:** `dev` (vite), `build` (tsc -b && vite build), `lint` (eslint), `preview` (vite preview)

### `vite.config.ts`
- Uses `@vitejs/plugin-react`
- Dev server proxy: `/api` → `http://grab-food.somee.com` with `changeOrigin: true`, `secure: false`

### `tailwind.config.js`
- Content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Extended theme: Custom orange palette (50–950), `admin-primary` (#F06500), `manager-primary` (#FF5C28)

### `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`
- Target: ES2022 (app), ES2023 (node)
- React JSX transform, strict mode, bundler module resolution, `noEmit: true`

### `postcss.config.js`
- Plugins: tailwindcss, autoprefixer

### `eslint.config.js`
- TypeScript ESLint recommended rules, react-hooks, react-refresh

### `index.html`
- Root `<div id="root">`, loads `/src/main.tsx`

---

## 2. Core Source Files

### `src/main.tsx`
- **Exports:** Entry point (no named exports)
- **Behavior:** Renders `<App />` inside `<StrictMode>` into `#root`
- **Dependencies:** `App.tsx`

### `src/index.css`
- Tailwind directives: `@tailwind base`, `@tailwind components`, `@tailwind utilities`
- Base styles: `body { background: #f9fafb }`

### `src/App.tsx`
- **Default export:** `App`
- **Key features:** Central router using `BrowserRouter` with nested routes
- **Route structure:**
  - **Auth:** `/login` → `LoginPage`, `/register` → `RegisterPage`
  - **Customer** (under `CustomerLayout`): `/` (HomePage), `/product/:id`, `/cart`, `/wallet`, `/orders`, `/orders/:id`, `/profile`, `/stores`, `/store/:id`, `/foods`, `/food/:id`, `/addresses`, `/favorites`, `/reviews`, `/notifications`
  - **Admin** (guarded by `RequireRole allowedRoles={['Admin']}`): `/admin/dashboard`, `/admin/users`, `/admin/stores`, `/admin/categories`, `/admin/vouchers`, `/admin/transactions`, `/admin/settings`
  - **Manager** (guarded by `RequireRole allowedRoles={['Manager','Admin']}`): `/manager/orders`, `/manager/menu`, `/manager/reviews`, `/manager/tenants`, `/manager/store`
  - Catch-all `*` → redirect to `/`
- **Global UI:** `<Toaster />` from sonner (position: top-center)
- **Dependencies:** All layout and page components, `react-router-dom`, `sonner`, `RequireRole`

---

## 3. API Layer

### `src/api/api.ts` (~280 lines)

Central API module creating an Axios instance and exporting domain-specific API objects.

**Axios Instance (`api`):**
- `withCredentials: true`, no baseURL (relies on Vite proxy)
- **Request interceptor:** Attaches `Authorization: Bearer <token>` from `localStorage`, auto-strips stray quotes from tokens
- **Response interceptor:** Auto-unwraps `{ result: ..., message: "Success" }` responses; on 401, clears auth and redirects to `/login`

**Exported API objects:**

| API Object | Endpoints | Methods |
|---|---|---|
| `foodApi` | `/api/foods` | `getAll`, `getById`, `create`, `update`, `delete` |
| `foodStoreApi` | `/api/food-stores` | `getAll(params?)`, `getMyStore`, `create`, `update`, `delete` |
| `foodTypeApi` | `/api/food-types` | `getAll`, `getById`, `create`, `update`, `delete` |
| `orderApi` | `/api/orders` | `getHistory`, `getById`, `create`, `cancel`, `getStoreOrders`, `updateStatus` |
| `storeApi` | `/api/stores` | `getAll`, `getById`, `getByTenant` |
| `userApi` | `/api/users` | `login`, `register`, `profile`, `editProfile`, `registerManager`, `getCart`, `updateCart`, `clearCart`, `signOut` |
| `managerApi` | Manager order ops | `getStoreOrders`, `updateStatus` |
| `addressApi` | `/api/addresses` | `getAll`, `create`, `update`, `delete`, `getDefault`, `setDefault` |
| `favoriteApi` | `/api/favorites` | `getStores`, `getFoods`, `addStore`, `removeStore`, `addFood`, `removeFood`, `checkStore`, `checkFood` |
| `reviewApi` | `/api/reviews` | `create`, `getMyReviews`, `getByFood`, `getByStore`, `canReview`, `reply`, `delete` |
| `walletApi` | `/api/wallet` | `getBalance`, `deposit`, `getTransactions`, `checkBalance` |
| `notificationApi` | `/api/notifications` | `getAll`, `getUnreadCount`, `markRead`, `markAllRead`, `delete` |
| `tenantApi` | `/api/tenants` | `getAll`, `getById`, `create`, `update`, `delete` |
| `voucherApi` | `/api/vouchers` | `getActive`, `getAvailable`, `getByCode`, `apply`, `getById`, `create`, `update`, `delete` |
| `adminApi` | Various admin endpoints | `getPendingStores`, `approveStore`, `lockUser`, `getStores`, `getFoodTypes` |

**Notable patterns:**
- `userApi.login`: Complex token extraction with multiple fallback strategies, including a "session bypass mode" when backend returns user data without JWT
- `userApi.profile`: Fallback bypass that returns minimal profile from JWT if API fails
- Cart stored via `/api/users/temp-data` using JSON serialization

---

## 4. Type Definitions

### `src/types/swagger.ts` (547 lines)
Comprehensive type definitions derived from Swagger/OpenAPI spec.

**Enums:**
- `RoleId` (User=1, Manager=2, Admin=3)
- `OrderStatus` (Pending=0 → Cancelled=6)
- `PaymentMethod` (CashOnDelivery=0, WalletPayment=1, Momo=2, ZaloPay=3, BankTransfer=4)
- `PaymentStatus` (Pending=0, Completed=1, Failed=2, Refunded=3)
- `VoucherType` (Percentage=0, FixedAmount=1, FreeShip=2)
- `TransactionType` (TopUp=0, Payment=1, Refund=2, Commission=3, Transfer=4)
- `TransactionStatus` (Pending=0, Completed=1, Failed=2)
- `NotificationType` (OrderUpdate=0, Promotion=1, System=2, Review=3, Wallet=4)

**Key interfaces (selected):**
- `LoginRequest`, `RegisterRequest`, `UserDto`, `UserProfileDto`, `EditProfileRequest`
- `StoreDto`, `StoreDetailDto`
- `FoodDto`, `FoodRequest`, `FoodUpdate`, `FoodStoreDto`, `FoodStoreCreateRequest`, `FoodStoreUpdateRequest`
- `FoodTypeDto`, `FoodTypeCreateRequest`, `FoodTypeUpdateRequest`
- `TenantDto`, `TenantRequest`, `TenantUpdateRequest`
- `OrderCreateRequest`, `OrderDto`, `OrderItemDto`, `CancelOrderRequest`, `UpdateOrderStatusRequest`
- `WalletResponse`, `DepositRequest`, `PaymentResponse`, `WalletTransactionDto`, `CheckBalanceResponse`
- `DeliveryAddressDto`, `AddressRequest`
- `FavoriteDto`, `NotificationDto`, `ReviewDto`, `ReviewCreateRequest`, `ReviewReplyRequest`
- `VoucherDto`, `VoucherCreateRequest`, `VoucherUpdateRequest`, `VoucherApplyRequest`, `VoucherApplyResponse`
- `CartItemDto`, `CartDto`

**Name maps:** `OrderStatusName`, `PaymentMethodName`, `VoucherTypeName` — map enum values to display strings

### `src/types/cart.ts`
- `CartItem`: `{ quantity, foodStore }`
- `Cart`: `{ orderList: Map<number, CartItem> }`

### `src/types/store.ts`
- Alternative/duplicate `StoreDto`, `FoodStoreDto`, `FoodDto` interfaces

### `src/types/user.ts`
- Alternative/duplicate `LoginRequest`, `RegisterRequest`, `UserProfile` interfaces

---

## 5. Shared UI Components

### `src/components/ui/Badge.tsx`
- **Export:** `Badge` (forwardRef)
- **Props:** `variant` (default | secondary | outline | destructive | success | warning | info)
- **Dependencies:** `cn()` from lib/utils

### `src/components/ui/Button.tsx`
- **Export:** `Button` (forwardRef)
- **Props:** `variant` (primary | secondary | outline | ghost | danger | success), `size` (sm | md | lg | icon), `isLoading`
- **Features:** Loading state shows `Loader2` spinner icon, disables button
- **Dependencies:** `cn()`, `lucide-react`

### `src/components/ui/Card.tsx`
- **Exports:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (all forwardRef)
- **Dependencies:** `cn()`

### `src/components/ui/Input.tsx`
- **Export:** `Input` (forwardRef)
- **Props:** Standard input + `error` string
- **Features:** Orange focus ring, error message display below input
- **Dependencies:** `cn()`

### `src/components/ui/Modal.tsx`
- **Export:** `Modal`
- **Props:** `isOpen`, `onClose`, `title`, `children`, `fullScreen?`
- **Features:** React Portal-based, AnimatePresence from framer-motion, backdrop blur, X close button + Escape key + background click
- **Dependencies:** `framer-motion`, `lucide-react`

---

## 6. Utilities

### `src/lib/utils.ts`
- **Export:** `cn(...inputs)` — combines `clsx` + `twMerge` for conditional Tailwind classNames

### `src/utils/auth.ts`
- **Exports:**
  - `type RoleName = 'Admin' | 'Manager' | 'Customer'`
  - `authStorage` object:
    - `getToken()` / `setToken()` / `getRole()` / `setRole()` — localStorage wrappers
    - `clear()` — removes token + role
    - `getUserFromToken()` — decodes JWT base64 payload, extracts `sub` (id), `unique_name` (name), `email`, `role` from standard/Microsoft claim URIs

### `src/utils/roleRedirect.ts`
- **Exports:**
  - `getHomeByRole(role)` — returns `/admin/dashboard`, `/manager/orders`, or `/`
  - `normalizeRole(role)` — case-insensitive string → `'Admin' | 'Manager' | 'Customer'`

---

## 7. Routing & Auth Guards

### `src/routes/RequireRole.tsx`
- **Export:** `RequireRole` component
- **Props:** `allowedRoles: string[]`
- **Behavior:**
  1. Checks for token in localStorage → redirect to `/login` if absent
  2. Extracts role from JWT via `authStorage.getUserFromToken()`
  3. If role not in `allowedRoles` → redirect to role-appropriate home via `getHomeByRole()`
  4. Otherwise renders `<Outlet />`
- **Dependencies:** `authStorage`, `getHomeByRole`, `normalizeRole`

---

## 8. Customer Features

### `src/features/customer/LoginPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `LoginPage` (default) |
| **State** | `isLoading`, `email`, `password` |
| **API calls** | `userApi.login(email, password)`, `userApi.profile()` |
| **Key features** | Auto-redirect if token exists; JWT role extraction from multiple claim paths; role-based redirect after login; orange gradient UI |
| **Dependencies** | `userApi`, `authStorage`, `getHomeByRole`, `normalizeRole` |

### `src/features/customer/RegisterPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `RegisterPage` (default) |
| **State** | `isLoading`, `formData { name, email, phone, password, confirmPassword }` |
| **API calls** | `userApi.register(formData)` |
| **Key features** | Client-side password match validation; redirects to `/login` on success |
| **Dependencies** | `userApi`, `react-router-dom` |

### `src/features/customer/layout/CustomerLayout.tsx`
| Aspect | Details |
|---|---|
| **Export** | `CustomerLayout` (default) |
| **State** | None |
| **Key features** | Bottom tab navigation with 6 tabs: Home, Cart, Wallet, Notifications, Orders, Profile; active state highlighting with orange; `<Outlet />` for nested routes |
| **Dependencies** | `react-router-dom`, `lucide-react` |

### `src/features/customer/home/HomePage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `HomePage` (default) |
| **State** | `activeCategory`, `currentBanner`, `isLoading`, `categories`, `foodStores`, `stores`, `vouchers` |
| **API calls** | `foodTypeApi.getAll()`, `foodStoreApi.getAll()`, `storeApi.getAll()`, `voucherApi.getAll()` |
| **Key features** | Auto-rotating promo banner (3s interval), category filter pills, popular food items grid (from foodStores), restaurant list with ratings, hard-coded PROMOTIONS fallback |
| **Dependencies** | `foodTypeApi`, `foodStoreApi`, `storeApi`, `voucherApi`, `react-router-dom` |

### `src/features/customer/cart/CartPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `CartPage` (default) |
| **State** | `cartItems`, `vouchers`, `selectedVoucher`, `voucherCode`, `voucherError`, `isLoading`, `isCheckingOut`, `defaultAddress` |
| **API calls** | `userApi.getCart()`, `userApi.updateCart()`, `userApi.clearCart()`, `voucherApi.getAvailable()`, `voucherApi.getByCode()`, `addressApi.getDefault()`, `orderApi.create()` |
| **Key features** | Quantity +/- with debounced backend sync; voucher code input + available voucher selection; delivery address display (linked to AddressPage); order summary with subtotal/discount/delivery/total; checkout creates order then clears cart; navigates to order detail on success |
| **Dependencies** | `userApi`, `voucherApi`, `addressApi`, `orderApi`, `react-router-dom`, `sonner` |

### `src/features/customer/wallet/WalletPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `WalletPage` (default) |
| **State** | `amount`, `selectedMethod`, `user`, `transactions`, `isLoading` |
| **API calls** | `userApi.profile()`, `walletApi.getBalance()`, `walletApi.deposit()`, `walletApi.getTransactions()` |
| **Key features** | Premium card-style balance display; preset amount buttons (50K–500K); payment method selection (MoMo, ZaloPay, Bank); custom amount input; transaction history with credit/debit color indicators |
| **Dependencies** | `userApi`, `walletApi`, `lucide-react`, `sonner` |

### `src/features/customer/orders/OrderHistoryPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `OrderHistoryPage` (default) |
| **State** | `orders`, `isLoading` |
| **API calls** | `orderApi.getHistory()` |
| **Key features** | Color-coded status badges; order item list per order; total display; "Xem chi tiết" and "Đặt lại" buttons per order |
| **Dependencies** | `orderApi`, `OrderStatusName`, `react-router-dom` |

### `src/features/customer/orders/OrderDetailPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `OrderDetailPage` (default) |
| **State** | `order`, `isLoading`, `isCancelling`, `showCancelConfirm`, `cancelReason`, `canReviewOrder`, `showReviewModal`, `reviewRating`, `reviewComment`, `isSubmittingReview` |
| **API calls** | `orderApi.getById(id)`, `orderApi.cancel(id, reason)`, `reviewApi.canReview(orderId)`, `reviewApi.create({ orderId, rating, comment })` |
| **Key features** | 6-step status progress tracker; store + phone info; itemized order list; delivery address display; cancel modal with reason input (available when Pending); review modal with 5-star interactive rating (available when Completed + canReview) |
| **Dependencies** | `orderApi`, `reviewApi`, `OrderStatusName`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/customer/product/ProductDetail.tsx`
| Aspect | Details |
|---|---|
| **Export** | `ProductDetail` (default) |
| **State** | `quantity`, `selectedSize`, `toppings`, `product`, `isLoading` |
| **API calls** | `foodStoreApi.getAll()` (client-side filter by ID), `userApi.getCart()`, `userApi.updateCart()` |
| **Key features** | Size selection (S/M/L), topping checkboxes, quantity selector, total price calculator, add-to-cart updates backend cart |
| **Dependencies** | `foodStoreApi`, `userApi`, `react-router-dom`, `sonner` |

### `src/features/customer/stores/StoresPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `StoresPage` (default) |
| **State** | `stores`, `filteredStores`, `searchQuery`, `isLoading`, `error`, `favSet` |
| **API calls** | `storeApi.getAll()`, `favoriteApi.getStores()`, `favoriteApi.addStore()`, `favoriteApi.removeStore()` |
| **Key features** | Text search filter; favorite heart toggle; store cards with image, name, address, phone, open/closed status; navigates to `/store/:id` |
| **Dependencies** | `storeApi`, `favoriteApi`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/customer/stores/StoreDetailPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `StoreDetailPage` (default) |
| **State** | `store`, `foods`, `isLoading`, `error`, `isFav`, `reviews` |
| **API calls** | `storeApi.getById(id)`, `foodStoreApi.getAll({ storeId })`, `favoriteApi.checkStore()`, `favoriteApi.addStore()`, `favoriteApi.removeStore()`, `reviewApi.getByStore(id)` |
| **Key features** | Store header banner image; food menu grid; customer reviews with store reply display; favorite toggle button |
| **Dependencies** | `storeApi`, `foodStoreApi`, `favoriteApi`, `reviewApi`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/customer/foods/FoodsPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `FoodsPage` (default) |
| **State** | `foods`, `foodStores`, `categories`, `activeCategory`, `searchQuery`, `isLoading`, `error`, `favFoodSet` |
| **API calls** | `foodApi.getAll()`, `foodStoreApi.getAll(params)`, `foodTypeApi.getAll()`, `favoriteApi.getFoods()`, `favoriteApi.addFood()`, `favoriteApi.removeFood()` |
| **Key features** | Category pill filters; text search; food grid with price from foodStore; favorite toggle; navigates to `/product/:foodStoreId` |
| **Dependencies** | `foodApi`, `foodStoreApi`, `foodTypeApi`, `favoriteApi`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/customer/foods/FoodDetailPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `FoodDetailPage` (default) |
| **State** | `food`, `isLoading`, `error` |
| **API calls** | `foodApi.getById(id)` |
| **Key features** | Image header, "Còn hàng/Hết hàng" badge, food type info, price display, back button |
| **Dependencies** | `foodApi`, `react-router-dom` |

### `src/features/customer/address/AddressPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `AddressPage` (default) |
| **State** | `addresses`, `isLoading`, `showAddForm`, `editing`, `newAddress`, `isSubmitting`, `deletingId` |
| **API calls** | `addressApi.getAll()`, `addressApi.create()`, `addressApi.update()`, `addressApi.delete()`, `addressApi.setDefault()` |
| **Key features** | Full CRUD for delivery addresses; default address selection with star icon; add/edit inline form; delete with per-item loading state |
| **Dependencies** | `addressApi`, `lucide-react`, `sonner` |

### `src/features/customer/favorites/FavoritesPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `FavoritesPage` (default) |
| **State** | `activeTab`, `favStores`, `favFoods`, `isLoading` |
| **API calls** | `favoriteApi.getStores()`, `favoriteApi.getFoods()`, `favoriteApi.removeStore()`, `favoriteApi.removeFood()` |
| **Key features** | Two tabs: "Cửa hàng" (stores) and "Món ăn" (food items); unfavorite action with confirmation; navigates to detail pages |
| **Dependencies** | `favoriteApi`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/customer/reviews/MyReviewsPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `MyReviewsPage` (default) |
| **State** | `reviews`, `isLoading`, `deletingId` |
| **API calls** | `reviewApi.getMyReviews()`, `reviewApi.delete(id)` |
| **Key features** | Star rating display; store reply section; delete review action with loading state |
| **Dependencies** | `reviewApi`, `lucide-react`, `sonner` |

### `src/features/customer/notifications/NotificationsPage.tsx`
| Aspect | Details |
|---|---|
| **Export** | `NotificationsPage` (default) |
| **State** | `notifications`, `isLoading` |
| **API calls** | `notificationApi.getAll()`, `notificationApi.markRead()`, `notificationApi.markAllRead()`, `notificationApi.delete()` |
| **Key features** | Unread count badge; "Mark all read" button; individual mark-read/delete; unread items highlighted with blue left border |
| **Dependencies** | `notificationApi`, `lucide-react`, `sonner` |

### `src/features/customer/pages/Profile.tsx`
| Aspect | Details |
|---|---|
| **Export** | `CustomerProfile` (default) |
| **State** | `profile`, `loading`, `error`, `signingOut`, `isEditing`, `editForm`, `isSaving` |
| **API calls** | `userApi.profile()`, `userApi.editProfile()`, `userApi.signOut()` |
| **Key features** | Avatar display; role + balance info; edit profile modal (name, email, phone, address); sign out with localStorage cleanup; quick-link buttons (orders, wallet, addresses, favorites, reviews) |
| **Dependencies** | `userApi`, `authStorage`, `react-router-dom`, `lucide-react`, `sonner` |

### Placeholder Pages / Components
- `src/features/customer/pages/Home.tsx` — Simple `CustomerHome` grid placeholder
- `src/features/customer/pages/Orders.tsx` — Simple `CustomerOrders` placeholder  
- `src/features/customer/pages/Store.tsx` — Simple `CustomerStore` placeholder
- `src/features/customer/pages/index.ts` — Barrel export: Home, Store, Orders, Profile
- `src/features/customer/components/Cart.tsx` — Simple Cart placeholder
- `src/features/customer/components/Layout.tsx` — Simple CustomerLayout placeholder (header+nav+footer)
- `src/features/customer/components/SearchBar.tsx` — Simple SearchBar placeholder
- `src/features/customer/components/index.ts` — Barrel export: Layout, SearchBar, Cart
- `src/features/customer/index.ts` — Re-exports from pages + components

---

## 9. Admin Features

### `src/features/admin/layout/AdminLayout.tsx`
| Aspect | Details |
|---|---|
| **Export** | `AdminLayout` (default) |
| **State** | `isSidebarOpen`, `isMobile` |
| **Key features** | Dark-themed sidebar; 6 menu items (Dashboard, Users, Stores, Categories, Vouchers, Transactions); collapsible on mobile; top nav with search/notification/settings icons; active route highlighting with orange accent; `<Outlet />` for content |
| **Dependencies** | `react-router-dom`, `lucide-react`, `authStorage` |

### `src/features/admin/pages/Dashboard.tsx` (313 lines)
| Aspect | Details |
|---|---|
| **Export** | `AdminDashboard` (default) |
| **State** | `allStores`, `pendingStores`, `loading`, `approvingId` |
| **API calls** | `storeApi.getAll()`, `adminApi.getPendingStores()`, `adminApi.approveStore(id)` |
| **Key features** | Stats cards (total/active/open stores, pending count); revenue chart placeholder area; pending store approval table with approve action + detail link |
| **Dependencies** | `storeApi`, `adminApi`, `lucide-react`, `sonner` |

### `src/features/admin/dashboard/Dashboard.tsx`
| Aspect | Details |
|---|---|
| **Export** | `Dashboard` (default) |
| **State** | None (uses mock data) |
| **Key features** | Alternative dashboard using recharts; `LineChart` for revenue trends (mock REVENUE_DATA); `PieChart` for category distribution (mock CATEGORY_DATA); pending store cards (mock PENDING_STORES); static stats row |
| **Dependencies** | `recharts` (LineChart, PieChart, etc.) |

### `src/features/admin/users/UserManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `UserManagement` (default) |
| **State** | `users`, `loading`, `searchTerm`, `filterStatus`, `lockingId` |
| **API calls** | `fetch('/api/users')` (direct fetch, not axios), `adminApi.lockUser(userId)` |
| **Key features** | User table with search + status filter ("all"/"active"/"locked"); lock/unlock toggle per user; avatar initial display; role badges; static pagination UI |
| **Dependencies** | `adminApi`, `lucide-react`, `sonner` |

### `src/features/admin/stores/StoreManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `StoreManagement` (default) |
| **State** | `stores`, `pendingStores`, `loading`, `searchTerm`, `tab`, `approvingId` |
| **API calls** | `storeApi.getAll()`, `adminApi.getPendingStores()`, `adminApi.approveStore(id)` |
| **Key features** | "Tất cả"/"Chờ duyệt" tabs; search filter; store cards with image, address, phone, status badges; approve action for pending stores |
| **Dependencies** | `storeApi`, `adminApi`, `lucide-react`, `sonner` |

### `src/features/admin/categories/CategoryManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `CategoryManagement` (default) |
| **State** | `categories`, `isModalOpen`, `editing`, `formData { name, description, imageSrc }` |
| **API calls** | `foodTypeApi.getAll()`, `foodTypeApi.create()`, `foodTypeApi.update()`, `foodTypeApi.delete()` |
| **Key features** | Category grid with image thumbnails; add/edit modal with name + description + image URL fields; delete action |
| **Dependencies** | `foodTypeApi`, `lucide-react`, `sonner` |

### `src/features/admin/vouchers/VoucherManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `VoucherManagement` (default) |
| **State** | `vouchers`, `isLoading`, `isModalOpen`, `editing`, `form { code, name, description, type, value, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, usedCount, storeId, isActive }` |
| **API calls** | `voucherApi.getActive()`, `voucherApi.create()`, `voucherApi.update()`, `voucherApi.delete()` |
| **Key features** | Voucher card grid with discount display; comprehensive create/edit modal with all fields (code, name, type, value, date range, limits); active/inactive status; type icons (Percentage/Fixed/FreeShip) |
| **Dependencies** | `voucherApi`, `VoucherType`, `VoucherTypeName`, `lucide-react`, `sonner` |

### `src/features/admin/transactions/Transactions.tsx`
| Aspect | Details |
|---|---|
| **Export** | `Transactions` (default) |
| **State** | `transactions`, `loading`, `searchTerm`, `page` |
| **API calls** | `walletApi.getTransactions()` (paginated) |
| **Key features** | Transaction table with credit (green) / debit (red) indicators; search filter; pagination controls; formatted VND amounts; date display |
| **Dependencies** | `walletApi`, `lucide-react` |

### `src/features/admin/settings/Settings.tsx`
- **Export:** `Settings` (default)
- Placeholder: renders "Settings" text only

### Barrel Exports
- `src/features/admin/index.ts` — Re-exports pages + components
- `src/features/admin/components/index.ts` — Barrel: Layout, Header
- `src/features/admin/components/Header.tsx` — Simple `AdminHeader` placeholder
- `src/features/admin/components/Layout.tsx` — Simple `AdminLayout` placeholder (sidebar+main)
- `src/features/admin/pages/index.ts` — Barrel: Dashboard, Orders, Stores
- `src/features/admin/pages/Orders.tsx` — Simple `AdminOrders` placeholder table
- `src/features/admin/pages/Stores.tsx` — Simple `AdminStores` placeholder

---

## 10. Manager Features

### `src/features/manager/layout/ManagerLayout.tsx`
| Aspect | Details |
|---|---|
| **Export** | `ManagerLayout` (default) |
| **State** | `isSidebarOpen`, `isMobile` |
| **Key features** | Top navigation bar + collapsible sidebar; 6 menu items (Dashboard, Orders, Menu, Reviews, Tenants, Store Profile); mobile responsive with overlay; search bar in top nav; quick stats panel in sidebar footer; logout button clears auth + redirects to login |
| **Dependencies** | `react-router-dom`, `lucide-react`, `authStorage` |

### `src/features/manager/dashboard/RevenueAnalytics.tsx`
| Aspect | Details |
|---|---|
| **Export** | `RevenueAnalytics` (default) |
| **State** | None (uses static mock data) |
| **Key features** | 3 stats cards (Today's Revenue, Total Orders, Avg Order Value) with trend indicators; weekly bar chart (CSS-based, not recharts); top-selling items with progress bars; export report button (non-functional); date range selector (non-functional) |
| **Dependencies** | `lucide-react` |

### `src/features/manager/orders/OrderDashboard.tsx`
| Aspect | Details |
|---|---|
| **Export** | `OrderDashboard` (default) |
| **State** | `activeTab`, `orders`, `isLoading`, `isOpen`, `storeId` |
| **API calls** | `userApi.profile()`, `storeApi.getAll()`, `orderApi.getStoreOrders(storeId)`, `orderApi.updateStatus(orderId, status)` |
| **Key features** | Store open/close toggle (visual only); today revenue summary card; status-based tab navigation (Pending → Confirmed → Preparing → Ready → Delivering); order cards show customer info, items, notes, payment method; status-specific action buttons (Confirm, Prepare, Ready, Deliver); auto-refresh every 15 seconds; order counts in tab badges |
| **Dependencies** | `userApi`, `storeApi`, `orderApi`, `OrderStatus`, `OrderStatusName`, `PaymentMethodName`, `react-router-dom`, `lucide-react`, `sonner` |

### `src/features/manager/menu/MenuManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `MenuManagement` (default) |
| **State** | `selectedCategory`, `searchTerm`, `isModalOpen`, `menuItems`, `allFoods`, `categories`, `loading`, `storeId`, `editing`, `isCatModalOpen`, `newCatName`, `form { foodId, sizeId, price, isAvailable }` |
| **API calls** | `foodStoreApi.getMyStore()`, `foodStoreApi.create()`, `foodStoreApi.update()`, `foodStoreApi.delete()`, `foodTypeApi.getAll()`, `foodTypeApi.create()`, `foodTypeApi.delete()`, `foodApi.getAll()`, `userApi.profile()`, `storeApi.getAll()` |
| **Key features** | Left sidebar with category filter + category CRUD modal (add/delete); main table with food items showing food name, size, price, availability; search filter; add/edit food-store item modal (select food dropdown, size, price, availability toggle); auto-discovers storeId from profile → store matching |
| **Dependencies** | `foodStoreApi`, `foodTypeApi`, `foodApi`, `userApi`, `storeApi`, `lucide-react`, `sonner` |

### `src/features/manager/profile/StoreProfile.tsx`
| Aspect | Details |
|---|---|
| **Export** | `StoreProfile` (default) |
| **State** | `store`, `loading` |
| **API calls** | `userApi.profile()`, `storeApi.getAll()` |
| **Key features** | Read-only store profile display; cover photo banner with store name + verification status; circular profile logo; 12-column grid layout; basic info card (name, phone, description); location card with coordinates; operating hours card (openTime/closeTime); status card showing approval, active, and store ID; dark mode support throughout |
| **Dependencies** | `userApi`, `storeApi`, `StoreDto`, `lucide-react`, `sonner` |

### `src/features/manager/reviews/ManagerReviews.tsx`
| Aspect | Details |
|---|---|
| **Export** | `ManagerReviews` (default) |
| **State** | `reviews`, `isLoading`, `replyingTo`, `replyText`, `isSending` |
| **API calls** | `userApi.profile()`, `storeApi.getAll()`, `reviewApi.getByStore(storeId)`, `reviewApi.reply(reviewId, text)` |
| **Key features** | Lists all reviews for the manager's store; inline reply form per review (shows only for un-replied reviews); existing replies shown in green box; star rating display; customer name avatar; food name tag; Enter key to submit reply |
| **Dependencies** | `reviewApi`, `storeApi`, `userApi`, `cn()`, `lucide-react`, `sonner` |

### `src/features/manager/tenants/TenantManagement.tsx`
| Aspect | Details |
|---|---|
| **Export** | `TenantManagement` (default) |
| **State** | `tenants`, `isLoading`, `showForm`, `editing`, `form { name }` |
| **API calls** | `tenantApi.getAll()`, `tenantApi.create()`, `tenantApi.update()`, `tenantApi.delete()` |
| **Key features** | Full CRUD for tenants; responsive grid of tenant cards; create/edit modal with name field; delete with confirm dialog; creation date display |
| **Dependencies** | `tenantApi`, `lucide-react`, `sonner` |

---

## Cross-Cutting Patterns

### Authentication Flow
1. User logs in via `LoginPage` → `userApi.login()` → JWT token stored in `localStorage`
2. JWT payload decoded in `authStorage.getUserFromToken()` to extract role
3. Role stored separately in `localStorage` for quick access
4. Axios interceptor attaches `Authorization: Bearer` header on every request
5. `RequireRole` route guard checks token + role before rendering protected routes
6. 401 responses trigger automatic logout + redirect to `/login`

### Store Discovery Pattern (Manager)
Manager features need to find "my store." Common pattern seen in OrderDashboard, MenuManagement, StoreProfile, ManagerReviews:
```
1. userApi.profile() → get current user's ID
2. storeApi.getAll() → get all stores
3. stores.find(s => s.managerId === profile.id) → find matching store
```
Exception: `foodStoreApi.getMyStore()` provides a direct API for this in MenuManagement.

### Cart Implementation
Cart is stored server-side using `/api/users/temp-data` as a JSON blob. Frontend serializes/deserializes cart state through `userApi.getCart()` / `userApi.updateCart()` / `userApi.clearCart()`. LocalStorage is used as fallback when API fails.

### Response Auto-Unwrapping
The axios response interceptor automatically extracts `data.result` when `data.message === "Success"`, so API consumers receive the unwrapped payload directly. This is why most API call handlers do `const res = await someApi.method(); const data = res.data;` — `data` is already the unwrapped result.

### Vietnamese UI Language
All user-facing labels and messages are in Vietnamese, consistent with the Vietnamese market target.

### Dark Mode
Tailwind's `dark:` variant is used extensively, particularly in admin and manager layouts (dark backgrounds like `#1a120b`, `#2d1b15`). The customer-facing pages primarily use light mode.

---

## File Inventory Summary

| Domain | Files | Pages/Components |
|---|---|---|
| Config | 9 | — |
| Core (`src/`) | 4 | Entry, Router, CSS |
| API | 1 | 15 API objects |
| Types | 4 | ~50 interfaces, 8 enums |
| UI Components | 5 | Badge, Button, Card, Input, Modal |
| Utilities | 3 | cn, authStorage, roleRedirect |
| Routes | 1 | RequireRole guard |
| Customer | ~25 | 17 active pages + 8 placeholders/barrels |
| Admin | ~15 | 8 active pages + 7 placeholders/barrels |
| Manager | 6 | 6 active pages |
| **Total** | **~73 files** | |
