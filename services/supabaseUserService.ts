import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

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
  league: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
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

class SupabaseUserService {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select(`
          *,
          boosters!inner(type, expires_at)
        `)
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      // Get following/followers count
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      const { data: followers } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user.id);

      // Find active booster
      const activeBooster = profile.boosters?.find((b: any) => 
        b.is_active && new Date(b.expires_at) > new Date()
      );

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        joinDate: profile.join_date,
        favoriteBibleBook: profile.favorite_bible_book || '',
        stats: {
          streak: profile.streak,
          xp: profile.xp,
          weeklyXP: profile.weekly_xp,
          lifetimeXP: profile.lifetime_xp,
          level: profile.level,
          todayCompleted: profile.today_completed,
          lastActiveDate: profile.last_active_date,
          totalDaysStudied: profile.total_days_studied,
          versesMemorized: profile.verses_memorized,
          gracePassesUsed: profile.grace_passes_used,
          gracePassesAvailable: profile.grace_passes_available,
          gems: profile.gems,
          league: this.mapLeagueNumber(profile.league),
          leaguePosition: profile.league_position,
          hasUsedMorningBonus: profile.has_used_morning_bonus,
          hasStreakBonus: profile.has_streak_bonus,
          activeBooster: activeBooster ? {
            type: activeBooster.type,
            expiresAt: activeBooster.expires_at
          } : undefined
        },
        following: following?.map(f => f.following_id) || [],
        followers: followers?.map(f => f.follower_id) || [],
        notificationSettings: profile.notification_settings
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  private mapLeagueNumber(league: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
    switch (league) {
      case 2: return 'Silver';
      case 3: return 'Gold';
      case 4: return 'Diamond';
      default: return 'Bronze';
    }
  }

  async completeDailyChallenge(score: number, totalQuestions: number): Promise<void> {
    const xp = this.calculateXPForChallenge(score, totalQuestions);
    const actionId = `challenge_${Date.now()}_${uuidv4()}`;
    
    const { error } = await supabase.rpc('award_xp', {
      p_amount: xp,
      p_source: 'Daily Challenge',
      p_action_id: actionId,
      p_meta: { score, totalQuestions }
    });

    if (error) throw error;
    await this.updateStreak();
  }

  async completeFlashcards(correctAnswers: number, totalCards: number): Promise<void> {
    const xp = this.calculateXPForFlashcards(correctAnswers, totalCards);
    const actionId = `flashcards_${Date.now()}_${uuidv4()}`;
    
    const { error } = await supabase.rpc('award_xp', {
      p_amount: xp,
      p_source: 'Memory Verses',
      p_action_id: actionId,
      p_meta: { correctAnswers, totalCards }
    });

    if (error) throw error;
  }

  async giftBooster(toUserId: string, boosterType: '2x' | '3x'): Promise<boolean> {
    const actionId = `gift_${Date.now()}_${uuidv4()}`;
    
    const { data, error } = await supabase.rpc('gift_booster', {
      p_to_user_id: toUserId,
      p_booster_type: boosterType,
      p_action_id: actionId
    });

    if (error) {
      console.error('Error gifting booster:', error);
      return false;
    }

    return data?.success || false;
  }

  async useGracePass(): Promise<boolean> {
    const actionId = `grace_pass_${Date.now()}_${uuidv4()}`;
    
    const { data, error } = await supabase.rpc('redeem_grace_pass', {
      p_action_id: actionId
    });

    if (error) {
      console.error('Error using grace pass:', error);
      return false;
    }

    return data?.success || false;
  }

  async updateStreak(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('users')
      .update({
        last_active_date: today,
        today_completed: true,
        total_days_studied: supabase.raw('total_days_studied + 1')
      })
      .eq('id', user.id);

    if (error) throw error;
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' = 'weekly', league?: number): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_league: league,
      p_timeframe: timeframe
    });

    if (error) throw error;
    return data || [];
  }

  async getFriendActivities(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        users!inner(name, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    return data?.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      userName: activity.users.name,
      userAvatar: activity.users.avatar,
      type: activity.type,
      details: activity.details,
      timestamp: activity.created_at,
      celebrations: activity.celebrations || []
    })) || [];
  }

  async followUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: userId
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) throw error;
  }

  async purchaseBooster(boosterId: string): Promise<boolean> {
    // This would integrate with RevenueCat for actual purchases
    // For now, implement gem-based purchases
    const booster = this.getBoosterShop().find(b => b.id === boosterId);
    if (!booster) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('users')
      .select('gems')
      .eq('id', user.id)
      .single();

    if (!profile || profile.gems < booster.gemCost) return false;

    // Deduct gems and create booster
    const expiresAt = new Date(Date.now() + booster.duration * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ gems: profile.gems - booster.gemCost })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const { error: boosterError } = await supabase
      .from('boosters')
      .insert({
        user_id: user.id,
        type: booster.type,
        expires_at: expiresAt
      });

    if (boosterError) throw boosterError;
    return true;
  }

  // XP CALCULATION METHODS
  // These determine how much XP users earn for different activities
  
  // Calculate XP for daily Bible challenges
  // Base XP + performance bonus based on score percentage
  calculateXPForChallenge(score: number, totalQuestions: number): number {
    const baseXP = 50;  // Everyone gets base XP for participation
    const bonusXP = Math.round((score / totalQuestions) * 50);  // Up to 50 bonus XP for perfect score
    return baseXP + bonusXP;  // Total: 50-100 XP depending on performance
  }

  // Calculate XP for flashcard sessions
  // Simple: 20 XP per correct answer
  calculateXPForFlashcards(correctAnswers: number, totalCards: number): number {
    return correctAnswers * 20; // 20 XP per correct flashcard
  }

  // GET BOOSTER SHOP CATALOG
  // Returns available boosters that can be purchased with gems
  // Prices and durations balanced for game economy
  getBoosterShop() {
    return [
      {
        id: '2x_xp',
        name: '2x XP Booster',
        description: 'Double your XP for 2 hours',
        type: '2x' as const,
        gemCost: 50,    // Affordable for regular players
        duration: 2     // 2 hours duration
      },
      {
        id: '3x_xp',
        name: '3x XP Booster',
        description: 'Triple your XP for 1 hour',
        type: '3x' as const,
        gemCost: 100,   // More expensive for higher multiplier
        duration: 1     // Shorter duration for balance
      }
    ];
  }

  // OFFLINE ACTION SUPPORT
  // Queues actions performed while offline for later processing
  // Ensures no progress is lost due to connectivity issues
  
  // Queue an action to be processed when back online
  async queueOfflineAction(actionType: string, payload: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate unique action ID
    const actionId = `offline_${actionType}_${Date.now()}_${uuidv4()}`;
    
    // Insert into offline actions queue
    const { error } = await supabase
      .from('offline_actions')
      .insert({
        user_id: user.id,
        action_id: actionId,
        action_type: actionType,  // e.g., 'award_xp', 'redeem_grace_pass'
        payload                   // Data needed to process the action
      });

    if (error) throw error;
  }

  // Process all queued offline actions for current user
  // Called when app comes back online
  async processOfflineActions(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Call server-side RPC to process all queued actions
    // Server handles them in chronological order with proper error handling
    const { error } = await supabase.rpc('process_offline_actions', {
      p_user_id: user.id
    });

    if (error) throw error;
  }
}

}

// EXPORT SINGLETON INSTANCE
// Create single instance to be used throughout the app
// This maintains state and provides consistent interface
export const supabaseUserService = new SupabaseUserService();