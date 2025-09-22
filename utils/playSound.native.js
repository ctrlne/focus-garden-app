// utils/playSound.native.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const soundObject = new Audio.Sound();

export const playSound = async () => {
  try {
    const ringtone = await AsyncStorage.getItem('ringtone') || 'ding';
    let soundFile;

    // THIS PATH IS CORRECT: It goes up one level to the project root, then into assets.
    if (ringtone === 'chime') {
      soundFile = require('../public/chime.mp3');
    } else if (ringtone === 'harp') {
      soundFile = require('../public/harp.mp3');
    } else {
      soundFile = require('../public/ding.mp3');
    }

    await soundObject.unloadAsync(); // Unload previous sound
    await soundObject.loadAsync(soundFile);
    await soundObject.playAsync();
  } catch (error) {
    console.error("Couldn't play sound on native", error);
  }
};