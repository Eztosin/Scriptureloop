import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap } from 'lucide-react-native';

interface StreakDisplayProps {
  streak: number;
  hasStreakBonus?: boolean;
  onStreakBonusPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function StreakDisplay({ 
  streak, 
  hasStreakBonus = false,
  onStreakBonusPress,
  size = 'medium' 
}: StreakDisplayProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 80, height: 60 },
          text: 14,
          icon: 16,
          streak: 18
        };
      case 'large':
        return {
          container: { width: 120, height: 90 },
          text: 18,
          icon: 28,
          streak: 32
        };
      default:
        return {
          container: { width: 100, height: 75 },
          text: 16,
          icon: 20,
          streak: 24
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getStreakColor = () => {
    if (streak >= 30) return ['#EF4444', '#DC2626']; // Red for 30+ days
    if (streak >= 14) return ['#F59E0B', '#D97706']; // Orange for 14+ days
    if (streak >= 7) return ['#10B981', '#059669'];  // Green for 7+ days
    return ['#6B7280', '#4B5563']; // Gray for less than 7 days
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getStreakColor()}
        style={[styles.streakBadge, sizeStyles.container]}
      >
        <Flame size={sizeStyles.icon} color="#FFFFFF" />
        <Text style={[styles.streakNumber, { fontSize: sizeStyles.streak }]}>
          {streak}
        </Text>
        <Text style={[styles.streakLabel, { fontSize: sizeStyles.text }]}>
          day{streak !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      {hasStreakBonus && onStreakBonusPress && (
        <TouchableOpacity 
          style={styles.bonusButton}
          onPress={onStreakBonusPress}
        >
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={styles.bonusGradient}
          >
            <Zap size={12} color="#FFFFFF" />
            <Text style={styles.bonusText}>2X XP Ready!</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  streakBadge: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  streakNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bonusButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});