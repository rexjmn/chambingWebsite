import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import Dashboard from '../../src/pages/Dashboard';

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
