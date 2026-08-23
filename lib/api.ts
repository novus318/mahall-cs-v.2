import axios from 'axios';

export const API_URL = 'https://api.tmj.org.in/api';

// export const API_URL = 'http://localhost:5000/api';

function getFromStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setToStorage(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // localStorage unavailable
    }
}

function removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {
        // localStorage unavailable
    }
}

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies/sessions if used, and CORS
});

// Public API instance without auth interceptors
export const publicApi = axios.create({
    baseURL: API_URL
});

// Request Interceptor (Attach Token)
api.interceptors.request.use((config) => {
    const token = getFromStorage('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor (Unwrap Data & Handle Refresh)
api.interceptors.response.use(
    (response) => {
        // Standardize: If response follows { status: true, data: ... }, return data directly
        // to keep frontend code compatible.
        if (response.data && response.data.status === true && response.data.data !== undefined) {
            if (response.data.pagination) {
                (response as any).pagination = response.data.pagination;
            }
            response.data = response.data.data;
            return response;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle Standardized Error from Backend
        if (error.response && error.response.data && error.response.data.status === false) {
            error.message = error.response.data.message || error.message;
        }

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
            originalRequest._retry = true;
            try {
                const refreshToken = getFromStorage('refreshToken');
                if (refreshToken) {
                    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    const newAccessToken = data.data?.accessToken || data.accessToken;

                    setToStorage('accessToken', newAccessToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                removeFromStorage('accessToken');
                removeFromStorage('refreshToken');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// --- Families ---
export const getFamilies = async (params?: any) => (await api.get('/families', { params })).data;
export const getAllFamilies = async (search?: string) => (await api.get('/families/all', { params: { search } })).data;
export const importFamilies = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/families/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })).data;
};
export const getFamily = async (id: string) => (await api.get(`/families/${id}`)).data;
export const createFamily = async (data: any) => (await api.post('/families', data)).data;
export const updateFamily = async (id: string, data: any) => (await api.put(`/families/${id}`, data)).data;
export const deleteFamily = async (id: string) => (await api.delete(`/families/${id}`)).data;

// --- Houses ---
export const getHouses = async (params?: any) => (await api.get('/houses', { params })).data;
export const getAllHouses = async (params?: any) => (await api.get('/houses/all', { params })).data;
export const importHouses = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/houses/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })).data;
};
export const getHouse = async (id: string) => (await api.get(`/houses/${id}`)).data;
export const createHouse = async (data: any) => (await api.post('/houses', data)).data;
export const updateHouse = async (id: string, data: any) => (await api.put(`/houses/${id}`, data)).data;
export const deleteHouse = async (id: string) => (await api.delete(`/houses/${id}`)).data;

// --- Members ---
export const getMembers = async (params?: any) => (await api.get('/members', { params })).data;
export const getAllMembers = async (params?: any) => (await api.get('/members/all', { params })).data;
export const getMember = async (id: string) => (await api.get(`/members/${id}`)).data;
export const createMember = async (data: any) => (await api.post('/members', data)).data;
export const updateMember = async (id: string, data: any) => (await api.put(`/members/${id}`, data)).data;
export const deleteMember = async (id: string) => (await api.delete(`/members/${id}`)).data;
export const moveOutMember = async (id: string) => (await api.put(`/members/${id}/move-out`)).data;
export const importMembers = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/members/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })).data;
};

// --- Collections ---
export const updateSubscription = async (type: 'house' | 'member', id: string, data: any) =>
    (await api.put(`/collections/${type}/${id}/subscription`, data)).data;

export const getDues = async (params: any) => {
    const res = await api.get('/collections/dues', { params });
    return { data: res.data, pagination: (res as any).pagination };
};

export const getCollectionPeriods = async () => (await api.get('/collections/periods')).data;

export const generateDue = async (data: { entityType: 'House' | 'Member', entityId: string, period: string }) =>
    (await api.post('/collections/generate/single', data)).data;

export const payDue = async (data: { dueId: string, amount: number, accountId: string, paymentMethod?: string }) =>
    (await api.post('/collections/pay', data)).data;

// --- Accounts ---
export const getAccounts = async () => (await api.get('/accounts')).data;

export const initiateRejection = async (dueId: string) => (await api.post('/collections/reject/initiate', { dueId })).data;
export const confirmRejection = async (dueId: string, otp: string) => (await api.post('/collections/reject/confirm', { dueId, otp })).data;

export const getArrearsSummary = async (params: any) => {
    const res = await api.get('/collections/arrears', { params });
    return { data: res.data, pagination: (res as any).pagination };
};
export const sendArrearsReminder = async (data: { entityId: string, entityType: string }) =>
    (await api.post('/collections/remind/summary', data)).data;

export const getPublicEntityDues = async (type: string, id: string) =>
    (await api.get(`/collections/public/${type}/${id}/dues`)).data;

export const getPublicEntityDetails = async (type: string, id: string) =>
    (await api.get(`/collections/public/${type}/${id}/details`)).data;

// --- Due WhatsApp Reminders ---
export const previewDueReminders = async (data: { entityType?: string, period: string, frequency?: string }) =>
    (await api.post('/reminders/preview', data)).data;

export const sendDueReminders = async (data: { name?: string, entityType?: string, period: string, frequency?: string }) =>
    (await api.post('/reminders/dues', data)).data;

export const getDueReminders = async () => (await api.get('/reminders')).data;

export const getDueReminder = async (id: string) => (await api.get(`/reminders/${id}`)).data;

export const deleteDueReminder = async (id: string) => (await api.delete(`/reminders/${id}`)).data;

// --- Public Rent ---
export const getPublicRentDetails = async (id: string) =>
    (await api.get(`/contracts/public/${id}/details`)).data;

export const getPublicRentDues = async (id: string) =>
    (await api.get(`/contracts/public/${id}/dues`)).data;

// --- Rent Collections ---
export const getRentDues = async (params: any) => {
    const res = await api.get('/contracts/rent/dues', { params });
    return { data: res.data, pagination: (res as any).pagination };
};

export const getRentPeriods = async () => (await api.get('/contracts/rent/periods')).data;

export const getIncomeExpenseReport = async (params: any) => (await api.get('/accounts/reports/income-expense', { params })).data;

export const downloadIncomeExpenseReport = async (params: any) => {
    return api.get('/accounts/reports/income-expense', {
        params: { ...params, format: 'excel' },
        responseType: 'blob'
    });
};

export const getReceivablesReport = async (params: any) => (await api.get('/accounts/reports/receivables', { params })).data;

export const downloadReceivablesReport = async (params: any) => {
    return api.get('/accounts/reports/receivables', {
        params: { ...params, format: 'excel' },
        responseType: 'blob'
    });
};

export const getPayablesReport = async (params: any) => (await api.get('/accounts/reports/payables', { params })).data;

export const downloadPayablesReport = async (params: any) => {
    return api.get('/accounts/reports/payables', {
        params: { ...params, format: 'excel' },
        responseType: 'blob'
    });
};

export const getRentArrearsSummary = async () => (await api.get('/contracts/rent/arrears')).data;

export const sendRentReminder = async (data: { contractId: string }) =>
    (await api.post('/contracts/rent/remind/summary', data)).data;

export const downloadCollectionReceipt = async (id: string) => {
    return api.get(`/collections/receipts/${id}/pdf`, {
        responseType: 'blob'
    });
};

export const createRazorpayOrder = async (data: {
    amount: number;
    type?: string;
    dueId?: string;
    rentDueId?: string;
    entityId: string;
    name: string;
    contact: string;
    receipt_note?: string;
}) => (await api.post('/payment-gateway/create-order', data)).data;

export const createDonationOrder = async (data: {
    amount: number;
    name: string;
    contact: string;
}) => (await publicApi.post('/payment-gateway/create-order', {
    amount: data.amount,
    receipt_note: `Donation from ${data.name}`,
    name: data.name,
    contact: data.contact
})).data;

export const payInventoryRent = async (transactionId: string, payload: { accountId: string, amountPaid: number }) => {
    return api.post(`/inventory/transactions/${transactionId}/pay`, payload);
};

export const getInventoryReceipts = async (transactionId: string) => {
    return api.get(`/inventory/transactions/${transactionId}/receipts`);
};

export const downloadInventoryReceiptPdf = async (id: string) => {
    return api.get(`/inventory/receipts/${id}/pdf`, {
        responseType: 'blob'
    });
};

// --- Death Registers ---
export const getDeathRegisters = async () => (await api.get('/death-registers')).data;
export const getDeathRegisterById = async (id: string) => (await api.get(`/death-registers/${id}`)).data;
export const createDeathRegister = async (data: any) => (await api.post('/death-registers', data)).data;
export const updateDeathRegister = async (id: string, data: any) => (await api.put(`/death-registers/${id}`, data)).data;
export const downloadDeathRegisterPdf = async (id: string) => {
    return api.get(`/death-registers/${id}/pdf`, {
        responseType: 'blob'
    });
};

// --- Nikah Registers ---
export const getNikahRegisters = async () => (await api.get('/nikah-registers')).data;
export const getNikahRegisterById = async (id: string) => (await api.get(`/nikah-registers/${id}`)).data;
export const createNikahRegister = async (data: any) => (await api.post('/nikah-registers', data)).data;
export const updateNikahRegister = async (id: string, data: any) => (await api.put(`/nikah-registers/${id}`, data)).data;

export default api;
