import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import ContractDetails from '../../src/pages/ContractDetails';

export default function ContractDetailsRoute() {
  return (
    <ProtectedRoute>
      <ContractDetails />
    </ProtectedRoute>
  );
}
