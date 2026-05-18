import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

const VerificarContrato = () => {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!codigo) return;
    const fetchVerification = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/contracts/verificar/${codigo}`);
        if (response.data?.status === 'success') {
          setData(response.data.data);
        } else {
          setError(response.data?.message || 'Contrato no encontrado.');
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'No se pudo verificar el contrato.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [codigo]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No registrada';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-SV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(amount);

  const estadoLabel = (estado) => {
    const map = {
      cerrado: 'Cerrado — servicio completado y pago liberado',
      activo: 'Activo — servicio en progreso',
      completado: 'Completado — pendiente de cierre',
      cancelado: 'Cancelado',
      disputado: 'En disputa',
    };
    return map[estado] || estado;
  };

  const estadoColor = (estado) => {
    if (estado === 'cerrado') return '#16a34a';
    if (estado === 'cancelado' || estado === 'disputado') return '#dc2626';
    return '#2563eb';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      {/* Logo / Branding */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img src="/LogoChambing.png" alt="Chambing" style={{ height: 48, marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: '#64748b' }}>Plataforma de servicios en El Salvador</div>
        </Link>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '36px 40px',
        maxWidth: 520,
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <ShieldCheck size={28} color="#2563eb" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              Verificación de Contrato
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Código: <strong>{codigo}</strong>
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12 }}>Verificando contrato...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <XCircle size={48} color="#dc2626" />
            <h2 style={{ color: '#dc2626', marginTop: 12 }}>Contrato no encontrado</h2>
            <p style={{ color: '#64748b' }}>{error}</p>
          </div>
        )}

        {!loading && data && (
          <div>
            {/* Estado */}
            <div style={{
              background: '#f0fdf4',
              border: `1.5px solid ${estadoColor(data.estado)}`,
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <CheckCircle size={22} color={estadoColor(data.estado)} />
              <div>
                <div style={{ fontWeight: 700, color: estadoColor(data.estado), fontSize: 14 }}>
                  {estadoLabel(data.estado)}
                </div>
                {data.fecha_cierre && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Cerrado el {formatDate(data.fecha_cierre)}
                  </div>
                )}
              </div>
            </div>

            {/* Details table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {data.categoria && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 0', color: '#64748b', width: '45%' }}>Categoría</td>
                    <td style={{ padding: '10px 0', fontWeight: 600, color: '#1e293b' }}>{data.categoria}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#64748b' }}>Contratante</td>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: '#1e293b' }}>
                    {data.empleador?.nombre} {data.empleador?.apellido_inicial}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#64748b' }}>Prestador del servicio</td>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: '#1e293b' }}>
                    {data.trabajador?.nombre} {data.trabajador?.apellido_inicial}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', color: '#64748b' }}>Monto acordado</td>
                  <td style={{ padding: '10px 0', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>
                    {formatCurrency(data.monto_total)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Disclaimer */}
            <div style={{
              marginTop: 24,
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 11,
              color: '#94a3b8',
              lineHeight: 1.5,
            }}>
              Chambing actúa únicamente como plataforma de intermediación digital entre las partes.
              Los apellidos se muestran parcialmente por privacidad.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VerificarContrato;
