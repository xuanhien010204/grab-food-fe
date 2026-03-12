import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import RequireRole from './routes/RequireRole';
import LoginPage from './features/customer/LoginPage';
import RegisterPage from './features/customer/RegisterPage';
import CustomerLayout from './features/customer/layout/CustomerLayout';
import HomePage from './features/customer/home/HomePage';
import CartPage from './features/customer/cart/CartPage';
import WalletPage from './features/customer/wallet/WalletPage';
import OrderHistoryPage from './features/customer/orders/OrderHistoryPage';
import OrderDetailPage from './features/customer/orders/OrderDetailPage';
import ProductDetail from './features/customer/product/ProductDetail';
import { CustomerProfile } from './features/customer/pages/Profile';
import StoresPage from './features/customer/stores/StoresPage';
import StoreDetailPage from './features/customer/stores/StoreDetailPage';
import FoodsPage from './features/customer/foods/FoodsPage';
import FoodDetailPage from './features/customer/foods/FoodDetailPage';
import AddressPage from './features/customer/address/AddressPage';
import FavoritesPage from './features/customer/favorites/FavoritesPage';
import MyReviewsPage from './features/customer/reviews/MyReviewsPage';
import PaymentResultPage from './features/customer/wallet/PaymentResultPage';
import ManagerRegistrationPage from './features/customer/pages/ManagerRegistrationPage';
import NotFoundPage from './features/NotFoundPage';
import CustomerChatPage from './features/customer/chat/CustomerChatPage';

// Admin Imports
import AdminLayout from './features/admin/layout/AdminLayout';
import AdminDashboard from './features/admin/dashboard/Dashboard';
import StoreManagement from './features/admin/stores/StoreManagement';
import CategoryManagement from './features/admin/categories/CategoryManagement';
import Transactions from './features/admin/transactions/Transactions';
import Settings from './features/admin/settings/Settings';

import VoucherManagement from './features/admin/vouchers/VoucherManagement';

// Manager Imports
import ManagerLayout from './features/manager/layout/ManagerLayout';
import OrderDashboard from './features/manager/orders/OrderDashboard';
import MenuManagement from './features/manager/menu/MenuManagement';
import StoreProfile from './features/manager/profile/StoreProfile';
import ManagerReviews from './features/manager/reviews/ManagerReviews';
import TenantManagement from './features/manager/tenants/TenantManagement';
import RevenueAnalytics from './features/manager/dashboard/RevenueAnalytics';
import ManagerVouchers from './features/manager/vouchers/ManagerVouchers';
import WithdrawalPage from './features/manager/withdrawal/WithdrawalPage';
import ManagerChatPage from './features/manager/chat/ManagerChatPage';

// Admin Extra
import WithdrawalManagement from './features/admin/withdrawal/WithdrawalManagement';

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />

        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="store/:id" element={<StoreDetailPage />} />
          <Route path="foods" element={<FoodsPage />} />
          <Route path="food/:id" element={<FoodDetailPage />} />
          <Route path="addresses" element={<AddressPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="reviews" element={<MyReviewsPage />} />
          <Route path="register-store" element={<ManagerRegistrationPage />} />
          <Route path="chat" element={<CustomerChatPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireRole roles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="stores" element={<StoreManagement />} />
            <Route path="stores/:id" element={<StoreDetailPage />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="vouchers" element={<VoucherManagement />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="settings" element={<Settings />} />
            <Route path="withdrawals" element={<WithdrawalManagement />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<RequireRole roles={['Manager', 'Admin']} />}>
        <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrderDashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="analytics" element={<RevenueAnalytics />} />
            <Route path="vouchers" element={<ManagerVouchers />} />
            <Route path="reviews" element={<ManagerReviews />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="store" element={<StoreProfile />} />
            <Route path="withdrawal" element={<WithdrawalPage />} />
            <Route path="chat" element={<ManagerChatPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
