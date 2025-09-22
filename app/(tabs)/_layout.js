import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LogBox } from 'react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';

// This specific warning is common with countdown timers and can be safely ignored
// for a Pomodoro timer where the app is intended to be in the foreground.
LogBox.ignoreLogs(['Setting a timer']);

// This is the component that will be wrapped by the ThemeProvider
// It contains all the logic for displaying the tabs and applying the theme
function ThemedTabs() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'index') {
                        iconName = focused ? 'flower-tulip' : 'flower-tulip-outline';
                    } else if (route.name === 'stats') {
                        iconName = focused ? 'chart-line' : 'chart-line-variant';
                    } else if (route.name === 'settings') {
                        iconName = focused ? 'cog' : 'cog-outline';
                    }
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.subtleText,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.component,
                    borderTopWidth: 0, // A cleaner look without the top border
                    elevation: 0, // for Android
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    paddingBottom: 5,
                },
                 tabBarItemStyle: {
                    paddingVertical: 5,
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Garden' }} />
            <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
    );
}

// The main export wraps the entire tab layout in the ThemeProvider
// so all screens can access the current theme
export default function TabLayout() {
  return (
    <ThemeProvider>
        <ThemedTabs />
    </ThemeProvider>
  );
}

