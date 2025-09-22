import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as shape from 'd3-shape';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle } from 'react-native-svg';
import { Grid, LineChart } from 'react-native-svg-charts';
import { useTheme } from '../ThemeContext';

export default function StatsScreen() {
    const { theme } = useTheme();
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalTime: 0,
        tasksCompleted: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Correctly structured async data loading
    const loadData = useCallback(() => {
        const fetchData = async () => {
            setRefreshing(true);
            try {
                const focusHistoryJson = await AsyncStorage.getItem('focusHistory');
                const focusHistory = focusHistoryJson ? JSON.parse(focusHistoryJson) : [];

                const tasksJson = await AsyncStorage.getItem('tasks');
                const tasks = tasksJson ? JSON.parse(tasksJson) : [];

                const totalSessions = focusHistory.length;
                const totalTime = focusHistory.reduce((sum, item) => sum + (item.duration || 25), 0);
                const tasksCompleted = tasks.filter(task => task.completed).length;

                setStats({ totalSessions, totalTime, tasksCompleted });

                // Prepare data for the chart (last 7 days)
                const dailyData = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().split('T')[0];
                    dailyData[key] = 0;
                }

                focusHistory.forEach(session => {
                    const sessionDate = new Date(session.date).toISOString().split('T')[0];
                    if (dailyData.hasOwnProperty(sessionDate)) {
                        dailyData[sessionDate]++;
                    }
                });
                
                setChartData(Object.values(dailyData));

            } catch (e) {
                console.error("Failed to load stats.", e);
            } finally {
                setRefreshing(false);
            }
        };
        fetchData();
    }, []);

    useFocusEffect(loadData);

    const Decorator = ({ x, y, data }) => {
        return data.map((value, index) => (
            <Circle
                key={index}
                cx={x(index)}
                cy={y(value)}
                r={4}
                stroke={theme.accent}
                fill={theme.text}
            />
        ));
    };

    const styles = getStyles(theme);

    return (
        <LinearGradient colors={theme.background} style={styles.container}>
            <SafeAreaView>
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={theme.text} />}
                >
                    <View style={styles.content}>
                        <Text style={styles.headerTitle}>Your Progress</Text>
                        <Text style={styles.headerSubtitle}>Pull down to refresh</Text>

                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryCard}>
                                <FontAwesome5 name="check-circle" size={24} color={theme.success} />
                                <Text style={styles.summaryValue}>{stats.tasksCompleted}</Text>
                                <Text style={styles.summaryLabel}>Tasks Done</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <MaterialCommunityIcons name="flower" size={24} color={theme.accent} />
                                <Text style={styles.summaryValue}>{stats.totalSessions}</Text>
                                <Text style={styles.summaryLabel}>Focus Sessions</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <FontAwesome5 name="clock" size={24} color={theme.accent} />
                                <Text style={styles.summaryValue}>{stats.totalTime}m</Text>
                                <Text style={styles.summaryLabel}>Total Focus</Text>
                            </View>
                        </View>
                        
                        <View style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Focus Sessions (Last 7 Days)</Text>
                            {chartData.length > 0 && chartData.some(d => d > 0) ? (
                                <LineChart
                                    style={{ height: 200 }}
                                    data={chartData}
                                    svg={{ stroke: theme.accent, strokeWidth: 3 }}
                                    contentInset={{ top: 20, bottom: 20 }}
                                    curve={shape.curveNatural}
                                >
                                    <Grid svg={{ stroke: 'rgba(255,255,255,0.2)' }} />
                                    <Decorator />
                                </LineChart>
                            ) : (
                                <Text style={styles.noDataText}>Complete focus sessions to see your trend.</Text>
                            )}
                        </View>
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
    },
    headerSubtitle: {
        fontSize: 16,
        color: theme.subtleText,
        textAlign: 'center',
        marginBottom: 20,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: theme.component,
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        width: '32%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text,
        marginVertical: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.subtleText,
    },
    chartCard: {
        backgroundColor: theme.component,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 10,
    },
    noDataText: {
        textAlign: 'center',
        color: theme.subtleText,
        paddingVertical: 50,
        fontSize: 14,
    }
});

