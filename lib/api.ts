import axios from 'axios';

export const API_URL = 'https://mahall-bk.up.railway.app/api';

// export const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies/sessions if used, and CORS
});

// Request Interceptor (Attach Token)
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor (Unwrap Data & Handle Refresh)
api.interceptors.response.use(
    (response) => {
        // Standardize: If response follows { status: true, data: ... }, return data directly
        // to keep frontend code compatible.
        if (response.data && response.data.status === true && response.data.data !== undefined) {
            // Wait, the calling code is `(await api.get(...)).data`.
            // If we return `response`, then `response.data` will be the unwrapped data.
            response.data = response.data.data;
            return response;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle Standardized Error from Backend
        if (error.response && error.response.data && error.response.data.status === false) {
            // You might want to propagate the message more clearly
            error.message = error.response.data.message || error.message;
        }

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
            originalRequest._retry = true;
            try {
                if (typeof window !== 'undefined') {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        // New standardized response for refresh: { status: true, data: { accessToken } }
                        // But axios.post here is raw, so we need to check data structure
                        const newAccessToken = data.data?.accessToken || data.accessToken; // handle both just in case

                        localStorage.setItem('accessToken', newAccessToken);
                        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Logout if refresh fails
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
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

export const getDues = async (params: any) => (await api.get('/collections/dues', { params })).data;

export const getCollectionPeriods = async () => (await api.get('/collections/periods')).data;

export const generateDue = async (data: { entityType: 'House' | 'Member', entityId: string, period: string }) =>
    (await api.post('/collections/generate/single', data)).data;

export const payDue = async (data: { dueId: string, amount: number, accountId: string, paymentMethod?: string }) =>
    (await api.post('/collections/pay', data)).data;

// --- Accounts ---
export const getAccounts = async () => (await api.get('/accounts')).data;

export const initiateRejection = async (dueId: string) => (await api.post('/collections/reject/initiate', { dueId })).data;
export const confirmRejection = async (dueId: string, otp: string) => (await api.post('/collections/reject/confirm', { dueId, otp })).data;

export const getArrearsSummary = async (params: any) => (await api.get('/collections/arrears', { params })).data;
export const sendArrearsReminder = async (data: { entityId: string, entityType: string }) =>
    (await api.post('/collections/remind/summary', data)).data;

export const getPublicEntityDues = async (type: string, id: string) =>
    (await api.get(`/collections/public/${type}/${id}/dues`)).data;

export const getPublicEntityDetails = async (type: string, id: string) =>
    (await api.get(`/collections/public/${type}/${id}/details`)).data;

// --- Rent Collections ---
export const getRentDues = async (params: any) => (await api.get('/contracts/rent/dues', { params })).data;

export const getRentPeriods = async () => (await api.get('/contracts/rent/periods')).data;

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
    dueId: string;
    entityId: string;
    name: string;
    contact: string;
    receipt_note?: string;
}) => (await api.post('/payment-gateway/create-order', data)).data;

export const createDonationOrder = async (data: {
    amount: number;
    name: string;
    contact: string;
}) => (await api.post('/payment-gateway/create-order', {
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

// --- Certificates ---
export const getCertificates = async () => (await api.get('/certificates')).data;
export const getCertificateById = async (id: string) => (await api.get(`/certificates/${id}`)).data;
export const createCertificate = async (data: any) => (await api.post('/certificates', data)).data;
export const updateCertificate = async (id: string, data: any) => (await api.put(`/certificates/${id}`, data)).data;

export default api;
