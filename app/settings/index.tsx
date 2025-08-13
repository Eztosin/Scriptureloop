import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';

export default function SettingsScreen() {
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminder: true,
    streakReminder: true,
    weeklyXP: true,
    friendActivity: true,
  });
  const [reminderTime, setReminderTime] = useState(19);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const user = await userService.getCurrentUser();
    if (user?.notificationSettings) {
      setNotificationSettings(user.notificationSettings);
    }
  };

  const updateNotificationSetting = async (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    const user = await userService.getCurrentUser();
    if (user) {
      user.notificationSettings = newSettings;
      localStorage.setItem('scriptureloop_user', JSON.stringify(user));
    }

    if (key === 'dailyReminder' && value) {
      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        await notificationService.scheduleDailyReminder(reminderTime);
      } else {
        Alert.alert('Permission Required', 'Please enable notifications in settings.');
      }
    }
  };

  const handleDeleteAccount = () => {
    console.log('Delete account button pressed');
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your progress, achievements, and data."
    );
    
    if (confirmed) {
      console.log('Delete confirmed');
      confirmDeleteAccount();
    } else {
      console.log('Delete cancelled');
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      console.log('Starting account deletion...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('No user found');
        window.alert('Error: No user found to delete.');
        return;
      }

      console.log('Deleting user data for:', user.id);
      
      // Delete user data from database
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        throw deleteError;
      }
      
      console.log('User data deleted, signing out...');
      
      // Sign out user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out:', signOutError);
      }
      
      window.alert("Account Deleted: Your account and all data have been permanently deleted.");
      router.replace('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      window.alert('Error: ' + (error.message || 'Failed to delete account. Please try again.'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Daily Reminder</Text>
                <Text style={styles.settingDescription}>Get reminded to complete your daily challenge</Text>
              </View>
              <Switch
                value={notificationSettings.dailyReminder}
                onValueChange={(value) => updateNotificationSetting('dailyReminder', value)}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Streak Milestones</Text>
                <Text style={styles.settingDescription}>Celebrate when you reach streak milestones</Text>
              </View>
              <Switch
                value={notificationSettings.streakReminder}
                onValueChange={(value) => updateNotificationSetting('streakReminder', value)}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Friend Activity</Text>
                <Text style={styles.settingDescription}>Get notified when friends reach milestones</Text>
              </View>
              <Switch
                value={notificationSettings.friendActivity}
                onValueChange={(value) => updateNotificationSetting('friendActivity', value)}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
            <Text style={styles.deleteButtonSubtext}>Permanently delete your account and all data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingCard: {
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  deleteButtonSubtext: {
    fontSize: 14,
    color: '#B91C1C',
  },
});