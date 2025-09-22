// utils/playSound.web.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// This function uses the browser's Audio API and will only be used on the web.
export const playSound = async (setSound) => {
    try {
        // On web, AsyncStorage polyfills to localStorage, which works fine.
        const ringtone = await AsyncStorage.getItem('ringtone') || 'ding';
        
        // IMPORTANT: This assumes your audio files are in a 'public' directory.
        // Web browsers will fetch these assets from the root of the server.
        const soundFile = `/${ringtone}.mp3`; 
        
        const soundObject = new Audio(soundFile);
        soundObject.play();

        // For this simple case, we don't need to manage the web audio object in state.
        setSound(null);
    } catch (e) {
        console.error("Couldn't play sound on web", e);
    }
};