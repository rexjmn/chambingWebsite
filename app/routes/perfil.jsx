import ProtectedRoute from '../../src/components/auth/ProtectedRoute';

export default function PerfilRoute() {
  return (
    <ProtectedRoute>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Mi Perfil</h2>
        <p>Página en construcción...</p>
      </div>
    </ProtectedRoute>
  );
}
