import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleRouteProps {
    allowedRoles: string[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                Verifying access...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect based on role attempting to access unauthorized area
        // If User tries to access Admin area -> send to Dashboard
        // If Admin tries to access User area -> send to Admin Dashboard (or User Dashboard if allowed, but strict separation was requested)
        if (user.role === 'Superadmin') {
            return <Navigate to="/admin-dashboard" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
};
