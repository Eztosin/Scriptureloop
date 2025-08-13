import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

export default function LevelBadge({ level, size = 'medium' }: LevelBadgeProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 32, height: 32 },
          text: styles.smallText
        };
      case 'large':
        return {
          container: { width: 56, height: 56 },
          text: styles.largeText
        };
      default:
        return {
          container: { width: 40, height: 40 },
          text: styles.mediumText
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <LinearGradient
      colors={['#D4AF37', '#B8860B']}
      style={[styles.badge, sizeStyles.container]}
    >
      <Text style={[styles.levelText, sizeStyles.text]}>{level}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 20,
  },
});