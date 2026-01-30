import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (!user) {
                // Fetch user info if we have a token but no user data
                fetchUserInfo();
            }
        } else {
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            localStorage.removeItem('user');
        }
    }, [token]);

    const fetchUserInfo = async () => {
        try {
            const response = await authApi.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            // Preserve avatar if backend doesn't return one (since we store it locally)
            const mergedUser = { ...response.data, avatar: localUser.avatar || response.data.avatar };
            setUser(mergedUser);
            localStorage.setItem('user', JSON.stringify(mergedUser));
        } catch (err) {
            console.error("Failed to fetch user info", err);
            // If token is invalid, logout
            logout();
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const response = await authApi.post('/auth/token', params);
            const { access_token, role, full_name } = response.data;

            setToken(access_token);
            localStorage.setItem('token', access_token);

            // Set basic user info from login response
            const userData = { email, role, full_name };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return true;
        } catch (err) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async (googleToken) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/google', {
                token: googleToken
            });

            const { access_token } = response.data;
            setToken(access_token);
            localStorage.setItem('token', access_token);

            // Fetch user info after google login
            // We need to set token on authorization header immediately for this fetch
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            // We can't use fetchUserInfo() directly because token state update might be async
            // So we call endpoint directly with new token
            const userResponse = await authApi.get('/auth/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            const mergedUser = { ...userResponse.data, avatar: localUser.avatar || userResponse.data.avatar };
            setUser(mergedUser);
            localStorage.setItem('user', JSON.stringify(mergedUser));

            return true;
        } catch (err) {
            console.error("Google Login failed", err);
            setError("Google authentication failed.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, full_name, company_name) => {
        setLoading(true);
        setError(null);

        try {
            // Using the public signup endpoint with JSON content type
            await authApi.post('/auth/signup', {
                email,
                password,
                full_name,
                company_name
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Return success without auto-login
            return true;

        } catch (err) {
            console.error("Registration failed", err);
            let errorMessage = "Registration failed. Try again.";

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    // Handle Pydantic validation errors
                    errorMessage = detail.map(d => d.msg).join(', ');
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }

            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    };

    const updateUser = async (updates) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
    };

    return (
        <AuthContext.Provider value={{ token, user, login, register, googleLogin, logout, updateUser, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
