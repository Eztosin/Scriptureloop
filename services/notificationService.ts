import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

const SPIRITUAL_MESSAGES = [
  "Your Bible isn't going to read itself. 😉",
  "Time for your spiritual XP — your soul's got levels too.",
  "🔥 Don't let the streak die… not on your watch.",
  "Even 5 minutes with Scripture is better than 50 with stress.",
  "Don't make us send a talking donkey 🫏 (Numbers 22:28). Open ScriptureLoop.",
  "Your daily dose of wisdom is waiting! 📖✨",
  "God's got something special for you today. Check it out! 🙏",
  "Time to level up your faith game! 💪",
  "Your spiritual muscles need their daily workout! 💪📖",
  "The Word is calling... will you answer? 📞✨"
];

const STREAK_MESSAGES = [
  "🔥 {streak} days strong! Keep the fire burning!",
  "Amazing! {streak} days of consistency. God sees your dedication! 🙏",
  "Your {streak}-day streak is inspiring! Don't stop now! ⭐",
  "Wow! {streak} days of faithful study. You're crushing it! 💪"
];

const WEEKLY_XP_MESSAGES = [
  "📊 Weekly XP update: You're at {xp} XP! How will you finish strong?",
  "⚡ {xp} XP this week! Your spiritual growth is showing!",
  "🎯 Current weekly XP: {xp}. Ready to climb higher?"
];

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus === 'granted') {
      await this.registerForPushNotifications();
    }
    
    return finalStatus === 'granted';
  }
  
  async registerForPushNotifications(): Promise<void> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: token.data })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  }

  async scheduleDailyReminder(hour: number = 19): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const message = SPIRITUAL_MESSAGES[Math.floor(Math.random() * SPIRITUAL_MESSAGES.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "ScriptureLoop Daily Reminder",
        body: message,
        sound: true,
      },
      trigger: {
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }

  async scheduleStreakReminder(streak: number): Promise<void> {
    const message = STREAK_MESSAGES[Math.floor(Math.random() * STREAK_MESSAGES.length)]
      .replace('{streak}', streak.toString());
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Streak Milestone! 🔥",
        body: message,
        sound: true,
      },
      trigger: {
        seconds: 2,
      },
    });
  }

  async scheduleWeeklyXPReminder(xp: number): Promise<void> {
    const message = WEEKLY_XP_MESSAGES[Math.floor(Math.random() * WEEKLY_XP_MESSAGES.length)]
      .replace('{xp}', xp.toString());
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly Progress Update",
        body: message,
        sound: true,
      },
      trigger: {
        weekday: 7, // Sunday
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });
  }

  async scheduleFriendActivityNotification(friendName: string, activity: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${friendName} is on fire! 🔥`,
        body: activity,
        sound: true,
        data: { type: 'friend_activity' },
      },
      trigger: {
        seconds: 1,
      },
    });
  }
  
  async sendPushToUser(userId: string, title: string, body: string, data?: any): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .single();
        
      if (!profile?.push_token) return;
      
      const message = {
        to: profile.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      };
      
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }
  
  async sendFriendActivityBroadcast(userId: string, activity: string): Promise<void> {
    try {
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id, profiles!follower_id(name)')
        .eq('following_id', userId);
        
      const { data: user } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
        
      if (!followers || !user) return;
      
      for (const follower of followers) {
        await this.sendPushToUser(
          follower.follower_id,
          `${user.name} is on fire! 🔥`,
          activity,
          { type: 'friend_activity', userId }
        );
      }
    } catch (error) {
      console.error('Failed to send friend activity broadcast:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  setupNotificationHandlers(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    
    // Handle user tapping on notification
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.type === 'friend_activity' && data.userId) {
        // Navigate to friend's profile or activity
        console.log('Navigate to friend activity:', data.userId);
      }
    });
  }
}

export const notificationService = new NotificationService();