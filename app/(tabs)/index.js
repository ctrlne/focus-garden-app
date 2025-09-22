import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ThemeContext';
// FIXED: We now import our platform-specific function
import { playSound } from '../../utils/playSound';

// Helper function to get the end of a day
const getEndOfDay = (date) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end.getTime();
};

export default function FocusGardenScreen() {
    const { theme } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [taskText, setTaskText] = useState('');
    const [selectedDeadline, setSelectedDeadline] = useState('today');

    const [garden, setGarden] = useState(Array(10).fill('empty'));
    const animatedFlowerValues = useRef([...Array(10)].map(() => new Animated.Value(0))).current;

    const [timer, setTimer] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const timerIntervalRef = useRef(null);
    // REMOVED: soundRef is no longer needed here, it's handled in the utils files

    // --- DATA & GARDEN LOGIC ---
    const loadData = useCallback(async (isInitialLoad = false) => {
        try {
            const storedTasks = await AsyncStorage.getItem('tasks');
            let loadedTasks = storedTasks ? JSON.parse(storedTasks) : [];
            const storedGarden = await AsyncStorage.getItem('garden');
            let loadedGarden = storedGarden ? JSON.parse(storedGarden) : Array(10).fill('empty');
            
            const now = Date.now();
            const overdueTasks = loadedTasks.filter(task => !task.completed && task.deadline < now);
            if (overdueTasks.length > 0 && isInitialLoad) {
                Alert.alert("Tasks Overdue!", `${overdueTasks.length} task(s) were missed and flowers have withered.`);
                loadedTasks = loadedTasks.filter(task => task.deadline >= now || task.completed);
                
                for (let i = 0; i < overdueTasks.length; i++) {
                    const lastBloomedIndex = loadedGarden.lastIndexOf('bloomed');
                    if (lastBloomedIndex !== -1) {
                        loadedGarden[lastBloomedIndex] = 'withered';
                    }
                }
            }

            const storedHistory = await AsyncStorage.getItem('focusHistory');
            const history = storedHistory ? JSON.parse(storedHistory) : [];
            const flowerCount = Math.floor(history.length / 2);

            for (let i = 0; i < flowerCount; i++) {
                if (loadedGarden[i] === 'empty') {
                    loadedGarden[i] = 'bloomed';
                }
            }

            loadedGarden.forEach((plot, index) => {
                if (plot !== 'empty') {
                    Animated.timing(animatedFlowerValues[index], {
                        toValue: 1, duration: 500, useNativeDriver: true,
                    }).start();
                }
            });

            setTasks(loadedTasks);
            setGarden(loadedGarden);
            await AsyncStorage.setItem('tasks', JSON.stringify(loadedTasks));
            await AsyncStorage.setItem('garden', JSON.stringify(loadedGarden));

        } catch (e) { console.error("Failed to load data.", e); }
    }, [animatedFlowerValues]);

    const recordFocusSession = useCallback(async () => {
        try {
            const historyJson = await AsyncStorage.getItem('focusHistory');
            const history = historyJson ? JSON.parse(historyJson) : [];
            const newHistory = [...history, { date: new Date().toISOString(), duration: 25 }];
            await AsyncStorage.setItem('focusHistory', JSON.stringify(newHistory));
            loadData(false); // Reload data to update garden without the overdue check
        } catch (e) { console.error("Failed to record session.", e); }
    }, [loadData]);

    // REMOVED: The old playSound function is now in separate files

    useEffect(() => {
        if (isActive) {
            timerIntervalRef.current = setInterval(() => {
                setTimer(t => {
                    if (t <= 1) {
                        clearInterval(timerIntervalRef.current);
                        setIsActive(false);
                        playSound();
                        Alert.alert("Session Complete!", "Great job! Your garden is growing.");
                        recordFocusSession();
                        return 25 * 60;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isActive, recordFocusSession]); // We don't need playSound here as it's stable

    // Background handling logic
    const handleAppStateChange = useCallback(async (nextAppState) => {
        if (nextAppState.match(/inactive|background/)) {
            if (isActive) {
                const endTime = Date.now() + timer * 1000;
                await AsyncStorage.setItem('timerEndTime', endTime.toString());
            }
        } else if (nextAppState === 'active') {
            loadData(true);
            const timerEndTime = await AsyncStorage.getItem('timerEndTime');
            if (timerEndTime) {
                const remaining = Math.round((parseInt(timerEndTime, 10) - Date.now()) / 1000);
                if (remaining > 0) {
                    setTimer(remaining);
                    setIsActive(true);
                } else {
                    setTimer(25*60);
                    setIsActive(false);
                }
                await AsyncStorage.removeItem('timerEndTime');
            }
        }
    }, [isActive, timer, loadData]);
    
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [handleAppStateChange]);

    useFocusEffect(useCallback(() => { loadData(true); }, [loadData]));

    const saveData = useCallback(async (currentTasks) => {
        try { await AsyncStorage.setItem('tasks', JSON.stringify(currentTasks)); } 
        catch (e) { console.error("Failed to save tasks.", e); }
    }, []);

    useEffect(() => { saveData(tasks); }, [tasks, saveData]);

    const handleAddTask = () => {
        if (taskText.trim().length === 0) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deadline = selectedDeadline === 'today' ? getEndOfDay(new Date()) : getEndOfDay(tomorrow);

        setTasks([...tasks, { id: Date.now().toString(), text: taskText, completed: false, deadline }]);
        setTaskText('');
        Keyboard.dismiss();
    };
    
    const styles = getStyles(theme);

    return (
        <LinearGradient colors={theme.background} style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.gardenSection}>
                     <View style={styles.gardenGrid}>
                        {garden.map((plot, index) => (
                            <View key={index} style={styles.gardenPlot}>
                                {plot !== 'empty' && (
                                    <Animated.View style={{ opacity: animatedFlowerValues[index] }}>
                                        <MaterialCommunityIcons 
                                            name={plot === 'withered' ? "flower-tulip-outline" : "flower-tulip"} 
                                            size={40} 
                                            color={plot === 'withered' ? theme.subtleText : theme.accent} />
                                    </Animated.View>
                                )}
                            </View>
                        ))}
                    </View>
                    <Text style={styles.timerText}>{`${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`}</Text>
                    <TouchableOpacity onPress={() => setIsActive(!isActive)} style={styles.timerButton}>
                        <MaterialCommunityIcons name={isActive ? "pause-circle" : "play-circle"} size={60} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.listSection}>
                    <TextInput style={styles.input} placeholderTextColor={theme.subtleText} value={taskText} onChangeText={setTaskText} onSubmitEditing={handleAddTask} placeholder="Add a new task..."/>
                    <View style={styles.deadlineContainer}>
                        <Text style={styles.deadlineLabel}>Deadline:</Text>
                        <TouchableOpacity style={[styles.deadlineButton, selectedDeadline === 'today' && styles.deadlineButtonActive]} onPress={() => setSelectedDeadline('today')}>
                            <Text style={[styles.deadlineText, selectedDeadline === 'today' && {color: theme.component}]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.deadlineButton, selectedDeadline === 'tomorrow' && styles.deadlineButtonActive]} onPress={() => setSelectedDeadline('tomorrow')}>
                             <Text style={[styles.deadlineText, selectedDeadline === 'tomorrow' && {color: theme.component}]}>Tomorrow</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList data={tasks} keyExtractor={item => item.id} 
                        renderItem={({ item }) => (
                            <View style={styles.taskItem}>
                                <TouchableOpacity onPress={() => setTasks(tasks.map(t => t.id === item.id ? {...t, completed: !t.completed} : t))} style={styles.taskTextContainer}>
                                    <MaterialCommunityIcons name={item.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={24} color={item.completed ? theme.success : theme.text} />
                                    <View>
                                        <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>{item.text}</Text>
                                        <Text style={styles.deadlineSubtext}>
                                            Due: {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setTasks(tasks.filter(t => t.id !== item.id))}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={theme.danger} />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyListText}>Add a task to begin your garden!</Text>}
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    gardenSection: { flex: 0.9, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10 },
    gardenGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '80%', marginBottom: 10 },
    gardenPlot: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', margin: 5 },
    timerText: { fontSize: 56, fontWeight: 'bold', color: theme.text },
    timerButton: { marginTop: 10 },
    listSection: { flex: 1, backgroundColor: theme.component, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    input: { backgroundColor: theme.background[0], color: theme.text, borderRadius: 10, padding: 15, fontSize: 16 },
    deadlineContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    deadlineLabel: { color: theme.subtleText, fontSize: 14, marginRight: 10 },
    deadlineButton: { borderWidth: 1, borderColor: theme.subtleText, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, marginRight: 10 },
    deadlineButtonActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    deadlineText: { color: theme.subtleText },
    taskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.background[0] },
    taskTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    taskText: { color: theme.text, fontSize: 16, marginLeft: 15, flexShrink: 1 },
    taskTextCompleted: { textDecorationLine: 'line-through', color: theme.subtleText },
    deadlineSubtext: { color: theme.subtleText, fontSize: 12, marginLeft: 15, marginTop: 2 },
    emptyListText: { textAlign: 'center', color: theme.subtleText, marginTop: 20, fontSize: 14 },
});