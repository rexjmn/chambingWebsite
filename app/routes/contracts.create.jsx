import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import CreateContract from '../../src/pages/CreateContractSimple';

export default function CreateContractRoute() {
  return (
    <ProtectedRoute>
      <CreateContract />
    </ProtectedRoute>
  );
}
