// api.ts
import axios from 'axios';
import { Role } from './types';

// Set up a centralized Axios instance
export const api = axios.create({
  baseURL: 'https://icollectbackend.huburllc.com/', // Your NestJS backend URL
});

// --- UPDATED REQUEST INTERCEPTOR ---
// Add a request interceptor to automatically include the token in headers
api.interceptors.request.use(
  (config) => {
    // Prioritize 'access_token' as it's more standard.
    // This prevents an old 'token' from being used if 'access_token' exists.
    const token = localStorage.getItem('access_token') ?? localStorage.getItem('token');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// --- NEW RESPONSE INTERCEPTOR ---
// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const { status } = error.response || {};
    
    if (status === 401) {
      // --- Automatic Logout Logic ---
      // The token is invalid or expired.
      console.error('Unauthorized (401). Token is invalid. Logging out.');
      
      // Clear all possible token keys to prevent getting stuck.
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');

      // Reload the page. This will typically redirect to the login screen
      // if your app's routing is set up to protect routes.
      // Using location.href is more forceful than location.reload().
      window.location.href = '/login'; // Or your app's login path
    }
    
    return Promise.reject(error);
  },
);


// =================================================================================
// API Functions
// =================================================================================

// --- Auth ---
export const login = (data: any) => api.post('/auth/login', data);

// --- Users ---
export const createUser = (data: any) => api.post('/users', data);
export const findUsersByRole = (role: Role) => api.get(`/users?role=${role}`);
export const findAllUsers = () => api.get('/users');
export const updateUser = (id: string, data: any) => api.patch(`/users/${id}`, data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

// --- Tasks ---
export const uploadTasks = (saleAgentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/upload/${saleAgentId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// DEPRECATED: Replaced by getMyTasksByStatus
// export const getMyAssignments = () => api.get('/tasks/my-assignments');
// export const getMyFollowUpAssignments = () => api.get('/tasks/my-follow-ups');

/**
 * NEW: Get paginated tasks for the agent
 */
export const getMyTasksByStatus = (status: string, page: number, limit: number) => {
    const params = new URLSearchParams({
        status,
        page: String(page),
        limit: String(limit),
    });
    return api.get('/tasks/my-tasks', { params });
};

/**
 * NEW: Get task counts for the agent's dashboard tabs
 */
export const getMyTaskCounts = () => api.get('/tasks/my-task-counts');


export const getTaskById = (id: string) => api.get(`/tasks/${id}`);

export const submitTask = (id: string, data: FormData) => {
    return api.post(`/tasks/submit/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const saveTaskDraft = (id: string, data: any) => {
    return api.patch(`/tasks/draft/${id}`, data);
};


// --- FIX: Pointing to the correct endpoint for the Divider Dashboard ---
export const getActionRequiredTasks = () => api.get('/tasks/project-divider/action-required');
export const getDispatcherOverviewTasks = () => api.get('/tasks/project-divider/dispatcher-overview');

export const assignTaskToDispatcher = (taskId: string, dispatcherId: string) => api.patch(`/tasks/assign/${taskId}`, { dispatcherId });
export const reassignTask = (taskId: string, saleAgentId: string) => api.patch(`/tasks/reassign/${taskId}`, { saleAgentId });
export const followUpTask = (taskId: string, comment: string, followUpDate: string) => api.patch(`/tasks/follow-up/${taskId}`, { comment, followUpDate });
export const neglectTask = (taskId: string, comment: string) => api.patch(`/tasks/neglect/${taskId}`, { comment });
export const deleteTask = (taskId: string) => api.delete(`/tasks/${taskId}`);
export const deleteMultipleTasks = (taskIds: string[]) => api.delete('/tasks/batch', { data: { taskIds } });
export const getAgentTaskCounts = () => api.get('/tasks/project-divider/agent-task-counts');


export const getPendingDispatcherTasks = () => api.get('/tasks/dispatcher/pending');
export const getDispatcherTasks = () => api.get('/tasks/dispatcher/all');

export const getTasksWithBookedLoads = (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/tasks/project-divider/booked-loads`, { params });
};

export const bookLoadForTask = (taskId: string, data: any) => api.post(`/tasks/${taskId}/book-load`, data);

export const updateLoadStatus = (loadId: string, data: { status: string }) => 
  api.patch(`/tasks/loads/${loadId}/status`, data);

export const updateLoadPaymentStatus = (loadId: string, data: { paymentStatus: string }) => 
  api.patch(`/tasks/loads/${loadId}/payment-status`, data);

export const invoiceTask = (id: string, data: any) => api.post(`/tasks/dispatch/${id}/invoice`, data);

// --- Owner Dashboard ---
export const getOwnerDashboardData = () => api.get('/tasks/owner/dashboard-data');

// --- Zoom Integration ---
export const startZoomCall = (taskId: string) => {
  return api.post(`/zoom/start-call/${taskId}`);
};

export const getTasksByAgentAndStatus = (agentId: string, status: string) => {
    if (agentId === 'all') {
        return api.get(`/tasks/status/${status}`);
    }
    return api.get(`/tasks/agent/${agentId}/status/${status}`);
};
