import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState('light');
    const [loaded, setLoaded] = useState(false);

    // Initial Load when User is available
    useEffect(() => {
        if (user) {
            getSettings().then(settings => {
                if (settings.theme) {
                    setTheme(settings.theme);
                }
                setLoaded(true);
            }).catch(err => {
                // Ignore errors (e.g. offline/auth) and keep default
                console.log("Using default theme");
                setLoaded(true);
            });
        }
    }, [user]);

    // Apply Theme to DOM
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const changeTheme = async (newTheme) => {
        setTheme(newTheme);
        if (user) {
            try {
                await updateSettings({ theme: newTheme });
            } catch (e) {
                console.error("Failed to save theme", e);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme, loaded }}>
            {children}
        </ThemeContext.Provider>
    );
};
