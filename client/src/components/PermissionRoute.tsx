import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Permission } from "../api/auth";

interface PermissionRouteProps {
    requiredPermission: Permission;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ requiredPermission }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                Verifying permissions...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If the user has a specific array of permissions and it doesn't include the required one:
    if (user.permissions && !user.permissions.includes(requiredPermission)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Otherwise, allow access (regular users without tokens or token users with correct permissions)
    return <Outlet />;
};
