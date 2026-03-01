export type RoleName = 'Admin' | 'Manager' | 'Customer';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'roleName';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY) as RoleName | null,

  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  setRole: (role: RoleName) => localStorage.setItem(ROLE_KEY, role),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  getUserFromToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = parseJwt(token);
      return payload;
    } catch {
      return null;
    }
  }
};

function parseJwt(token: string) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}
