import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return window.location.origin;
    }
    return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api`;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercept 401 Unauthorized responses to force logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Create a separate instance or helper for Auth which is at standard root or specific path
export const authApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // default for OAuth2 token
    }
});

authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Setup 401 response handling for auth instance as well
authApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const uploadFiles = async (resumes, jdFile) => {
    const formData = new FormData();

    // Append resumes
    resumes.forEach((file) => {
        formData.append('resumes', file);
    });

    // Append JD
    formData.append('job_description', jdFile);

    try {
        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (err) {
        if (err.response && err.response.data) {
            console.error("Upload Validation Error:", JSON.stringify(err.response.data, null, 2));
        }
        throw err;
    }
};

export const startAnalysis = async (jobId) => {
    const response = await api.post(`/analyze/${jobId}`);
    return response.data;
};

export const getJobStatus = async (jobId) => {
    const response = await api.get(`/status/${jobId}`);
    return response.data;
};

export const getResults = async (jobId) => {
    const response = await api.get(`/results/${jobId}`);
    return response.data;
};

// NEW: History and Usage
export const getHistory = async () => {
    const response = await api.get('/history');
    return response.data;
};

export const getUsage = async () => {
    const response = await api.get('/usage');
    return response.data;
};

export const getAnalytics = async (days = 7) => {
    const response = await api.get(`/analytics?days=${days}`);
    return response.data;
};

export const updateCandidateStatus = async (jobId, filename, status) => {
    const response = await api.put(`/results/${jobId}/${encodeURIComponent(filename)}/status`, { status });
    return response.data;
};

export const checkHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error("Health check failed:", error);
        return { status: "unhealthy" };
    }
};

export const getNotifications = async (limit = 20) => {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data;
};

export const markNotificationsRead = async (ids = null) => {
    const response = await api.post('/notifications/read', { ids });
    return response.data;
};

export const getSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSettings = async (settings) => {
    const response = await api.post('/settings', settings);
    return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('token');
    const response = await authApi.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const scheduleInterview = async (data) => {
    const response = await api.post('/interviews', data);
    return response.data;
};

export const getLoginHistory = async () => {
    const token = localStorage.getItem('token');
    const response = await authApi.get('/auth/activity', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// --- Google Calendar Integration ---

export const getGoogleAuthUrl = async () => {
    const response = await api.get('/google/auth-url');
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/google/status');
    return response.data;
};

export const disconnectGoogle = async () => {
    const response = await api.post('/google/disconnect');
    return response.data;
};
