import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import EditProfile from '../../src/pages/EditProfile';

export default function EditProfileRoute() {
  return (
    <ProtectedRoute>
      <EditProfile />
    </ProtectedRoute>
  );
}
