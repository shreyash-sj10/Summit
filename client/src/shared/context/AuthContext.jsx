import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getMe } from '../services/api';
import useUserStore from '../../store/useUserStore';
import AuthContext from './memberAuthContext.js';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('abhimat_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function login(member_id, password) {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiLogin(member_id, password);
            localStorage.setItem('abhimat_token', data.token);
            localStorage.setItem('abhimat_user', JSON.stringify(data.user));
            setUser(data.user);
            // Crucial: keep Zustand store in sync instantly
            useUserStore.getState().setUser(data.user, data.token);
            return data.user;
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }

    const logout = useCallback(() => {
        localStorage.removeItem('abhimat_token');
        localStorage.removeItem('abhimat_user');
        setUser(null);
        // Force sync Zustand store
        useUserStore.getState().logout();
    }, []);

    // Re-fetch fresh user data from server (e.g. after speeches_count changes)
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await getMe();
            setUser(data.user);
            localStorage.setItem('abhimat_user', JSON.stringify(data.user));
            useUserStore.getState().setUser(data.user);
        } catch {
            logout();
        }
    }, [logout]);

    // Sync fresh user info when a logged-in user is restored (id-stable; avoids refetch loops)
    useEffect(() => {
        if (!user?.id) return;
        void refreshUser();
    }, [user?.id, refreshUser]);

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

