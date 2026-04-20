import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import AdminDashboard from '../../src/pages/AdminDashboard';

export default function AdminRoute() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
