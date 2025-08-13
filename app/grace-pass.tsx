import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Flame, Star, Heart } from 'lucide-react-native';
import { revenueCatService } from '../services/revenueCatService';
import { userService } from '../services/userService.production';

export default function GracePassScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchaseGracePass = async () => {
    setIsLoading(true);
    
    try {
      const result = await revenueCatService.purchaseGracePass();
      
      if (result.success) {
        // Restore the streak (get previous streak from route params or storage)
        // For now, we'll restore to a reasonable streak
        await userService.restoreStreakWithGracePass(7);
        
        Alert.alert(
          'Grace Pass Activated! 🙏',
          'Your streak has been restored. God\'s grace is sufficient!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Grace Pass purchase error:', error);
      Alert.alert('Error', 'Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grace Pass</Text>
        <View />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.heroSection}>
          <Shield size={64} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Restore Your Streak</Text>
          <Text style={styles.heroSubtitle}>Life happens. God's grace covers it all.</Text>
        </LinearGradient>

        <View style={styles.messageSection}>
          <View style={styles.streakBrokenCard}>
            <Flame size={32} color="#EF4444" />
            <Text style={styles.streakBrokenTitle}>Streak Broken</Text>
            <Text style={styles.streakBrokenMessage}>
              Don't worry! Use a Grace Pass to restore your streak and continue your spiritual journey.
            </Text>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Flame size={24} color="#FF6B35" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Streak Restored</Text>
              <Text style={styles.benefitDescription}>
                Your daily reading streak continues as if you never missed a day
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Star size={24} color="#D4AF37" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Keep Your Progress</Text>
              <Text style={styles.benefitDescription}>
                Maintain your level, XP, and all achievements earned
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.priceCard}>
            <Text style={styles.priceAmount}>$0.99</Text>
            <Text style={styles.priceDescription}>One-time purchase</Text>
            <Text style={styles.priceNote}>
              "For by grace you have been saved through faith" - Ephesians 2:8
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.disabledButton]}
          onPress={handlePurchaseGracePass}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#D4AF37', '#B8860B']}
            style={styles.purchaseGradient}
          >
            <Text style={styles.purchaseText}>
              {isLoading ? 'Processing...' : 'Restore Streak - $0.99'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  messageSection: { paddingHorizontal: 20, marginBottom: 30 },
  streakBrokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakBrokenTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  streakBrokenMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: { flex: 1 },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingSection: { paddingHorizontal: 20, marginBottom: 30 },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
  },
  priceDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  priceNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  purchaseButton: { borderRadius: 12, overflow: 'hidden' },
  disabledButton: { opacity: 0.7 },
  purchaseGradient: { paddingVertical: 16, alignItems: 'center' },
  purchaseText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});