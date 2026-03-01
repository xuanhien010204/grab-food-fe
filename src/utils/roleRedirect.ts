// src/utils/roleRedirect.ts
import type { RoleName } from './auth';

const normalizeRole = (role?: string | null): RoleName => {
  const r = (role || '').toLowerCase();

  // hỗ trợ nhiều kiểu backend hay trả
  if (r.includes('admin')) return 'Admin';
  if (r.includes('manager') || r.includes('store') || r.includes('tenant')) return 'Manager';
  return 'Customer';
};

export const getHomeByRole = (role?: string | null): string => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'Admin':
      return '/admin';
    case 'Manager':
      return '/manager';
    default:
      return '/';
  }
};

// (tuỳ chọn) nếu chỗ khác cần role đã chuẩn hoá
export { normalizeRole };
