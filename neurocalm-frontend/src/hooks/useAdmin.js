import { useEffect, useState } from 'react';
import appConfig from '../config/appConfig';
import { adminService } from '../services/adminService';
import useAuthStore from '../store/authStore';

const MOCK_STATS = {
  total_users: '1,248',
  total_analyses: '8,439',
  avg_processing_time: '12.4s',
  model_accuracy: '95.3%',
};

const MOCK_USERS = [
  { id: '1', full_name: 'Dr. Sarah Admin', email: 'admin@neurocalm.com', role: 'admin', analyses_count: 342, is_active: true, created_at: '2025-06-15T10:00:00Z' },
  { id: '2', full_name: 'John Doe', email: 'user@neurocalm.com', role: 'user', analyses_count: 24, is_active: true, created_at: '2025-09-20T14:30:00Z' },
  { id: '3', full_name: 'Emily Chen', email: 'emily@research.edu', role: 'user', analyses_count: 156, is_active: true, created_at: '2025-07-03T09:15:00Z' },
  { id: '4', full_name: 'Dr. Michael Ross', email: 'mross@clinic.com', role: 'user', analyses_count: 89, is_active: true, created_at: '2025-08-12T16:45:00Z' },
  { id: '5', full_name: 'Alex Kumar', email: 'alex.k@lab.org', role: 'user', analyses_count: 12, is_active: false, created_at: '2025-11-01T11:20:00Z' },
];

const MOCK_MODEL = {
  model_type: 'Random Forest',
  version: 'v2.1.0',
  accuracy: '95.3%',
  features: '1,222',
  training_data: '10,450 samples',
  last_updated: 'Jan 15, 2026',
};

const MOCK_ANALYSES = [
  { id: 'A-1052', user: 'Dr. Sarah Admin', file: 'admin_review_batch_01.mat', result: 'Moderate', confidence: '93.0%', date: '2026-02-23', status: 'completed' },
  { id: 'A-1051', user: 'John Doe', file: 'fnirs_recording_001.mat', result: 'Very Relaxed', confidence: '92.0%', date: '2026-02-23', status: 'completed' },
  { id: 'A-1050', user: 'Emily Chen', file: 'session_morning.edf', result: 'Stressed', confidence: '87.0%', date: '2026-02-23', status: 'completed' },
  { id: 'A-1049', user: 'Dr. Sarah Admin', file: 'clinical_trial_fnirs_005.edf', result: 'Relaxed', confidence: '90.0%', date: '2026-02-22', status: 'completed' },
  { id: 'A-1048', user: 'John Doe', file: 'morning_session_feb22.edf', result: 'Relaxed', confidence: '89.0%', date: '2026-02-22', status: 'completed' },
  { id: 'A-1047', user: 'Dr. Michael Ross', file: 'post_meditation.mat', result: 'Very Relaxed', confidence: '95.0%', date: '2026-02-22', status: 'completed' },
  { id: 'A-1046', user: 'John Doe', file: 'baseline_test.csv', result: 'Moderate', confidence: '91.0%', date: '2026-02-21', status: 'completed' },
  { id: 'A-1045', user: 'Emily Chen', file: 'relaxation_study.mat', result: 'Very Relaxed', confidence: '94.0%', date: '2026-02-21', status: 'completed' },
  { id: 'A-1044', user: 'Alex Kumar', file: 'work_stress_sample.edf', result: 'Stressed', confidence: '88.0%', date: '2026-02-21', status: 'completed' },
  { id: 'A-1043', user: 'Dr. Sarah Admin', file: 'validation_set_alpha.mat', result: 'Stressed', confidence: '88.0%', date: '2026-02-20', status: 'completed' },
];

const MOCK_ANALYTICS = {
  daily: [
    { name: 'Mon', analyses: 45 },
    { name: 'Tue', analyses: 62 },
    { name: 'Wed', analyses: 38 },
    { name: 'Thu', analyses: 73 },
    { name: 'Fri', analyses: 56 },
    { name: 'Sat', analyses: 29 },
    { name: 'Sun', analyses: 41 },
  ],
  distribution: [
    { range: '0-20', count: 11 },
    { range: '21-40', count: 22 },
    { range: '41-60', count: 19 },
    { range: '61-80', count: 14 },
    { range: '81-100', count: 8 },
  ],
  total_this_week: 344,
  total_this_month: 1288,
  avg_stress_score: 43.7,
};

const MOCK_SERVER_STATUS = {
  resources: [
    { label: 'CPU Usage', value: '34%', bar: 34 },
    { label: 'Memory', value: '6.2 / 16 GB', bar: 39 },
    { label: 'Disk Usage', value: '48.3 / 100 GB', bar: 48 },
    { label: 'Network', value: '124 Mbps', bar: 62 },
  ],
  services: [
    { name: 'API Server', status: 'running', uptime: '14d 6h 32m', port: '8000' },
    { name: 'ML Inference Engine', status: 'running', uptime: '14d 6h 32m', port: '8001' },
    { name: 'PostgreSQL Database', status: 'running', uptime: '30d 2h 15m', port: '5432' },
    { name: 'Redis Cache', status: 'running', uptime: '30d 2h 15m', port: '6379' },
    { name: 'File Storage (Local)', status: 'running', uptime: '30d 2h 15m', port: '-' },
  ],
  logs: [
    { time: '14:32:05', level: 'INFO', message: 'Analysis A-1042 completed successfully (12.1s)' },
    { time: '14:31:52', level: 'INFO', message: 'File upload received: fnirs_session_12.mat (2.4 MB)' },
    { time: '14:28:11', level: 'WARN', message: 'ML inference latency above threshold (15.2s > 15s)' },
    { time: '14:25:03', level: 'INFO', message: 'User login: admin@neurocalm.com' },
  ],
};

const MOCK_SETTINGS = {
  maintenance_mode: false,
  allow_registration: true,
  max_upload_size_mb: 50,
  rate_limit_per_minute: 60,
  storage_backend: 'local',
  auto_delete_days: 90,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item).join(', ');
  }
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return fallbackMessage;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function useAdmin() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBaseData() {
      if (user?.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setLoading(true);

        if (appConfig.useMockDataEnabled) {
          await sleep(300);
          if (cancelled) {
            return;
          }
          setStats(clone(MOCK_STATS));
          setUsers(clone(MOCK_USERS));
          setModelInfo(clone(MOCK_MODEL));
          setAnalytics(clone(MOCK_ANALYTICS));
          setServerStatus(clone(MOCK_SERVER_STATUS));
          setSettings(clone(MOCK_SETTINGS));
          setAnalyses(clone(MOCK_ANALYSES));
          return;
        }

        const [statsData, usersData, modelData] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(1, 100),
          adminService.getModelInfo(),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsData);
        setUsers(usersData);
        setModelInfo(modelData);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load admin data.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBaseData();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const fetchAnalyses = async (page = 1, pageSize = 100, search = '') => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const query = search.trim().toLowerCase();
        const items = !query
          ? clone(MOCK_ANALYSES)
          : clone(MOCK_ANALYSES).filter((item) =>
              item.user.toLowerCase().includes(query)
              || item.file.toLowerCase().includes(query)
              || item.id.toLowerCase().includes(query)
            );
        setAnalyses(items);
        return items;
      }

      const response = await adminService.getAnalyses(page, pageSize, search);
      setAnalyses(response.items || []);
      return response.items || [];
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load admin analyses.'));
      throw err;
    }
  };

  const fetchAnalytics = async () => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const payload = clone(MOCK_ANALYTICS);
        setAnalytics(payload);
        return payload;
      }

      const response = await adminService.getAnalytics();
      setAnalytics(response);
      return response;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load analytics.'));
      throw err;
    }
  };

  const fetchServerStatus = async () => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const payload = clone(MOCK_SERVER_STATUS);
        setServerStatus(payload);
        return payload;
      }

      const response = await adminService.getServerStatus();
      setServerStatus(response);
      return response;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load server status.'));
      throw err;
    }
  };

  const fetchSettings = async () => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const payload = clone(MOCK_SETTINGS);
        setSettings(payload);
        return payload;
      }

      const response = await adminService.getSettings();
      setSettings(response);
      return response;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load system settings.'));
      throw err;
    }
  };

  const saveSettings = async (nextSettings) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const payload = clone(nextSettings);
        setSettings(payload);
        return payload;
      }

      const response = await adminService.updateSettings(nextSettings);
      setSettings(response);
      return response;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save system settings.'));
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
      } else {
        await adminService.deleteUser(id);
      }

      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === id
          ? { ...currentUser, is_active: false }
          : currentUser
      )));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to deactivate user.'));
      throw err;
    }
  };

  const createUser = async (payload) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const newUser = {
          id: String(Date.now()),
          full_name: payload.full_name,
          email: payload.email,
          role: payload.role || 'user',
          analyses_count: 0,
          is_active: payload.is_active !== false,
          created_at: new Date().toISOString(),
        };
        setUsers((currentUsers) => [newUser, ...currentUsers]);
        return newUser;
      }

      const created = await adminService.createUser(payload);
      setUsers((currentUsers) => [created, ...currentUsers]);
      return created;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create user.'));
      throw err;
    }
  };

  return {
    stats,
    users,
    modelInfo,
    analyses,
    analytics,
    serverStatus,
    settings,
    loading,
    error,
    createUser,
    deleteUser,
    fetchAnalyses,
    fetchAnalytics,
    fetchServerStatus,
    fetchSettings,
    saveSettings,
  };
}
