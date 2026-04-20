import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import WorkerAvailability from '../../src/pages/availability/WorkerAvailability';

export default function AvailabilityRoute() {
  return (
    <ProtectedRoute>
      <WorkerAvailability />
    </ProtectedRoute>
  );
}
