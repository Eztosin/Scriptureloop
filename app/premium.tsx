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
import { ArrowLeft, Crown, Book, Heart, Star } from 'lucide-react-native';
import { revenueCatService } from '../services/revenueCatService';

export default function PremiumScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchasePremium = async () => {
    setIsLoading(true);
    
    try {
      const result = await revenueCatService.purchasePremiumContent();
      
      if (result.success) {
        Alert.alert(
          'Premium Unlocked! 🎆',
          'You now have access to all premium devotional content!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Premium purchase error:', error);
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
        <Text style={styles.headerTitle}>Premium Content</Text>
        <View />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#EC4899', '#BE185D']} style={styles.heroSection}>
          <Crown size={64} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Deepen your faith with exclusive devotional content
          </Text>
        </LinearGradient>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Book size={24} color="#EC4899" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Premium Learning Paths</Text>
              <Text style={styles.featureDescription}>
                Access "Wisdom" and "Prayer Life" devotional series
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Heart size={24} color="#EF4444" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Exclusive Devotionals</Text>
              <Text style={styles.featureDescription}>
                50+ premium devotional readings and reflections
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Star size={24} color="#D4AF37" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Insights</Text>
              <Text style={styles.featureDescription}>
                Deep theological insights and commentary
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.priceCard}>
            <Text style={styles.priceAmount}>$2.99</Text>
            <Text style={styles.priceDescription}>One-time purchase</Text>
            <Text style={styles.priceNote}>
              "She is more precious than rubies" - Proverbs 3:15
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.disabledButton]}
          onPress={handlePurchasePremium}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#EC4899', '#BE185D']}
            style={styles.purchaseGradient}
          >
            <Text style={styles.purchaseText}>
              {isLoading ? 'Processing...' : 'Unlock Premium - $2.99'}
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
  featuresSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureCard: {
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
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: { flex: 1 },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
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
    color: '#EC4899',
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