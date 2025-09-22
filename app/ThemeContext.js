import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// Define the structure and colors for your themes
export const themes = {
    cute: {
        name: 'cute',
        background: ['#fde4cf', '#f7d1e4'], // Soft peach to pink gradient
        text: '#5c5c5c', // Dark grey
        subtleText: '#a7a7a7', // Lighter grey
        component: 'rgba(255, 255, 255, 0.5)', // Translucent white
        accent: '#ff8a80', // Coral pink
        success: '#77dd77', // Pastel green
        danger: '#ff6961', // Pastel red
    },
    dark: {
        name: 'dark',
        background: ['#2c3e50', '#34495e'], // Dark blue gradient
        text: '#ecf0f1', // Light grey/white
        subtleText: '#95a5a6', // Grey
        component: 'rgba(255, 255, 255, 0.1)', // Translucent white
        accent: '#e67e22', // Orange
        success: '#2ecc71', // Green
        danger: '#e74c3c', // Red
    },
    forest: {
        name: 'forest',
        background: ['#6a9113', '#141517'], // Green to dark grey gradient
        text: '#f2f2f2', // Off-white
        subtleText: '#a9a9a9', // Grey
        component: 'rgba(255, 255, 255, 0.15)',
        accent: '#a6ffcb', // Mint green
        success: '#b2fba5', // Light green
        danger: '#ff8a80', // Coral pink
    }
};

// Create the context
export const ThemeContext = createContext();

// Create a provider component
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(themes.cute); // Default theme

    // Load saved theme on initial app load
    useEffect(() => {
        const loadTheme = async () => {
            const savedThemeName = await AsyncStorage.getItem('theme');
            if (savedThemeName && themes[savedThemeName]) {
                setThemeState(themes[savedThemeName]);
            }
        };
        loadTheme();
    }, []);

    // Function to change and save the theme
    const setTheme = async (themeName) => {
        if (themes[themeName]) {
            setThemeState(themes[themeName]);
            await AsyncStorage.setItem('theme', themeName);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use the theme context easily
export const useTheme = () => useContext(ThemeContext);

