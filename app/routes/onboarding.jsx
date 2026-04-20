import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import Onboarding from '../../src/pages/Onboarding';

export default function OnboardingRoute() {
  return (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  );
}
