import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { revenueCatService } from '../../services/revenueCatService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { User, Settings, Award, Calendar, Flame, Star, Book, Heart, Shield, LogOut, Edit3 } from 'lucide-react-native';
import LeagueBadge from '../../components/LeagueBadge';
import GemsDisplay from '../../components/GemsDisplay';

export default function ProfileScreen() {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', favoriteBibleBook: '' });
  const [userProfile, setUserProfile] = useState({
    name: "New User",
    email: "",
    avatar: null,
    level: 1,
    xp: 0,
    weeklyXP: 0,
    lifetimeXP: 0,
    xpToNext: 100,
    streak: 0,
    gems: 0,
    league: 'Bronze' as const,
    joinDate: "",
    totalDaysStudied: 0,
    favoriteBibleBook: "",
    versesMemorized: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setIsLoading(false);
        return;
      }

      console.log('Fetching profile for user:', user.id);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profile, 'Error:', error);

      if (profile) {
        setUserProfile({
          name: profile.display_name || user.email?.split('@')[0] || 'New User',
          email: user.email || '',
          avatar: profile.avatar_url || null,
          level: profile.level || 1,
          xp: profile.lifetime_xp || 0,
          weeklyXP: profile.weekly_xp || 0,
          lifetimeXP: profile.lifetime_xp || 0,
          xpToNext: 100 - ((profile.lifetime_xp || 0) % 100),
          streak: 0,
          gems: profile.gems || 0,
          league: profile.league || 'Bronze',
          joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
          totalDaysStudied: 0,
          favoriteBibleBook: '',
          versesMemorized: 0,
        });
      } else {
        // Fallback for when profile doesn't exist yet
        setUserProfile(prev => ({
          ...prev,
          name: user.email?.split('@')[0] || 'New User',
          email: user.email || '',
          joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const achievements = [
    { id: 1, title: "First Steps", description: "Complete your first challenge", icon: "🎯", unlocked: false },
    { id: 2, title: "Week Warrior", description: "7-day streak", icon: "🔥", unlocked: false },
    { id: 3, title: "Scripture Scholar", description: "Complete 25 challenges", icon: "📚", unlocked: false },
    { id: 4, title: "Memory Master", description: "Memorize 10 verses", icon: "🧠", unlocked: false },
    { id: 5, title: "Month Faithful", description: "30-day streak", icon: "👑", unlocked: false },
    { id: 6, title: "Community Builder", description: "Top 10 in leaderboard", icon: "🤝", unlocked: false },
  ];

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ 
          display_name: editForm.name,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        name: editForm.name,
        favoriteBibleBook: editForm.favoriteBibleBook
      }));

      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (confirmed) {
      try {
        console.log('Profile signing out...');
        await supabase.auth.signOut();
        console.log('Profile sign out successful');
        router.push('/auth');
      } catch (error) {
        console.error('Profile sign out error:', error);
        router.push('/auth');
      }
    }
  };

  const handleGracePass = () => {
    Alert.alert(
      "Grace Pass",
      "Use a Grace Pass to restore your streak? You have 1 remaining this week.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Use Grace Pass", onPress: () => {
          // Handle grace pass logic
          Alert.alert("Streak Restored!", "Your streak has been restored. God's grace is sufficient! 🙏");
        }},
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#6B7280' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.editButton} onPress={() => {
          setEditForm({ name: userProfile.name, favoriteBibleBook: userProfile.favoriteBibleBook });
          setIsEditModalVisible(true);
        }}>
          <Edit3 size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        {userProfile.avatar ? (
          <Image
            source={{ uri: userProfile.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.email}>{userProfile.email}</Text>
        
        <View style={styles.levelContainer}>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>Level {userProfile.level}</Text>
            <LeagueBadge league={userProfile.league} size="small" />
          </View>
          <View style={styles.xpBar}>
            <View 
              style={[
                styles.xpFill, 
                { width: `${(userProfile.xp / (userProfile.xp + userProfile.xpToNext)) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.xpText}>{userProfile.xp} / {userProfile.xp + userProfile.xpToNext} XP</Text>
          <View style={styles.gemsContainer}>
            <GemsDisplay gems={userProfile.gems} size="small" />
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Flame size={24} color="#FF6B35" />
          <Text style={styles.statNumber}>{userProfile.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Star size={24} color="#D4AF37" />
          <Text style={styles.statNumber}>{userProfile.weeklyXP}</Text>
          <Text style={styles.statLabel}>Weekly XP</Text>
        </View>
        
        <View style={styles.statCard}>
          <Book size={24} color="#8B5CF6" />
          <Text style={styles.statNumber}>{userProfile.versesMemorized}</Text>
          <Text style={styles.statLabel}>Verses Memorized</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleGracePass}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Shield size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Grace Pass</Text>
              <Text style={styles.actionSubtitle}>Restore broken streak (1 left)</Text>
            </View>
          </View>
          <Text style={styles.actionBadge}>Free</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={async () => {
            try {
              const { revenueCatService } = await import('../../services/revenueCatService');
              const result = await revenueCatService.purchasePremiumContent();
              
              if (result.success) {
                Alert.alert('Premium Unlocked! 🎆', 'You now have access to premium devotional content!');
              } else {
                Alert.alert('Purchase Failed', result.error || 'Something went wrong');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to process purchase');
            }
          }}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Heart size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Premium Content</Text>
              <Text style={styles.actionSubtitle}>Unlock devotional packs</Text>
            </View>
          </View>
          <Text style={styles.actionBadge}>$2.99</Text>
        </TouchableOpacity>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.lockedAchievement
              ]}
            >
              <Text style={[
                styles.achievementIcon,
                !achievement.unlocked && styles.lockedIcon
              ]}>
                {achievement.icon}
              </Text>
              <Text style={[
                styles.achievementTitle,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.title}
              </Text>
              <Text style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.description}
              </Text>
              {achievement.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Award size={16} color="#D4AF37" />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.settingsCard}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.settingsLeft}>
            <Settings size={20} color="#6B7280" />
            <Text style={styles.settingsText}>Settings & Preferences</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsCard} onPress={handleSignOut}>
          <View style={styles.settingsLeft}>
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.settingsText, { color: '#EF4444' }]}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Favorite Bible Book</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.favoriteBibleBook}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, favoriteBibleBook: text }))}
                placeholder="e.g., Psalms, John, Romans"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  levelContainer: {
    alignItems: 'center',
    width: '100%',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gemsContainer: {
    marginTop: 8,
  },
  xpBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
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
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedIcon: {
    opacity: 0.3,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingsCard: {
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
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  defaultAvatar: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});