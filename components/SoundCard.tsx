import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Play, Pause, Heart, MoveVertical as MoreVertical, Clock, Tag } from 'lucide-react-native';
import { useSounds } from '../context/SoundContext';
import { Sound } from '../types/sound';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

interface SoundCardProps {
  sound: Sound;
  onOptionsPress: (sound: Sound) => void;
}

const SoundCard: React.FC<SoundCardProps> = ({ sound, onOptionsPress }) => {
  const { 
    loadAndPlaySound, 
    currentSound, 
    isPlaying, 
    pauseSound, 
    toggleFavorite, 
    playbackPosition 
  } = useSounds();

  const isCurrentlyPlaying = currentSound?.id === sound.id && isPlaying;

  const handlePlayPress = async () => {
    try {
      if (isCurrentlyPlaying) {
        await pauseSound();
      } else {
        await loadAndPlaySound(sound);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const playbackTime = isCurrentlyPlaying ? formatDuration(playbackPosition) : null;

  return (
    <TouchableOpacity 
      style={[styles.container, isCurrentlyPlaying && styles.playingContainer]} 
      onPress={handlePlayPress}
      onLongPress={() => onOptionsPress(sound)}
      delayLongPress={500}
    >
      <View style={styles.leftSection}>
        {isCurrentlyPlaying ? (
          <View style={styles.playingButton}>
            <Pause size={20} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.playButton}>
            <Play size={20} color={BRAND_COLORS.brightBlue} />
          </View>
        )}
      </View>
      
      <View style={styles.middleSection}>
        <Text style={styles.title} numberOfLines={1}>{sound.name}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Clock size={12} color="#AAAAAA" />
            <Text style={styles.detailText}>
              {isCurrentlyPlaying && playbackTime ? 
                `${playbackTime} / ${formatDuration(sound.duration)}` : 
                formatDuration(sound.duration)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Tag size={12} color="#AAAAAA" />
            <Text style={styles.detailText}>{sound.category}</Text>
          </View>
          <Text style={styles.detailText}>{formatDate(sound.dateAdded)}</Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(sound.id);
          }}
        >
          <Heart 
            size={20} 
            color={sound.favorite ? BRAND_COLORS.brightBlue : '#AAAAAA'} 
            fill={sound.favorite ? BRAND_COLORS.brightBlue : 'transparent'} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={(e) => {
            e.stopPropagation();
            onOptionsPress(sound);
          }}
        >
          <MoreVertical size={20} color="#AAAAAA" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        // Add web-specific styles if needed
      }
    }),
  },
  playingContainer: {
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
    borderWidth: 1,
    borderColor: BRAND_COLORS.brightBlue,
  },
  leftSection: {
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.brightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  iconButton: {
    padding: 8,
  },
});

export default SoundCard;