import api from './api';
import { logger } from '../utils/logger';

function toNum(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const s = String(v).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.results && Array.isArray(payload.results)) return payload.results;
  return [];
}

function unwrapAxiosData(response) {
  const body = response?.data;
  if (!body || typeof body !== 'object') return {};
  const inner = body.data != null ? body.data : body;
  if (!inner || typeof inner !== 'object') return {};
  if (inner.stats && typeof inner.stats === 'object') return inner.stats;
  if (inner.metrics && typeof inner.metrics === 'object') return inner.metrics;
  return inner;
}

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeContractsDistribution(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    pending: toNum(firstDefined(raw, ['pending', 'pendiente', 'pending_count'])),
    inProgress: toNum(
      firstDefined(raw, ['inProgress', 'in_progress', 'en_progreso', 'activo'])
    ),
    completed: toNum(
      firstDefined(raw, ['completed', 'completado', 'cerrado', 'completed_count'])
    ),
    cancelled: toNum(firstDefined(raw, ['cancelled', 'cancelado', 'cancelled_count'])),
  };
}

/**
 * Aplana claves camelCase / snake_case del backend hacia el shape que consume AdminStats.jsx
 */
function normalizeDashboardStats(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw;
  const out = {};
  const pickN = (...keys) => {
    const v = firstDefined(r, keys);
    if (v === undefined || v === null) return undefined;
    return toNum(v, 0);
  };

  const tu = pickN('totalUsers', 'total_users', 'users_total');
  if (tu !== undefined) out.totalUsers = tu;
  const tw = pickN('totalWorkers', 'total_workers', 'workers_count');
  if (tw !== undefined) out.totalWorkers = tw;
  const tc = pickN('totalClients', 'total_clients', 'clients_count');
  if (tc !== undefined) out.totalClients = tc;
  const vw = pickN('verifiedWorkers', 'verified_workers');
  if (vw !== undefined) out.verifiedWorkers = vw;
  const pw = pickN('pendingWorkers', 'pending_workers');
  if (pw !== undefined) out.pendingWorkers = pw;
  const ac = pickN(
    'activeContracts',
    'active_contracts',
    'contracts_active',
    'contratos_activos'
  );
  if (ac !== undefined) out.activeContracts = ac;
  const pd = pickN('pendingDocuments', 'pending_documents', 'documents_pending');
  if (pd !== undefined) out.pendingDocuments = pd;

  const mr = firstDefined(r, ['monthlyRevenue', 'monthly_revenue', 'ingresos_mes']);
  if (mr !== undefined && mr !== null) out.monthlyRevenue = toNum(mr, 0);
  const pmr = firstDefined(r, [
    'previousMonthlyRevenue',
    'previous_monthly_revenue',
  ]);
  if (pmr !== undefined && pmr !== null) out.previousMonthlyRevenue = toNum(pmr, 0);
  const ptu = firstDefined(r, ['previousTotalUsers', 'previous_total_users']);
  if (ptu !== undefined && ptu !== null) out.previousTotalUsers = toNum(ptu, 0);
  const pac = firstDefined(r, [
    'previousActiveContracts',
    'previous_active_contracts',
  ]);
  if (pac !== undefined && pac !== null) out.previousActiveContracts = toNum(pac, 0);
  const ppd = firstDefined(r, [
    'previousPendingDocuments',
    'previous_pending_documents',
  ]);
  if (ppd !== undefined && ppd !== null) out.previousPendingDocuments = toNum(ppd, 0);

  const growthRaw = firstDefined(r, [
    'userGrowthData',
    'user_growth_data',
    'user_growth',
    'users_growth',
  ]);
  if (Array.isArray(growthRaw) && growthRaw.length > 0) {
    out.userGrowthData = growthRaw.map((p) => ({
      month: p.month ?? p.mes ?? p.label ?? p.period ?? '',
      users: toNum(p.users ?? p.count ?? p.total ?? p.usuarios, 0),
    }));
  }

  const recentRaw = firstDefined(r, [
    'recentActivity',
    'recent_activity',
    'activities',
  ]);
  if (Array.isArray(recentRaw) && recentRaw.length > 0) {
    out.recentActivity = recentRaw;
  }

  const cd = firstDefined(r, ['contractsDistribution', 'contracts_distribution']);
  const dist = normalizeContractsDistribution(cd);
  if (dist) out.contractsDistribution = dist;

  return out;
}

function userRegisteredAt(u) {
  const raw =
    u.fecha_registro ?? u.createdAt ?? u.created_at ?? u.fechaCreacion ?? null;
  if (raw == null || raw === '') return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sumContractMontoInCalendarMonth(contracts, year, monthIndex) {
  return contracts.reduce((sum, c) => {
    const raw = c.fecha_creacion ?? c.fechaCreacion ?? c.createdAt;
    if (!raw) return sum;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return sum;
    if (d.getFullYear() === year && d.getMonth() === monthIndex) {
      return sum + toNum(c.monto, 0);
    }
    return sum;
  }, 0);
}

function buildUserGrowthLast6Months(usersList) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      y: d.getFullYear(),
      m: d.getMonth(),
      month: d.toLocaleString('es', { month: 'short' }),
      users: 0,
    });
  }
  for (const u of usersList) {
    const rd = userRegisteredAt(u);
    if (!rd) continue;
    const b = buckets.find((x) => x.y === rd.getFullYear() && x.m === rd.getMonth());
    if (b) b.users += 1;
  }
  return buckets.map(({ month, users }) => ({ month, users }));
}

function buildRecentActivityFromUsers(usersList) {
  return [...usersList]
    .map((u) => ({ u, t: userRegisteredAt(u) }))
    .filter((x) => x.t)
    .sort((a, b) => b.t - a.t)
    .slice(0, 5)
    .map(({ u }) => ({
      user: u.nombre || u.email || `Usuario #${u.id}`,
      userType: u.tipo_usuario === 'trabajador' ? 'trabajador' : 'cliente',
      action:
        u.tipo_usuario === 'trabajador'
          ? 'registered as worker'
          : 'registered',
      timestamp: u.fecha_registro ?? u.createdAt ?? u.created_at,
      avatar: u.foto_perfil || null,
    }));
}

function mergeDashboardWithApi(aggregated, apiPartial) {
  const merged = { ...aggregated };
  const apiMr = toNum(apiPartial.monthlyRevenue, 0);
  const apiPmr = toNum(apiPartial.previousMonthlyRevenue, 0);
  if (apiMr > 0) merged.monthlyRevenue = apiMr;
  if (apiPmr > 0) merged.previousMonthlyRevenue = apiPmr;

  const apiGrowth = apiPartial.userGrowthData;
  if (Array.isArray(apiGrowth) && apiGrowth.length > 0) {
    merged.userGrowthData = apiGrowth.map((p) => ({
      month: p.month ?? p.mes ?? p.label ?? p.period ?? '',
      users: toNum(p.users ?? p.count ?? p.total ?? p.usuarios, 0),
    }));
  }

  const apiActivity = apiPartial.recentActivity;
  if (Array.isArray(apiActivity) && apiActivity.length > 0) {
    merged.recentActivity = apiActivity;
  }

  const apiDist = normalizeContractsDistribution(
    apiPartial.contractsDistribution ?? apiPartial.contracts_distribution
  );
  if (
    apiDist &&
    (apiDist.pending > 0 ||
      apiDist.inProgress > 0 ||
      apiDist.completed > 0 ||
      apiDist.cancelled > 0)
  ) {
    merged.contractsDistribution = apiDist;
  }

  return merged;
}

const adminService = {
  // ============ CATEGORÍAS ============
  async getCategories() {
    const response = await api.get('/services/categories');
    return response.data.data || response.data;
  },

  async createCategory(categoryData) {
    const response = await api.post('/services/categories', categoryData);
    return response.data.data || response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await api.patch(`/services/categories/${id}`, categoryData);
    return response.data.data || response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/services/categories/${id}`);
    return response.data.data || response.data;
  },

  // ============ DOCUMENTOS ============
  async getPendingDocuments() {
    const response = await api.get('/documents', {
      params: { estadoVerificacion: 'pendiente' }
    });
    return response.data.data || response.data;
  },

  async getAllDocuments(filters = {}) {
    const response = await api.get('/documents', { params: filters });
    return response.data.data || response.data;
  },

  async verifyDocument(documentId, verificationData) {
    const response = await api.post(`/documents/${documentId}/verify`, verificationData);
    return response.data.data || response.data;
  },

  // ============ CONTRATOS ============
  async getAllContracts(filters = {}) {
    const response = await api.get('/contracts', { params: filters });
    return response.data.data || response.data;
  },

  async updateContractStatus(contractId, statusData) {
    const response = await api.post(`/contracts/${contractId}/estado`, statusData);
    return response.data.data || response.data;
  },

  async getContractHistory(contractId) {
    const response = await api.get(`/contracts/${contractId}/historial`);
    return response.data.data || response.data;
  },

  // ============ USUARIOS ============
  async getAllUsers(filters = {}) {
    const response = await api.get('/users', { params: filters });
    return response.data.data || response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data.data || response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.patch(`/users/${userId}`, userData);
    return response.data.data || response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data.data || response.data;
  },

  async suspendUser(userId, reason) {
    const response = await api.post(`/users/${userId}/suspend`, { reason });
    return response.data.data || response.data;
  },

  // ✨ NUEVO: Verificación de trabajadores
  async getPendingWorkers() {
    const response = await api.get('/users/pending-workers');
    return response.data.data || response.data;
  },

  async verifyWorker(userId, verified) {
    const response = await api.patch(`/users/${userId}/verify`, { verified });
    return response.data.data || response.data;
  },

  async getWorkers(onlyVerified = false) {
    const response = await api.get('/users/workers', {
      params: { verified: onlyVerified ? 'true' : undefined }
    });
    return response.data.data || response.data;
  },

  // ============ ROLES ADMINISTRATIVOS ============
  async getAllRoles() {
    const response = await api.get('/roles');
    return response.data.data || response.data;
  },

  async createRole(roleData) {
    const response = await api.post('/roles', roleData);
    return response.data.data || response.data;
  },

  async assignRole(assignmentData) {
    const response = await api.post('/roles/assign', assignmentData);
    return response.data.data || response.data;
  },

  async removeRole(userId, roleId) {
    const response = await api.delete(`/roles/remove/${userId}/${roleId}`);
    return response.data.data || response.data;
  },

  async getUserRoles(userId) {
    const response = await api.get(`/roles/user/${userId}`);
    return response.data.data || response.data;
  },

  // ============ ESTADÍSTICAS ============
  async aggregateAdminStatsFromSources(period = 'month') {
    const [usersSettled, contractsSettled, docsSettled] = await Promise.allSettled([
      this.getAllUsers(),
      this.getAllContracts({}),
      this.getPendingDocuments(),
    ]);

    if (usersSettled.status === 'rejected') {
      logger.error('aggregateAdminStats: getAllUsers failed', usersSettled.reason?.message);
      throw usersSettled.reason;
    }

    const usersList = asArray(usersSettled.value);
    const contractsList =
      contractsSettled.status === 'fulfilled' ? asArray(contractsSettled.value) : [];
    if (contractsSettled.status === 'rejected') {
      logger.warn(
        'aggregateAdminStats: getAllContracts skipped',
        contractsSettled.reason?.message
      );
    }
    const docsList =
      docsSettled.status === 'fulfilled' ? asArray(docsSettled.value) : [];
    if (docsSettled.status === 'rejected') {
      logger.warn(
        'aggregateAdminStats: getPendingDocuments skipped',
        docsSettled.reason?.message
      );
    }

    const now = new Date();
    const trendStart =
      period === 'week'
        ? new Date(now.getTime() - 7 * 86400000)
        : period === 'year'
          ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          : monthStart(now);

    const previousTotalUsers = usersList.filter((u) => {
      const d = userRegisteredAt(u);
      return d && d < trendStart;
    }).length;

    const activeContracts = contractsList.filter(
      (c) => c.estado === 'en_progreso' || c.estado === 'activo'
    ).length;

    const contractsDistribution = {
      pending: contractsList.filter((c) => c.estado === 'pendiente').length,
      inProgress: contractsList.filter((c) => c.estado === 'en_progreso').length,
      completed: contractsList.filter(
        (c) => c.estado === 'completado' || c.estado === 'cerrado'
      ).length,
      cancelled: contractsList.filter((c) => c.estado === 'cancelado').length,
    };

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const monthlyRevenue = sumContractMontoInCalendarMonth(
      contractsList,
      now.getFullYear(),
      now.getMonth()
    );
    const previousMonthlyRevenue = sumContractMontoInCalendarMonth(
      contractsList,
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth()
    );

    const userGrowthData = buildUserGrowthLast6Months(usersList);
    const recentActivity = buildRecentActivityFromUsers(usersList);

    return {
      totalUsers: usersList.length,
      totalWorkers: usersList.filter((u) => u.tipo_usuario === 'trabajador').length,
      totalClients: usersList.filter((u) => u.tipo_usuario === 'cliente').length,
      verifiedWorkers: usersList.filter(
        (u) => u.tipo_usuario === 'trabajador' && u.verificado
      ).length,
      pendingWorkers: usersList.filter(
        (u) => u.tipo_usuario === 'trabajador' && !u.verificado
      ).length,
      previousTotalUsers,
      activeContracts,
      previousActiveContracts: activeContracts,
      pendingDocuments: docsList.length,
      previousPendingDocuments: docsList.length,
      monthlyRevenue,
      previousMonthlyRevenue,
      userGrowthData,
      recentActivity,
      contractsDistribution,
    };
  },

  async getAdminStats(period = 'month') {
    const [statsResult, aggregatedResult] = await Promise.allSettled([
      api.get('/admin/stats', { params: { period } }),
      this.aggregateAdminStatsFromSources(period),
    ]);

    let apiPartial = {};
    if (statsResult.status === 'fulfilled') {
      apiPartial = normalizeDashboardStats(unwrapAxiosData(statsResult.value));
    } else {
      logger.error('Error loading stats:', statsResult.reason?.message);
    }

    if (aggregatedResult.status === 'fulfilled') {
      return mergeDashboardWithApi(aggregatedResult.value, apiPartial);
    }

    logger.error(
      'aggregateAdminStatsFromSources:',
      aggregatedResult.reason?.message
    );
    const usersRes = await this.getAllUsers().catch(() => []);
    const usersList = asArray(usersRes);
    return mergeDashboardWithApi(
      {
        totalUsers: usersList.length,
        totalWorkers: usersList.filter((u) => u.tipo_usuario === 'trabajador')
          .length,
        totalClients: usersList.filter((u) => u.tipo_usuario === 'cliente')
          .length,
        verifiedWorkers: usersList.filter(
          (u) => u.tipo_usuario === 'trabajador' && u.verificado
        ).length,
        pendingWorkers: usersList.filter(
          (u) => u.tipo_usuario === 'trabajador' && !u.verificado
        ).length,
        previousTotalUsers: usersList.length,
        activeContracts: 0,
        previousActiveContracts: 0,
        pendingDocuments: 0,
        previousPendingDocuments: 0,
        monthlyRevenue: 0,
        previousMonthlyRevenue: 0,
        userGrowthData: [],
        recentActivity: [],
        contractsDistribution: {
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
        },
      },
      apiPartial
    );
  },

  async getDashboardMetrics(period = 'month') {
    const [metricsResult, aggregatedResult] = await Promise.allSettled([
      api.get('/admin/metrics', { params: { period } }),
      this.aggregateAdminStatsFromSources(period),
    ]);

    let apiPartial = {};
    if (metricsResult.status === 'fulfilled') {
      apiPartial = normalizeDashboardStats(
        unwrapAxiosData(metricsResult.value)
      );
    } else {
      logger.warn(
        'admin/metrics unavailable',
        metricsResult.reason?.message
      );
    }

    if (aggregatedResult.status === 'fulfilled') {
      return mergeDashboardWithApi(aggregatedResult.value, apiPartial);
    }

    logger.error(
      'Dashboard metrics aggregate failed',
      aggregatedResult.reason?.message
    );
    const statsFallback = await this.getAdminStats(period);
    return mergeDashboardWithApi(statsFallback, apiPartial);
  },

  async getWorkersStats() {
    try {
      const response = await api.get('/admin/workers/stats');
      return response.data.data || response.data;
    } catch (error) {
      logger.error('Error loading workers stats:', error.message);
      return null;
    }
  },

  // ============ SERVICIOS (catalogo de habilidades) ============
  async getSkills(includeInactive = false) {
    const params = includeInactive ? { includeInactive: 'true' } : {};
    const response = await api.get('/skills', { params });
    return response.data.data || response.data;
  },

  async createSkill(skillData) {
    const response = await api.post('/skills', skillData);
    return response.data.data || response.data;
  },

  async updateSkill(id, skillData) {
    const response = await api.patch(`/skills/${id}`, skillData);
    return response.data.data || response.data;
  },

  async deleteSkill(id) {
    const response = await api.delete(`/skills/${id}`);
    return response.data.data || response.data;
  },
};

export default adminService;