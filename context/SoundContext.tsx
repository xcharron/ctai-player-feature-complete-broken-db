import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Sound } from '../types/sound';
import { Platform } from 'react-native';

interface SoundContextType {
  sounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  isLooping: boolean;
  playbackPosition: number;
  playbackDuration: number;
  highQualityEnabled: boolean;
  setHighQualityEnabled: (enabled: boolean) => void;
  loadSound: (sound: Sound) => Promise<void>;
  playSound: () => Promise<void>;
  pauseSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  seekSound: (position: number) => Promise<void>;
  toggleLooping: () => Promise<void>;
  addSound: (sound: Sound) => Promise<void>;
  deleteSound: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateSound: (sound: Sound) => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const getDirectoryPath = () => {
  if (Platform.OS === 'web') {
    return '';
  }
  return `${FileSystem.documentDirectory}sounds/`;
};

const getDataFilePath = () => {
  if (Platform.OS === 'web') {
    return '';
  }
  return `${FileSystem.documentDirectory}sounds.json`;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [highQualityEnabled, setHighQualityEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Initialize audio with platform-specific settings
        const audioConfig = Platform.select({
          ios: {
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          },
          android: {
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
          },
          default: {
            staysActiveInBackground: true,
          }
        });

        await Audio.setAudioModeAsync(audioConfig);

        if (Platform.OS !== 'web') {
          const SOUNDS_DIRECTORY = getDirectoryPath();
          const SOUNDS_DATA_FILE = getDataFilePath();
          
          const dirInfo = await FileSystem.getInfoAsync(SOUNDS_DIRECTORY);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(SOUNDS_DIRECTORY, { intermediates: true });
          }

          const fileInfo = await FileSystem.getInfoAsync(SOUNDS_DATA_FILE);
          if (fileInfo.exists) {
            const data = await FileSystem.readAsStringAsync(SOUNDS_DATA_FILE);
            setSounds(JSON.parse(data));
          } else {
            await FileSystem.writeAsStringAsync(SOUNDS_DATA_FILE, JSON.stringify([]));
          }
        } else {
          const storedSounds = localStorage.getItem('sounds');
          if (storedSounds) {
            setSounds(JSON.parse(storedSounds));
          }
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };

    initializeStorage();

    // Cleanup function
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const saveSoundsData = async () => {
      try {
        if (Platform.OS !== 'web') {
          const SOUNDS_DATA_FILE = getDataFilePath();
          await FileSystem.writeAsStringAsync(SOUNDS_DATA_FILE, JSON.stringify(sounds));
        } else {
          localStorage.setItem('sounds', JSON.stringify(sounds));
        }
      } catch (error) {
        console.error('Error saving sounds data:', error);
      }
    };

    if (sounds.length > 0) {
      saveSoundsData();
    }
  }, [sounds]);

  const updatePlaybackStatus = async () => {
    if (soundObject) {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded) {
        setPlaybackPosition(status.positionMillis / 1000);
        setPlaybackDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
        setIsPlaying(status.isPlaying);
        setIsLooping(status.isLooping);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(updatePlaybackStatus, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, soundObject]);

  const loadSound = async (sound: Sound) => {
    try {
      setIsLoaded(false);
      
      // Unload any existing sound
      if (soundObject) {
        await soundObject.unloadAsync();
        setSoundObject(null);
      }

      // Create and load the new sound
      const { sound: newSoundObject } = await Audio.Sound.createAsync(
        { uri: sound.uri },
        {
          shouldCorrectPitch: highQualityEnabled,
          progressUpdateIntervalMillis: highQualityEnabled ? 50 : 100,
          positionMillis: 0,
          shouldPlay: false,
          volume: 1.0,
          isLooping: true,
        },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            setPlaybackDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
            setIsPlaying(status.isPlaying);
            
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        }
      );

      // Wait for the sound to be fully loaded
      await newSoundObject.setStatusAsync({
        shouldPlay: false,
        positionMillis: 0,
      });

      setSoundObject(newSoundObject);
      setCurrentSound(sound);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setIsLooping(true);
      setIsLoaded(true);
      
      await updatePlaybackStatus();
    } catch (error) {
      console.error('Error loading sound:', error);
      setIsLoaded(false);
      throw error;
    }
  };

  const playSound = async () => {
    if (!soundObject || !isLoaded) return;
    
    try {
      await soundObject.setIsLoopingAsync(true);
      await soundObject.playAsync();
      setIsPlaying(true);
      setIsLooping(true);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    if (!soundObject || !isLoaded) return;
    
    try {
      await soundObject.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const stopSound = async () => {
    if (!soundObject || !isLoaded) return;
    
    try {
      await soundObject.stopAsync();
      await soundObject.setPositionAsync(0);
      setIsPlaying(false);
      setPlaybackPosition(0);
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const seekSound = async (position: number) => {
    if (!soundObject || !isLoaded) return;
    
    try {
      await soundObject.setPositionAsync(position * 1000);
      setPlaybackPosition(position);
    } catch (error) {
      console.error('Error seeking sound:', error);
    }
  };

  const toggleLooping = async () => {
    if (!soundObject || !isLoaded) return;
    
    try {
      const newLoopingState = !isLooping;
      await soundObject.setIsLoopingAsync(newLoopingState);
      setIsLooping(newLoopingState);
    } catch (error) {
      console.error('Error toggling loop mode:', error);
    }
  };

  const addSound = async (sound: Sound) => {
    try {
      if (Platform.OS !== 'web') {
        const SOUNDS_DIRECTORY = getDirectoryPath();
        
        const fileInfo = await FileSystem.getInfoAsync(sound.uri);
        if (!fileInfo.exists) {
          throw new Error('Sound file does not exist');
        }

        if (!sound.uri.startsWith(SOUNDS_DIRECTORY)) {
          const fileName = sound.uri.split('/').pop() || `sound-${Date.now()}.mp3`;
          const newUri = `${SOUNDS_DIRECTORY}${fileName}`;
          
          await FileSystem.copyAsync({
            from: sound.uri,
            to: newUri
          });
          
          sound.uri = newUri;
        }
      }

      setSounds(prevSounds => [...prevSounds, sound]);
    } catch (error) {
      console.error('Error adding sound:', error);
      throw error;
    }
  };

  const deleteSound = async (id: string) => {
    try {
      const soundToDelete = sounds.find(s => s.id === id);
      if (!soundToDelete) return;

      if (currentSound && currentSound.id === id) {
        if (soundObject) {
          await soundObject.unloadAsync();
          setSoundObject(null);
        }
        setCurrentSound(null);
        setIsPlaying(false);
        setIsLoaded(false);
      }

      if (Platform.OS !== 'web') {
        const SOUNDS_DIRECTORY = getDirectoryPath();
        if (soundToDelete.uri.startsWith(SOUNDS_DIRECTORY)) {
          await FileSystem.deleteAsync(soundToDelete.uri);
        }
      }

      setSounds(prevSounds => prevSounds.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting sound:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    setSounds(prevSounds => 
      prevSounds.map(sound => 
        sound.id === id 
          ? { ...sound, favorite: !sound.favorite } 
          : sound
      )
    );
  };

  const updateSound = async (updatedSound: Sound) => {
    setSounds(prevSounds => 
      prevSounds.map(sound => 
        sound.id === updatedSound.id 
          ? updatedSound 
          : sound
      )
    );

    if (currentSound && currentSound.id === updatedSound.id) {
      setCurrentSound(updatedSound);
    }
  };

  return (
    <SoundContext.Provider
      value={{
        sounds,
        currentSound,
        isPlaying,
        isLooping,
        playbackPosition,
        playbackDuration,
        highQualityEnabled,
        setHighQualityEnabled,
        loadSound,
        playSound,
        pauseSound,
        stopSound,
        seekSound,
        toggleLooping,
        addSound,
        deleteSound,
        toggleFavorite,
        updateSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};

export { SoundProvider }

export { useSounds }