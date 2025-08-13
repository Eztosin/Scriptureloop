import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LeagueBadgeProps {
  league: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  size?: 'small' | 'medium' | 'large';
}

const LEAGUE_COLORS = {
  Bronze: ['#CD7F32', '#A0522D'],
  Silver: ['#C0C0C0', '#A8A8A8'],
  Gold: ['#D4AF37', '#B8860B'],
  Platinum: ['#E5E4E2', '#BCC6CC'],
  Diamond: ['#B9F2FF', '#00BFFF']
};

const LEAGUE_EMOJIS = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '💠'
};

export default function LeagueBadge({ league, size = 'medium' }: LeagueBadgeProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { container: { width: 60, height: 32 }, text: 10, emoji: 12 };
      case 'large':
        return { container: { width: 120, height: 48 }, text: 14, emoji: 20 };
      default:
        return { container: { width: 90, height: 40 }, text: 12, emoji: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <LinearGradient
      colors={LEAGUE_COLORS[league]}
      style={[styles.badge, sizeStyles.container]}
    >
      <Text style={{ fontSize: sizeStyles.emoji }}>{LEAGUE_EMOJIS[league]}</Text>
      <Text style={[styles.leagueText, { fontSize: sizeStyles.text }]}>{league}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  leagueText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});