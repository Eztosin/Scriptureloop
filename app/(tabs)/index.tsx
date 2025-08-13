import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService.production';
import { 
  Flame, 
  Star, 
  Book, 
  Target, 
  Calendar,
  ChevronRight,
  Trophy,
  Heart,
  Zap,
  LogOut
} from 'lucide-react-native';
import LeagueBadge from '../../components/LeagueBadge';
import GemsDisplay from '../../components/GemsDisplay';
import XPDisplay from '../../components/XPDisplay';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [userStats, setUserStats] = useState({
    streak: 0,
    xp: 0,
    weeklyXP: 0,
    level: 1,
    gems: 0,
    league: 'Bronze' as const,
    todayCompleted: false,
    hasStreakBonus: false,
    activeBooster: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      // Force refresh user data from database
      await userService.refreshUserData();
      const user = await userService.getCurrentUser();
      if (user?.stats) {
        setUserStats({
          streak: user.stats.streak,
          xp: user.stats.xp,
          weeklyXP: user.stats.weekly_xp,
          level: user.stats.level,
          gems: user.stats.gems,
          league: user.stats.league as 'Bronze',
          todayCompleted: user.stats.today_completed,
          hasStreakBonus: user.stats.has_streak_bonus,
          activeBooster: user.stats.active_booster,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [dailyVerse, setDailyVerse] = useState({
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6",
  });

  const learningPaths = [
    { id: 1, title: 'Faith', progress: 0, color: '#3B82F6', icon: '🙏', premium: false },
    { id: 2, title: 'Love', progress: 0, color: '#EF4444', icon: '❤️', premium: false },
    { id: 3, title: 'Forgiveness', progress: 0, color: '#10B981', icon: '🕊️', premium: false },
    { id: 4, title: 'Growth', progress: 0, color: '#8B5CF6', icon: '🌱', premium: false },
    { id: 5, title: 'Wisdom', progress: 0, color: '#D4AF37', icon: '🧙', premium: true },
    { id: 6, title: 'Prayer Life', progress: 0, color: '#EC4899', icon: '🙏', premium: true },
  ];

  const handleStartChallenge = () => {
    if (userStats.todayCompleted) {
      // Already completed today
      return;
    }
    router.push('/challenge');
  };



  const handleStartFlashcards = () => {
    router.push('/flashcards');
  };

  const handleLearningPath = async (pathId: number, isPremium: boolean) => {
    if (isPremium) {
      // Check if user has premium access
      try {
        const { revenueCatService } = await import('../../services/revenueCatService');
        const entitlements = await revenueCatService.getEntitlements();
        
        if (!entitlements.premiumContent) {
          Alert.alert(
            'Premium Content 🎆',
            'This learning path requires premium access. Unlock all devotional content for $2.99.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Unlock Premium', onPress: () => router.push('/premium') }
            ]
          );
          return;
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    }
    
    router.push(`/learning-path?id=${pathId}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Good morning! ✨</Text>
          <Text style={styles.subtitle}>Ready for today's spiritual journey?</Text>
        </View>
        <View style={styles.headerStats}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              try {
                console.log('Home screen signing out...');
                await supabase.auth.signOut();
                router.push('/auth');
              } catch (error) {
                console.error('Home sign out error:', error);
                router.push('/auth');
              }
            }}
          >
            <LogOut size={16} color="#EF4444" />
          </TouchableOpacity>
          <LeagueBadge league={userStats.league} size="small" />
          <GemsDisplay gems={userStats.gems} size="small" />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Flame size={24} color="#FF6B35" />
          </View>
          <Text style={styles.statNumber}>{userStats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Star size={24} color="#D4AF37" />
          </View>
          <Text style={styles.statNumber}>{userStats.weeklyXP}</Text>
          <Text style={styles.statLabel}>Weekly XP</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Trophy size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{userStats.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Active Booster */}
      {userStats.activeBooster && (
        <View style={styles.section}>
          <View style={styles.boosterAlert}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.boosterGradient}
            >
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.boosterText}>3X XP ACTIVE! ⚡</Text>
              <Text style={styles.boosterTime}>1h 23m left</Text>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Daily Challenge */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Challenge</Text>
          {userStats.hasStreakBonus && (
            <View style={styles.bonusIndicator}>
              <Text style={styles.bonusText}>2X XP!</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.challengeCard,
            userStats.todayCompleted && styles.completedChallenge
          ]}
          onPress={handleStartChallenge}
        >
          <LinearGradient
            colors={userStats.todayCompleted ? ['#10B981', '#059669'] : ['#3B82F6', '#1E40AF']}
            style={styles.challengeGradient}
          >
            <View style={styles.challengeHeader}>
              <View style={styles.challengeIcon}>
                <Book size={24} color="#FFFFFF" />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeTitle}>
                  {userStats.todayCompleted ? 'Completed! 🎉' : 'Daily Reading'}
                </Text>
                <Text style={styles.challengeSubtitle}>
                  {userStats.todayCompleted ? 'Come back tomorrow' : '5-10 minutes'}
                </Text>
                {!userStats.todayCompleted && (
                  <Text style={styles.morningBonus}>
                    🌅 Morning bonus: +50% XP (6am-9am)
                  </Text>
                )}
              </View>
              <ChevronRight size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Verse of the Day */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verse of the Day</Text>
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>"{dailyVerse.text}"</Text>
          <Text style={styles.verseReference}>— {dailyVerse.reference}</Text>
          <TouchableOpacity style={styles.heartButton}>
            <Heart size={20} color="#EF4444" />
            <Text style={styles.heartButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Study</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleStartFlashcards}>
            <View style={styles.actionIcon}>
              <Target size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.actionTitle}>Flashcards</Text>
            <Text style={styles.actionSubtitle}>Memory verses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Calendar size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Devotional</Text>
            <Text style={styles.actionSubtitle}>Daily reflection</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Learning Paths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Paths</Text>
        {learningPaths.map((path) => (
          <TouchableOpacity
            key={path.id}
            style={styles.pathCard}
            onPress={() => handleLearningPath(path.id, path.premium)}
          >
            <View style={styles.pathHeader}>
              <View style={styles.pathIconContainer}>
                <Text style={styles.pathEmoji}>{path.icon}</Text>
              </View>
              <View style={styles.pathInfo}>
                <View style={styles.pathTitleRow}>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  {path.premium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pathProgress}>{path.progress}% complete</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${path.progress}%`, backgroundColor: path.color }
                ]} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  headerStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  bonusIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  boosterAlert: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  boosterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  boosterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  boosterTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  challengeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  completedChallenge: {
    opacity: 0.8,
  },
  challengeGradient: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  morningBonus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  heartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    gap: 6,
  },
  heartButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pathIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathEmoji: {
    fontSize: 20,
  },
  pathInfo: {
    flex: 1,
  },
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pathProgress: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});