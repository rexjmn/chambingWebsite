import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import adminService from '../../services/adminService';

const AdminStats = ({ isSuperAdmin }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  useEffect(() => {
    if (stats) {
      setTimeout(() => setAnimateCards(true), 100);
    }
  }, [stats]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setAnimateCards(false);
      
      // Cargar datos reales desde el backend
      const data = await adminService.getDashboardMetrics(timeRange);
      console.log('📊 Stats loaded:', data);
      
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Mostrar mensaje de error pero intentar con stats básicas
      try {
        const basicStats = await adminService.getAdminStats(timeRange);
        setStats(basicStats);
      } catch (fallbackError) {
        console.error('Error loading basic stats:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Justo ahora';
    if (minutes === 1) return 'Hace 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Hace 1 hora';
    if (hours < 24) return `Hace ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#64748b'
      }}>
        <p>No se pudieron cargar las estadísticas</p>
        <button 
          onClick={loadStats}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers || 0,
      previous: stats.previousTotalUsers || 0,
      icon: '👥',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea'
    },
    {
      title: 'Contratos Activos',
      value: stats.activeContracts || 0,
      previous: stats.previousActiveContracts || 0,
      icon: '📝',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f5576c'
    },
    {
      title: 'Documentos Pendientes',
      value: stats.pendingDocuments || 0,
      previous: stats.previousPendingDocuments || 0,
      icon: '⏳',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe'
    },
    {
      title: 'Ingresos del Mes',
      value: `$${(stats.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      previous: stats.previousMonthlyRevenue || 0,
      icon: '💰',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: '#43e97b',
      isRevenue: true
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Estadísticas del Dashboard
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Resumen general de la plataforma
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          background: '#f1f5f9',
          borderRadius: '12px'
        }}>
          {['week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '10px',
                background: timeRange === range ? 'white' : 'transparent',
                color: timeRange === range ? '#6366f1' : '#64748b',
                fontWeight: timeRange === range ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: timeRange === range ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none'
              }}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((card, index) => {
          const trend = card.isRevenue 
            ? calculateTrend(stats.monthlyRevenue, card.previous)
            : calculateTrend(card.value, card.previous);
          const isPositive = parseFloat(trend) >= 0;

          return (
            <div
              key={index}
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: animateCards ? 'translateY(0)' : 'translateY(20px)',
                opacity: animateCards ? 1 : 0,
                transitionDelay: `${index * 100}ms`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: card.gradient,
                opacity: 0.1,
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: card.gradient,
                  borderRadius: '16px',
                  fontSize: '1.75rem',
                  boxShadow: `0 8px 24px ${card.color}40`
                }}>
                  {card.icon}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.4rem 0.8rem',
                  background: isPositive ? '#ecfdf5' : '#fef2f2',
                  color: isPositive ? '#10b981' : '#ef4444',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  <span>{isPositive ? '↑' : '↓'}</span>
                  <span>{Math.abs(trend)}%</span>
                </div>
              </div>

              <div>
                <h3 style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.02em'
                }}>
                  {card.value}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Usuarios */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Distribución de Usuarios
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Trabajadores
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats.totalWorkers || 0}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                fontSize: '1.5rem'
              }}>
                🔧
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Clientes
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats.totalClients || 0}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                fontSize: '1.5rem'
              }}>
                👤
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <div>
                <div style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Trabajadores Verificados
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>
                  {stats.verifiedWorkers || 0}
                </div>
              </div>
              <div style={{
                fontSize: '2rem'
              }}>
                ✓
              </div>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Crecimiento de Usuarios
          </h3>

          {stats.userGrowthData && stats.userGrowthData.length > 0 ? (
            <div style={{ 
              height: '200px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              padding: '1rem 0'
            }}>
              {stats.userGrowthData.slice(-6).map((data, i) => {
                const maxValue = Math.max(...stats.userGrowthData.slice(-6).map(d => d.users));
                const height = maxValue > 0 ? (data.users / maxValue) * 100 : 0;
                
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.5s ease',
                        transitionDelay: `${i * 100}ms`,
                        opacity: animateCards ? 1 : 0,
                        transform: animateCards ? 'scaleY(1)' : 'scaleY(0)',
                        transformOrigin: 'bottom'
                      }}
                    />
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.5rem',
                      fontWeight: '500'
                    }}>
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              No hay datos de crecimiento disponibles
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Actividad Reciente
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${index * 100}ms`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: activity.avatar ? 'transparent' : 'white',
                    borderRadius: '10px',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    boxShadow: activity.avatar ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}>
                    {activity.avatar ? (
                      <img 
                        src={activity.avatar} 
                        alt="" 
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      activity.userType === 'trabajador' ? '🔧' : '👤'
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: '500',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {activity.user}
                      {' '}<span style={{ color: '#64748b', fontWeight: '400' }}>
                        {activity.action === 'registered as worker' ? 'se registró como trabajador' : 
                         activity.action === 'registered' ? 'se registró' : activity.action}
                      </span>
                    </p>
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8'
                    }}>
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚠️</span>
          Requiere Atención
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div
            style={{
              padding: '1.5rem',
              background: '#fef3c7',
              borderRadius: '16px',
              borderLeft: '4px solid #f59e0b',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#f59e0b',
              marginBottom: '0.5rem'
            }}>
              {stats.pendingDocuments || 0}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Documentos por Verificar
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              background: '#dbeafe',
              borderRadius: '16px',
              borderLeft: '4px solid #3b82f6',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              {stats.pendingWorkers || 0}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Trabajadores por Verificar
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              background: '#fee2e2',
              borderRadius: '16px',
              borderLeft: '4px solid #ef4444',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {stats.contractsDistribution?.pending || 0}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Contratos Pendientes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;