import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

const DocumentsVerifier = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllDocuments({ 
        estadoVerificacion: filter !== 'todos' ? filter : undefined 
      });
      setDocuments(data);
    } catch (error) {
      console.error('Error cargando documentos:', error);
      alert('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (documentId, resultado) => {
    if (!window.confirm(`¿Confirmar ${resultado === 'aprobado' ? 'aprobación' : 'rechazo'} del documento?`)) {
      return;
    }

    try {
      await adminService.verifyDocument(documentId, {
        verificadorId: user.id,
        resultado,
        notas: verificationNotes || undefined
      });
      alert(`Documento ${resultado === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente`);
      setShowModal(false);
      setSelectedDoc(null);
      setVerificationNotes('');
      loadDocuments();
    } catch (error) {
      console.error('Error verificando documento:', error);
      alert('Error al verificar el documento');
    }
  };

  const openDocumentModal = (doc) => {
    setSelectedDoc(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoc(null);
    setVerificationNotes('');
  };

  const getStatusBadge = (estado) => {
    const badges = {
      'pendiente': { color: 'warning', text: 'Pendiente', icon: '⏳' },
      'aprobado': { color: 'success', text: 'Aprobado', icon: '✅' },
      'rechazado': { color: 'danger', text: 'Rechazado', icon: '❌' }
    };
    const badge = badges[estado] || badges['pendiente'];
    return (
      <span className={`admin-badge admin-badge--${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getDocumentIcon = (tipo) => {
    const icons = {
      'dui': '🪪',
      'licencia': '🚗',
      'titulo': '🎓',
      'certificado': '📜',
      'antecedentes': '📋'
    };
    return icons[tipo] || '📄';
  };

  if (loading) {
    return (
      <div className="admin-section__loading">
        <div className="admin-dashboard__spinner" />
        <p>Cargando documentos...</p>
      </div>
    );
  }

  const pendingCount = documents.filter(d => d.estadoVerificacion === 'pendiente').length;

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h2>Verificación de Documentos</h2>
          <p className="admin-section__subtitle">
            Revisa y verifica los documentos de los trabajadores
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="admin-section__stats">
        <div className="admin-stat-badge admin-stat-badge--warning">
          <strong>{pendingCount}</strong>
          <span>Pendientes de revisión</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--success">
          <strong>{documents.filter(d => d.estadoVerificacion === 'aprobado').length}</strong>
          <span>Aprobados</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--danger">
          <strong>{documents.filter(d => d.estadoVerificacion === 'rechazado').length}</strong>
          <span>Rechazados</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-filters">
        <button 
          className={`admin-filter-chip ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
        >
          Todos ({documents.length})
        </button>
        <button 
          className={`admin-filter-chip ${filter === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFilter('pendiente')}
        >
          ⏳ Pendientes ({pendingCount})
        </button>
        <button 
          className={`admin-filter-chip ${filter === 'aprobado' ? 'active' : ''}`}
          onClick={() => setFilter('aprobado')}
        >
          ✅ Aprobados
        </button>
        <button 
          className={`admin-filter-chip ${filter === 'rechazado' ? 'active' : ''}`}
          onClick={() => setFilter('rechazado')}
        >
          ❌ Rechazados
        </button>
      </div>

      {/* Lista de Documentos */}
      <div className="admin-cards-grid">
        {documents.map(doc => (
          <div key={doc.id} className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__user">
                <span className="admin-card__icon">
                  {getDocumentIcon(doc.tipoDocumento)}
                </span>
                <div>
                  <h4>{doc.usuario?.nombre || 'Usuario'}</h4>
                  <p className="admin-card__email">{doc.usuario?.email}</p>
                </div>
              </div>
              {getStatusBadge(doc.estadoVerificacion)}
            </div>

            <div className="admin-card__body">
              <div className="admin-card__info">
                <span className="admin-card__label">Tipo de documento:</span>
                <span className="admin-card__value">{doc.tipoDocumento}</span>
              </div>
              <div className="admin-card__info">
                <span className="admin-card__label">Fecha de carga:</span>
                <span className="admin-card__value">
                  {new Date(doc.fecha_carga).toLocaleDateString()}
                </span>
              </div>
              {doc.fecha_vencimiento && (
                <div className="admin-card__info">
                  <span className="admin-card__label">Vencimiento:</span>
                  <span className="admin-card__value">
                    {new Date(doc.fecha_vencimiento).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="admin-card__actions">
              <button 
                className="admin-btn admin-btn--secondary admin-btn--sm"
                onClick={() => window.open(doc.urlDocumento, '_blank')}
              >
                👁️ Ver Documento
              </button>
              {doc.estadoVerificacion === 'pendiente' && (
                <button 
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={() => openDocumentModal(doc)}
                >
                  ✓ Verificar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">📄</div>
          <h3>No hay documentos {filter !== 'todos' ? filter + 's' : ''}</h3>
          <p>Los documentos aparecerán aquí cuando sean subidos por los trabajadores</p>
        </div>
      )}

      {/* Modal de Verificación */}
      {showModal && selectedDoc && (
        <>
          <div className="admin-modal-overlay" onClick={closeModal} />
          <div className="admin-modal admin-modal--large">
            <div className="admin-modal__header">
              <h3>Verificar Documento</h3>
              <button className="admin-modal__close" onClick={closeModal}>×</button>
            </div>

            <div className="admin-modal__content">
              <div className="admin-verification">
                <div className="admin-verification__info">
                  <h4>Información del Usuario</h4>
                  <p><strong>Nombre:</strong> {selectedDoc.usuario?.nombre}</p>
                  <p><strong>Email:</strong> {selectedDoc.usuario?.email}</p>
                  <p><strong>Tipo:</strong> {selectedDoc.tipoDocumento}</p>
                  <p><strong>Fecha de carga:</strong> {new Date(selectedDoc.fecha_carga).toLocaleDateString()}</p>
                </div>

                <div className="admin-verification__document">
                  <h4>Vista Previa del Documento</h4>
                  <div className="admin-verification__preview">
                    <button 
                      className="admin-btn admin-btn--primary"
                      onClick={() => window.open(selectedDoc.urlDocumento, '_blank')}
                    >
                      🔗 Abrir Documento en Nueva Pestaña
                    </button>
                  </div>
                </div>

                <div className="admin-form__group">
                  <label className="admin-form__label">Notas de Verificación (opcional)</label>
                  <textarea
                    className="admin-form__textarea"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows="4"
                    placeholder="Agrega comentarios sobre la verificación..."
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button 
                className="admin-btn admin-btn--danger"
                onClick={() => handleVerify(selectedDoc.id, 'rechazado')}
              >
                ❌ Rechazar
              </button>
              <button 
                className="admin-btn admin-btn--success"
                onClick={() => handleVerify(selectedDoc.id, 'aprobado')}
              >
                ✅ Aprobar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentsVerifier;