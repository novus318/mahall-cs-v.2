import { useState, useEffect } from 'react';
import api from '@/lib/axios';

interface User {
    _id: string;
    username: string;
    role: string;
    name?: string;
    contactNumber?: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get('/users/profile');
                if (data.status) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch user profile", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loading };
}
