import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface XPDisplayProps {
  xp: number;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function XPDisplay({ 
  xp, 
  showIcon = true, 
  size = 'medium' 
}: XPDisplayProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          text: styles.smallText,
          icon: 14
        };
      case 'large':
        return {
          text: styles.largeText,
          icon: 28
        };
      default:
        return {
          text: styles.mediumText,
          icon: 20
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      {showIcon && <Star size={sizeStyles.icon} color="#D4AF37" />}
      <Text style={[styles.xpText, sizeStyles.text]}>
        {xp.toLocaleString()} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontWeight: '600',
    color: '#D97706',
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