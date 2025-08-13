interface UserStats {
  streak: number;
  xp: number;
  weeklyXP: number;
  lifetimeXP: number;
  level: number;
  todayCompleted: boolean;
  lastActiveDate: string;
  totalDaysStudied: number;
  versesMemorized: number;
  gracePassesUsed: number;
  gracePassesAvailable: number;
  gems: number;
  league: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  leaguePosition: number;
  hasUsedMorningBonus: boolean;
  hasStreakBonus: boolean;
  activeBooster?: {
    type: '2x' | '3x';
    expiresAt: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  favoriteBibleBook: string;
  stats: UserStats;
  following: string[];
  followers: string[];
  notificationSettings: {
    dailyReminder: boolean;
    streakReminder: boolean;
    weeklyXP: boolean;
    friendActivity: boolean;
  };
}

interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'challenge_completed' | 'milestone_reached' | 'league_promoted';
  details: string;
  timestamp: string;
  celebrations: { userId: string; message: string; emoji: string }[];
}

interface BoosterItem {
  id: string;
  name: string;
  description: string;
  type: '2x' | '3x';
  gemCost: number;
  duration: number; // in hours
}

import AsyncStorage from '@react-native-async-storage/async-storage';

class UserService {
  private readonly storageKey = 'scriptureloop_user';
  
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // In a real app, this would fetch from Supabase
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUserStats(updates: Partial<UserStats>): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        user.stats = { ...user.stats, ...updates };
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  async addXP(amount: number, source?: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      let finalAmount = amount;
      
      // Apply morning bonus (6am-9am)
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 6 && hour < 9 && !user.stats.hasUsedMorningBonus) {
        finalAmount = Math.floor(finalAmount * 1.5);
        await this.updateUserStats({ hasUsedMorningBonus: true });
      }
      
      // Apply streak bonus
      if (user.stats.hasStreakBonus) {
        finalAmount = finalAmount * 2;
        await this.updateUserStats({ hasStreakBonus: false });
      }
      
      // Apply active booster
      if (user.stats.activeBooster && new Date(user.stats.activeBooster.expiresAt) > now) {
        const multiplier = user.stats.activeBooster.type === '3x' ? 3 : 2;
        finalAmount = finalAmount * multiplier;
      }
      
      const newXP = user.stats.xp + finalAmount;
      const newWeeklyXP = user.stats.weeklyXP + finalAmount;
      const newLifetimeXP = user.stats.lifetimeXP + finalAmount;
      const newLevel = Math.floor(newXP / 500) + 1;
      
      // Award gems based on XP gained
      const gemsEarned = Math.floor(finalAmount / 100);
      
      await this.updateUserStats({
        xp: newXP,
        weeklyXP: newWeeklyXP,
        lifetimeXP: newLifetimeXP,
        level: newLevel,
        gems: user.stats.gems + gemsEarned
      });
      
      // Create activity for friends
      if (source) {
        await this.createFriendActivity({
          type: 'challenge_completed',
          details: `Completed ${source} and earned ${finalAmount} XP`
        });
      }
    }
  }

  async updateStreak(): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      const today = new Date().toDateString();
      const lastActive = new Date(user.stats.lastActiveDate).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      let newStreak = user.stats.streak;
      
      if (lastActive === yesterday) {
        // Continued streak
        newStreak = user.stats.streak + 1;
      } else if (lastActive !== today) {
        // Broke streak
        newStreak = 1;
      }
      
      await this.updateUserStats({
        streak: newStreak,
        lastActiveDate: today,
        todayCompleted: true,
        totalDaysStudied: user.stats.totalDaysStudied + 1
      });
    }
  }

  async useGracePass(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (user && user.stats.gracePassesAvailable > 0) {
      await this.updateUserStats({
        gracePassesUsed: user.stats.gracePassesUsed + 1,
        gracePassesAvailable: user.stats.gracePassesAvailable - 1,
        streak: user.stats.streak > 0 ? user.stats.streak : 1
      });
      return true;
    }
    return false;
  }

  async createUser(userData: {
    name: string;
    email: string;
    avatar?: string;
  }): Promise<UserProfile> {
    const user: UserProfile = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      joinDate: new Date().toISOString(),
      favoriteBibleBook: '',
      stats: {
        streak: 0,
        xp: 0,
        weeklyXP: 0,
        lifetimeXP: 0,
        level: 1,
        todayCompleted: false,
        lastActiveDate: new Date().toDateString(),
        totalDaysStudied: 0,
        versesMemorized: 0,
        gracePassesUsed: 0,
        gracePassesAvailable: 1,
        gems: 50,
        league: 'Bronze',
        leaguePosition: 0,
        hasUsedMorningBonus: false,
        hasStreakBonus: false
      },
      following: [],
      followers: [],
      notificationSettings: {
        dailyReminder: true,
        streakReminder: true,
        weeklyXP: true,
        friendActivity: true
      }
    };
    
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(user));
    return user;
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly'): Promise<any[]> {
    // In a real app, this would fetch from Supabase
    // For demo, return mock data
    return [
      { id: 1, name: "Sarah M.", xp: 2450, streak: 14, level: 5, rank: 1 },
      { id: 2, name: "David K.", xp: 2200, streak: 12, level: 4, rank: 2 },
      { id: 3, name: "Rachel L.", xp: 1980, streak: 9, level: 4, rank: 3 }
    ];
  }

  calculateXPForChallenge(score: number, totalQuestions: number): number {
    const baseXP = 50;
    const bonusXP = Math.round((score / totalQuestions) * 50);
    return baseXP + bonusXP;
  }

  calculateXPForFlashcards(correctAnswers: number, totalCards: number): number {
    return correctAnswers * 20; // 20 XP per correct flashcard
  }

  // Social Features
  async followUser(userId: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user && !user.following.includes(userId)) {
      user.following.push(userId);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      user.following = user.following.filter(id => id !== userId);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  async getFriendActivities(): Promise<FriendActivity[]> {
    // Mock data - in real app, fetch from backend
    return [
      {
        id: '1',
        userId: '2',
        userName: 'Sarah M.',
        userAvatar: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        type: 'challenge_completed',
        details: 'Completed Daily Reading and earned 75 XP',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        celebrations: []
      },
      {
        id: '2',
        userId: '3',
        userName: 'David K.',
        userAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        type: 'milestone_reached',
        details: 'Reached a 14-day streak! 🔥',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        celebrations: [{ userId: '1', message: 'Amazing!', emoji: '🎉' }]
      }
    ];
  }

  async createFriendActivity(activity: { type: FriendActivity['type']; details: string }): Promise<void> {
    // In real app, this would post to backend
    console.log('Friend activity created:', activity);
  }

  async celebrateActivity(activityId: string, message: string, emoji: string): Promise<void> {
    // In real app, this would post celebration to backend
    console.log('Celebration added:', { activityId, message, emoji });
  }

  // League System
  async getLeagueLeaderboard(league: string): Promise<any[]> {
    // Mock data - in real app, fetch from backend
    return [
      { id: 1, name: "Sarah M.", weeklyXP: 850, league: 'Silver', rank: 1 },
      { id: 2, name: "David K.", weeklyXP: 720, league: 'Silver', rank: 2 },
      { id: 3, name: "You", weeklyXP: 650, league: 'Silver', rank: 3 }
    ];
  }

  async resetWeeklyXP(): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      await this.updateUserStats({ weeklyXP: 0, hasUsedMorningBonus: false });
    }
  }

  // Gems & Boosters
  getBoosterShop(): BoosterItem[] {
    return [
      {
        id: '2x_xp',
        name: '2x XP Booster',
        description: 'Double your XP for 2 hours',
        type: '2x',
        gemCost: 50,
        duration: 2
      },
      {
        id: '3x_xp',
        name: '3x XP Booster',
        description: 'Triple your XP for 1 hour',
        type: '3x',
        gemCost: 100,
        duration: 1
      }
    ];
  }

  async purchaseBooster(boosterId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    const booster = this.getBoosterShop().find(b => b.id === boosterId);
    
    if (user && booster && user.stats.gems >= booster.gemCost) {
      const expiresAt = new Date(Date.now() + booster.duration * 60 * 60 * 1000).toISOString();
      
      await this.updateUserStats({
        gems: user.stats.gems - booster.gemCost,
        activeBooster: {
          type: booster.type,
          expiresAt
        }
      });
      return true;
    }
    return false;
  }

  async enableStreakBonus(): Promise<void> {
    await this.updateUserStats({ hasStreakBonus: true });
  }
}

export const userService = new UserService();