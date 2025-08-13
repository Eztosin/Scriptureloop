import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Gift, Clock } from 'lucide-react-native';
import { userService } from '../services/userService';
import GemsDisplay from './GemsDisplay';

interface BoosterItem {
  id: string;
  name: string;
  description: string;
  type: '2x' | '3x';
  gemCost: number;
  duration: number;
}

export default function BoosterShop() {
  const [boosters] = useState<BoosterItem[]>(userService.getBoosterShop());
  const [userGems, setUserGems] = useState(0);
  const [activeBooster, setActiveBooster] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await userService.getCurrentUser();
    if (user) {
      setUserGems(user.stats.gems);
      setActiveBooster(user.stats.activeBooster);
    }
  };

  const purchaseBooster = async (boosterId: string) => {
    const booster = boosters.find(b => b.id === boosterId);
    if (!booster) return;

    if (userGems < booster.gemCost) {
      Alert.alert('Not Enough Gems', 'You need more gems to purchase this booster!');
      return;
    }

    Alert.alert(
      'Purchase Booster',
      `Purchase ${booster.name} for ${booster.gemCost} gems?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await userService.purchaseBooster(boosterId);
            if (success) {
              Alert.alert('Success!', `${booster.name} activated! 🚀`);
              loadUserData();
            }
          }
        }
      ]
    );
  };

  const getBoosterGradient = (type: '2x' | '3x') => {
    return type === '3x' ? ['#7C3AED', '#5B21B6'] : ['#3B82F6', '#1E40AF'];
  };

  const getRemainingTime = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booster Shop</Text>
        <GemsDisplay gems={userGems} size="large" />
      </View>

      {activeBooster && new Date(activeBooster.expiresAt) > new Date() && (
        <View style={styles.activeBoosterCard}>
          <LinearGradient
            colors={getBoosterGradient(activeBooster.type)}
            style={styles.activeBoosterGradient}
          >
            <View style={styles.activeBoosterContent}>
              <Zap size={24} color="#FFFFFF" />
              <View style={styles.activeBoosterInfo}>
                <Text style={styles.activeBoosterTitle}>
                  {activeBooster.type.toUpperCase()} XP Active!
                </Text>
                <Text style={styles.activeBoosterTime}>
                  {getRemainingTime(activeBooster.expiresAt)} remaining
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {boosters.map((booster) => (
          <View key={booster.id} style={styles.boosterCard}>
            <LinearGradient
              colors={getBoosterGradient(booster.type)}
              style={styles.boosterGradient}
            >
              <View style={styles.boosterContent}>
                <View style={styles.boosterIcon}>
                  <Zap size={32} color="#FFFFFF" />
                </View>
                <View style={styles.boosterInfo}>
                  <Text style={styles.boosterName}>{booster.name}</Text>
                  <Text style={styles.boosterDescription}>{booster.description}</Text>
                  <View style={styles.boosterDetails}>
                    <View style={styles.boosterDetail}>
                      <Clock size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.boosterDetailText}>{booster.duration}h</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={() => purchaseBooster(booster.id)}
                >
                  <Text style={styles.gemCost}>💎 {booster.gemCost}</Text>
                  <Text style={styles.purchaseText}>Buy</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ))}

        <View style={styles.bonusSection}>
          <Text style={styles.bonusTitle}>Special Bonuses</Text>
          
          <View style={styles.bonusCard}>
            <View style={styles.bonusIcon}>
              <Text style={styles.bonusEmoji}>🌅</Text>
            </View>
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusName}>Morning Devotion Bonus</Text>
              <Text style={styles.bonusDescription}>
                Complete challenges between 6am-9am for +50% XP
              </Text>
            </View>
            <Text style={styles.bonusLabel}>FREE</Text>
          </View>

          <View style={styles.bonusCard}>
            <View style={styles.bonusIcon}>
              <Text style={styles.bonusEmoji}>🔥</Text>
            </View>
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusName}>Streak Completion Bonus</Text>
              <Text style={styles.bonusDescription}>
                Next challenge after completing streak = 2x XP
              </Text>
            </View>
            <Text style={styles.bonusLabel}>AUTO</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  activeBoosterCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  activeBoosterGradient: {
    padding: 16,
  },
  activeBoosterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBoosterInfo: {
    marginLeft: 12,
  },
  activeBoosterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeBoosterTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  boosterCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  boosterGradient: {
    padding: 20,
  },
  boosterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boosterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  boosterInfo: {
    flex: 1,
  },
  boosterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  boosterDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  boosterDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  boosterDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boosterDetailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  purchaseButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  gemCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  purchaseText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  bonusSection: {
    marginTop: 20,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  bonusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bonusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bonusEmoji: {
    fontSize: 24,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  bonusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  bonusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});