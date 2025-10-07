import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

const ContractsManager = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadContracts();
  }, [filterStatus]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllContracts({
        estado: filterStatus !== 'todos' ? filterStatus : undefined
      });
      setContracts(data);
    } catch (error) {
      console.error('Error cargando contratos:', error);
      alert('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  const viewContractDetails = async (contract) => {
    try {
      setSelectedContract(contract);
      const historyData = await adminService.getContractHistory(contract.id);
      setHistory(historyData);
      setShowModal(true);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const updateStatus = async (contractId, newStatus) => {
    if (!window.confirm(`¿Cambiar estado del contrato a "${newStatus}"?`)) {
      return;
    }

    try {
      await adminService.updateContractStatus(contractId, {
        nuevoEstado: newStatus,
        usuarioId: user.id,
        notas: 'Actualización desde panel administrativo'
      });
      alert('Estado actualizado exitosamente');
      setShowModal(false);
      loadContracts();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del contrato');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
    setHistory([]);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente': { color: 'warning', icon: '⏳', text: 'Pendiente' },
      'en_progreso': { color: 'info', icon: '🔄', text: 'En Progreso' },
      'completado': { color: 'success', icon: '✅', text: 'Completado' },
      'cancelado': { color: 'danger', icon: '❌', text: 'Cancelado' },
      'cerrado': { color: 'muted', icon: '🔒', text: 'Cerrado' }
    };
    const badge = badges[status] || badges['pendiente'];
    return (
      <span className={`admin-badge admin-badge--${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getAvailableTransitions = (currentStatus) => {
    const transitions = {
      'pendiente': ['en_progreso', 'cancelado'],
      'en_progreso': ['completado', 'cancelado'],
      'completado': ['cerrado'],
      'cancelado': [],
      'cerrado': []
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="admin-section__loading">
        <div className="admin-dashboard__spinner" />
        <p>Cargando contratos...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h2>Gestión de Contratos</h2>
          <p className="admin-section__subtitle">
            Supervisa y gestiona todos los contratos de la plataforma
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="admin-section__stats">
        <div className="admin-stat-badge admin-stat-badge--primary">
          <strong>{contracts.length}</strong>
          <span>Total de contratos</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--info">
          <strong>{contracts.filter(c => c.estado === 'en_progreso').length}</strong>
          <span>En progreso</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--warning">
          <strong>{contracts.filter(c => c.estado === 'pendiente').length}</strong>
          <span>Pendientes</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--success">
          <strong>{contracts.filter(c => c.estado === 'completado').length}</strong>
          <span>Completados</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-filters">
        <button 
          className={`admin-filter-chip ${filterStatus === 'todos' ? 'active' : ''}`}
          onClick={() => setFilterStatus('todos')}
        >
          Todos ({contracts.length})
        </button>
        <button 
          className={`admin-filter-chip ${filterStatus === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pendiente')}
        >
          ⏳ Pendientes
        </button>
        <button 
          className={`admin-filter-chip ${filterStatus === 'en_progreso' ? 'active' : ''}`}
          onClick={() => setFilterStatus('en_progreso')}
        >
          🔄 En Progreso
        </button>
        <button 
          className={`admin-filter-chip ${filterStatus === 'completado' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completado')}
        >
          ✅ Completados
        </button>
        <button 
          className={`admin-filter-chip ${filterStatus === 'cancelado' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelado')}
        >
          ❌ Cancelados
        </button>
      </div>

      {/* Lista de Contratos */}
      <div className="admin-cards-grid">
        {contracts.map(contract => (
          <div key={contract.id} className="admin-card">
            <div className="admin-card__header">
              <div>
                <h4>📝 {contract.codigo_contrato}</h4>
                <p className="admin-card__date">
                  {new Date(contract.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
              {getStatusBadge(contract.estado)}
            </div>

            <div className="admin-card__body">
              <div className="admin-card__parties">
                <div className="admin-card__party">
                  <span className="admin-card__label">Empleador:</span>
                  <span className="admin-card__value">{contract.empleador?.nombre}</span>
                </div>
                <div className="admin-card__party">
                  <span className="admin-card__label">Trabajador:</span>
                  <span className="admin-card__value">{contract.trabajador?.nombre}</span>
                </div>
              </div>

              <div className="admin-card__info">
                <span className="admin-card__label">Categoría:</span>
                <span className="admin-card__value">{contract.categoria?.nombre}</span>
              </div>

              <div className="admin-card__info">
                <span className="admin-card__label">Monto:</span>
                <span className="admin-card__value admin-card__amount">
                  ${parseFloat(contract.monto).toFixed(2)}
                </span>
              </div>

              <div className="admin-card__dates">
                <div>
                  <span className="admin-card__label">Inicio:</span>
                  <span>{new Date(contract.fecha_inicio).toLocaleDateString()}</span>
                </div>
                {contract.fecha_fin && (
                  <div>
                    <span className="admin-card__label">Fin:</span>
                    <span>{new Date(contract.fecha_fin).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-card__actions">
              <button 
                className="admin-btn admin-btn--secondary admin-btn--sm"
                onClick={() => viewContractDetails(contract)}
              >
                👁️ Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {contracts.length === 0 && (
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">📝</div>
          <h3>No hay contratos {filterStatus !== 'todos' ? filterStatus : ''}</h3>
          <p>Los contratos aparecerán aquí cuando sean creados</p>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedContract && (
        <>
          <div className="admin-modal-overlay" onClick={closeModal} />
          <div className="admin-modal admin-modal--large">
            <div className="admin-modal__header">
              <h3>Detalles del Contrato {selectedContract.codigo_contrato}</h3>
              <button className="admin-modal__close" onClick={closeModal}>×</button>
            </div>

            <div className="admin-modal__content">
              <div className="admin-contract-details">
                {/* Información Principal */}
                <div className="admin-contract-section">
                  <h4>Información General</h4>
                  <div className="admin-info-grid">
                    <div className="admin-info-row">
                      <span className="admin-info-label">Código:</span>
                      <span className="admin-info-value">{selectedContract.codigo_contrato}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="admin-info-label">Estado:</span>
                      {getStatusBadge(selectedContract.estado)}
                    </div>
                    <div className="admin-info-row">
                      <span className="admin-info-label">Monto:</span>
                      <span className="admin-info-value">${parseFloat(selectedContract.monto).toFixed(2)}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="admin-info-label">Categoría:</span>
                      <span className="admin-info-value">{selectedContract.categoria?.nombre}</span>
                    </div>
                  </div>
                </div>

                {/* Partes del Contrato */}
                <div className="admin-contract-section">
                  <h4>Partes del Contrato</h4>
                  <div className="admin-parties-grid">
                    <div className="admin-party-card">
                      <h5>💼 Empleador</h5>
                      <p><strong>{selectedContract.empleador?.nombre}</strong></p>
                      <p>{selectedContract.empleador?.email}</p>
                      <p>{selectedContract.empleador?.telefono}</p>
                    </div>
                    <div className="admin-party-card">
                      <h5>👷 Trabajador</h5>
                      <p><strong>{selectedContract.trabajador?.nombre}</strong></p>
                      <p>{selectedContract.trabajador?.email}</p>
                      <p>{selectedContract.trabajador?.telefono}</p>
                    </div>
                  </div>
                </div>

                {/* Historial de Estados */}
                <div className="admin-contract-section">
                  <h4>Historial de Estados</h4>
                  <div className="admin-timeline">
                    {history.map((item, index) => (
                      <div key={index} className="admin-timeline-item">
                        <div className="admin-timeline-icon">
                          {getStatusBadge(item.estado_nuevo)}
                        </div>
                        <div className="admin-timeline-content">
                          <p className="admin-timeline-date">
                            {new Date(item.fecha_cambio).toLocaleString()}
                          </p>
                          <p className="admin-timeline-change">
                            {item.estado_anterior ? 
                              `Cambio de "${item.estado_anterior}" a "${item.estado_nuevo}"` :
                              `Contrato creado con estado "${item.estado_nuevo}"`
                            }
                          </p>
                          {item.notas && (
                            <p className="admin-timeline-notes">💬 {item.notas}</p>
                          )}
                          <p className="admin-timeline-user">
                            Por: {item.usuario?.nombre}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones de Estado */}
                {getAvailableTransitions(selectedContract.estado).length > 0 && (
                  <div className="admin-contract-section">
                    <h4>Cambiar Estado</h4>
                    <div className="admin-state-actions">
                      {getAvailableTransitions(selectedContract.estado).map(newState => (
                        <button
                          key={newState}
                          className="admin-btn admin-btn--primary"
                          onClick={() => updateStatus(selectedContract.id, newState)}
                        >
                          Marcar como {newState.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractsManager;