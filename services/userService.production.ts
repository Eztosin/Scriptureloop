import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { errorHandler } from './errorHandler';
import { offlineService } from './offlineService';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserStats = Database['public']['Tables']['user_stats']['Row'];
type FriendActivity = Database['public']['Tables']['friend_activities']['Row'] & {
  profile: { name: string; avatar_url: string | null };
  celebrations: Array<{
    user_id: string;
    message: string;
    emoji: string;
    profile: { name: string };
  }>;
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  joinDate: string;
  favoriteBibleBook: string | null;
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

interface BoosterItem {
  id: string;
  name: string;
  description: string;
  type: '2x' | '3x';
  gemCost: number;
  duration: number;
}

class UserService {
  private currentUser: UserProfile | null = null;

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      if (this.currentUser?.id === user.id) {
        return this.currentUser;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_stats(*),
          following:follows!follower_id(following_id),
          followers:follows!following_id(follower_id)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        errorHandler.handleApiError(profileError);
        return null;
      }

      this.currentUser = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar_url,
        joinDate: profile.created_at,
        favoriteBibleBook: profile.favorite_bible_book,
        stats: profile.user_stats[0],
        following: profile.following?.map(f => f.following_id) || [],
        followers: profile.followers?.map(f => f.follower_id) || [],
        notificationSettings: {
          dailyReminder: true,
          streakReminder: true,
          weeklyXP: true,
          friendActivity: true,
        },
      };

      return this.currentUser;
    } catch (error) {
      errorHandler.handleApiError(error);
      return null;
    }
  }

  async updateUserStats(updates: Partial<UserStats>): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        await offlineService.queueAction({
          type: 'update_stats',
          data: { userId: user.id, updates },
        });
        throw error;
      }

      if (this.currentUser?.stats) {
        this.currentUser.stats = { ...this.currentUser.stats, ...updates };
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async refreshUserData(): Promise<void> {
    this.currentUser = null;
    await this.getCurrentUser();
  }

  async addXP(amount: number, source?: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    try {
      let finalAmount = amount;
      const now = new Date();
      const hour = now.getUTCHours();

      // Apply morning bonus (6am-9am UTC)
      if (hour >= 6 && hour < 9 && !user.stats.has_used_morning_bonus) {
        finalAmount = Math.floor(finalAmount * 1.5);
        await this.updateUserStats({ has_used_morning_bonus: true });
      }

      // Apply streak bonus
      if (user.stats.has_streak_bonus) {
        finalAmount = finalAmount * 2;
        await this.updateUserStats({ has_streak_bonus: false });
      }

      // Apply active booster
      if (user.stats.active_booster && new Date(user.stats.active_booster.expiresAt) > now) {
        const multiplier = user.stats.active_booster.type === '3x' ? 3 : 2;
        finalAmount = finalAmount * multiplier;
      }

      const newXP = user.stats.xp + finalAmount;
      const newWeeklyXP = user.stats.weekly_xp + finalAmount;
      const newLifetimeXP = user.stats.lifetime_xp + finalAmount;
      const newLevel = Math.floor(newXP / 500) + 1;
      const gemsEarned = Math.floor(finalAmount / 100);

      // Record XP transaction
      await supabase.from('xp_transactions').insert({
        user_id: user.id,
        amount: finalAmount,
        source: source || 'unknown',
        multiplier: finalAmount / amount,
      });

      await this.updateUserStats({
        xp: newXP,
        weekly_xp: newWeeklyXP,
        lifetime_xp: newLifetimeXP,
        level: newLevel,
        gems: user.stats.gems + gemsEarned,
      });

      // Create activity for friends
      if (source) {
        await this.createFriendActivity({
          type: 'challenge_completed',
          details: `Completed ${source} and earned ${finalAmount} XP`,
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async updateStreak(): Promise<{ streakBroken: boolean; previousStreak: number }> {
    const user = await this.getCurrentUser();
    if (!user) return { streakBroken: false, previousStreak: 0 };

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = user.stats.last_active_date;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let newStreak = user.stats.streak;
      let streakBroken = false;
      const previousStreak = user.stats.streak;

      if (lastActive === yesterday) {
        newStreak = user.stats.streak + 1;
      } else if (lastActive !== today) {
        // Streak broken - check if it was significant
        if (user.stats.streak >= 3) {
          streakBroken = true;
        }
        newStreak = 1;
      }

      await this.updateUserStats({
        streak: newStreak,
        last_active_date: today,
        today_completed: true,
        total_days_studied: user.stats.total_days_studied + 1,
      });

      // Check for streak milestones
      if (newStreak % 7 === 0) {
        await this.createFriendActivity({
          type: 'milestone_reached',
          details: `Reached a ${newStreak}-day streak! 🔥`,
        });
      }

      return { streakBroken, previousStreak };
    } catch (error) {
      errorHandler.handleApiError(error);
      return { streakBroken: false, previousStreak: 0 };
    }
  }

  async restoreStreakWithGracePass(previousStreak: number): Promise<void> {
    try {
      await this.updateUserStats({
        streak: previousStreak,
      });
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async followUser(userId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;

      if (this.currentUser) {
        this.currentUser.following.push(userId);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      if (this.currentUser) {
        this.currentUser.following = this.currentUser.following.filter(id => id !== userId);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async getFriendActivities(): Promise<FriendActivity[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('friend_activities')
        .select(`
          *,
          profile:profiles(name, avatar_url),
          celebrations:activity_celebrations(
            user_id,
            message,
            emoji,
            profile:profiles(name)
          )
        `)
        .in('user_id', user.following)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      errorHandler.handleApiError(error);
      return [];
    }
  }

  async createFriendActivity(activity: { type: FriendActivity['type']; details: string }): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('friend_activities')
        .insert({
          user_id: user.id,
          type: activity.type,
          details: activity.details,
        });

      if (error) throw error;
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  async getLeagueLeaderboard(league: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_league_leaderboard', { league_name: league });

      if (error) throw error;

      return data || [];
    } catch (error) {
      errorHandler.handleApiError(error);
      return [];
    }
  }

  async resetWeeklyXP(): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_weekly_league_reset');
      if (error) throw error;
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }

  getBoosterShop(): BoosterItem[] {
    return [
      {
        id: '2x_xp',
        name: '2x XP Booster',
        description: 'Double your XP for 2 hours',
        type: '2x',
        gemCost: 50,
        duration: 2,
      },
      {
        id: '3x_xp',
        name: '3x XP Booster',
        description: 'Triple your XP for 1 hour',
        type: '3x',
        gemCost: 100,
        duration: 1,
      },
    ];
  }

  async purchaseBooster(boosterId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      const booster = this.getBoosterShop().find(b => b.id === boosterId);

      if (!user || !booster || user.stats.gems < booster.gemCost) {
        return false;
      }

      const expiresAt = new Date(Date.now() + booster.duration * 60 * 60 * 1000).toISOString();

      await this.updateUserStats({
        gems: user.stats.gems - booster.gemCost,
        active_booster: {
          type: booster.type,
          expiresAt,
        },
      });

      return true;
    } catch (error) {
      errorHandler.handleApiError(error);
      return false;
    }
  }

  async enableStreakBonus(): Promise<void> {
    await this.updateUserStats({ has_streak_bonus: true });
  }

  async signUp(email: string, password: string, name: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
        });
      }

      return true;
    } catch (error) {
      errorHandler.handleApiError(error);
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      errorHandler.handleApiError(error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  }
}

export const userService = new UserService();