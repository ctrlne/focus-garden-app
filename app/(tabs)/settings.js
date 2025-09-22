// app/settings.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
// ADDED: Import ScrollView
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes, useTheme } from '../ThemeContext';

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme();
    const [selectedRingtone, setSelectedRingtone] = useState('ding');

    const loadSettings = useCallback(() => {
        const fetchData = async () => {
            const storedRingtone = await AsyncStorage.getItem('ringtone');
            if (storedRingtone) {
                setSelectedRingtone(storedRingtone);
            }
        };
        fetchData();
    }, []);

    useFocusEffect(loadSettings);

    const handleThemeChange = (themeName) => {
        setTheme(themeName);
    };

    const handleRingtoneChange = async (ringtoneName) => {
        setSelectedRingtone(ringtoneName);
        await AsyncStorage.setItem('ringtone', ringtoneName);
    };

    const confirmClearData = () => {
        Alert.alert(
            "Clear All Data?",
            "This will erase all your tasks, garden progress, and stats. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, Clear Everything", onPress: () => clearAllData(), style: "destructive" },
            ]
        );
    };

    const clearAllData = async () => {
        try {
            await AsyncStorage.multiRemove(['tasks', 'focusHistory', 'garden', 'theme', 'ringtone']);
            Alert.alert("Data Cleared", "Your app has been reset. Restart the app to see the changes.");
            // Also reset the theme in the app state
            setTheme('cute');
        } catch (e) {
            console.error("Failed to clear data.", e);
            Alert.alert("Error", "Could not clear all data.");
        }
    };
    
    const styles = getStyles(theme);

    return (
        <LinearGradient colors={theme.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* ADDED: ScrollView to make the content scrollable */}
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.headerTitle}>Settings</Text>

                    {/* Theme Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Theme</Text>
                        <View style={styles.optionsContainer}>
                            {Object.keys(themes).map((key) => (
                                <TouchableOpacity key={key} style={styles.optionButton} onPress={() => handleThemeChange(key)}>
                                    <View style={{...styles.themePreview, backgroundColor: themes[key].accent}} />
                                    <Text style={styles.optionLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                    {theme.name === key && <MaterialCommunityIcons name="check-circle" size={24} color={theme.success} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Ringtone Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pomodoro Sound</Text>
                         <View style={styles.optionsContainer}>
                            {['Ding', 'Chime', 'Harp'].map((ringtone) => (
                                <TouchableOpacity key={ringtone} style={styles.optionButton} onPress={() => handleRingtoneChange(ringtone.toLowerCase())}>
                                    <Text style={styles.optionLabel}>{ringtone}</Text>
                                    {selectedRingtone === ringtone.toLowerCase() && <MaterialCommunityIcons name="check-circle" size={24} color={theme.success} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Data Management */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Data Management</Text>
                        <TouchableOpacity style={styles.clearButton} onPress={confirmClearData}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
                            <Text style={styles.clearButtonText}>Clear All App Data</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const getStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 30,
        backgroundColor: theme.component,
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 15,
    },
    optionsContainer: {},
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.background[1] || 'rgba(0,0,0,0.1)',
    },
    optionLabel: {
        fontSize: 16,
        color: theme.text,
        flex: 1,
    },
    themePreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 15,
        borderWidth: 2,
        borderColor: theme.subtleText,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        padding: 15,
        borderRadius: 10,
    },
    clearButtonText: {
        color: theme.danger,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    }
});