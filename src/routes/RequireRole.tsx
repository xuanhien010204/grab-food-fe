import { Navigate, Outlet } from 'react-router-dom';
import { authStorage, type RoleName } from '../utils/auth';

interface RequireRoleProps {
    roles: RoleName[];
}

export default function RequireRole({ roles }: RequireRoleProps) {
    const token = authStorage.getToken();
    const userRole = authStorage.getRole();

    // Not logged in → redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but wrong role → redirect to role-appropriate home
    if (userRole && !roles.includes(userRole)) {
        // Send them to their own home page
        if (userRole === 'Admin') return <Navigate to="/admin" replace />;
        if (userRole === 'Manager') return <Navigate to="/manager" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
