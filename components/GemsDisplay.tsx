import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GemsDisplayProps {
  gems: number;
  size?: 'small' | 'medium' | 'large';
}

export default function GemsDisplay({ gems, size = 'medium' }: GemsDisplayProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { text: 12, emoji: 14 };
      case 'large':
        return { text: 20, emoji: 24 };
      default:
        return { text: 16, emoji: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: sizeStyles.emoji }}>💎</Text>
      <Text style={[styles.gemsText, { fontSize: sizeStyles.text }]}>
        {gems.toLocaleString()}
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
  gemsText: {
    fontWeight: '600',
    color: '#7C3AED',
  },
});