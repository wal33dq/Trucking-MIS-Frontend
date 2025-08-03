import axios from 'axios';
import { Role } from './types';

// Set up an Axios instance
export const api = axios.create({
  baseURL: 'https://ec2-13-57-233-205.us-west-1.compute.amazonaws.com:3000', // Your NestJS backend URL
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const login = (data: any) => api.post('/auth/login', data);

// --- Users ---
export const createUser = (data: any) => api.post('/users', data);
export const findUsersByRole = (role: Role) => api.get(`/users?role=${role}`);
export const findAllUsers = () => api.get('/users');


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

export const getMyAssignments = () => api.get('/tasks/my-assignments');
export const getTaskById = (id: string) => api.get(`/tasks/${id}`);
export const submitTask = (id: string, data: any) => api.post(`/tasks/submit/${id}`, data);
export const getSubmittedTasks = () => api.get('/tasks/dispatch/pending');
export const invoiceTask = (id: string, data: any) => api.post(`/tasks/dispatch/${id}/invoice`, data);
