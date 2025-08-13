export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          favorite_bible_book: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          favorite_bible_book?: string | null;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          favorite_bible_book?: string | null;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          streak: number;
          xp: number;
          weekly_xp: number;
          lifetime_xp: number;
          level: number;
          gems: number;
          league: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
          league_position: number;
          today_completed: boolean;
          last_active_date: string;
          total_days_studied: number;
          verses_memorized: number;
          grace_passes_used: number;
          grace_passes_available: number;
          has_used_morning_bonus: boolean;
          has_streak_bonus: boolean;
          active_booster: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          streak?: number;
          xp?: number;
          weekly_xp?: number;
          lifetime_xp?: number;
          level?: number;
          gems?: number;
          league?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
          league_position?: number;
          today_completed?: boolean;
          last_active_date?: string;
          total_days_studied?: number;
          verses_memorized?: number;
          grace_passes_used?: number;
          grace_passes_available?: number;
          has_used_morning_bonus?: boolean;
          has_streak_bonus?: boolean;
          active_booster?: any | null;
        };
        Update: {
          streak?: number;
          xp?: number;
          weekly_xp?: number;
          lifetime_xp?: number;
          level?: number;
          gems?: number;
          league?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
          league_position?: number;
          today_completed?: boolean;
          last_active_date?: string;
          total_days_studied?: number;
          verses_memorized?: number;
          grace_passes_used?: number;
          grace_passes_available?: number;
          has_used_morning_bonus?: boolean;
          has_streak_bonus?: boolean;
          active_booster?: any | null;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: {};
      };
      friend_activities: {
        Row: {
          id: string;
          user_id: string;
          type: 'challenge_completed' | 'milestone_reached' | 'league_promoted';
          details: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: 'challenge_completed' | 'milestone_reached' | 'league_promoted';
          details: string;
        };
        Update: {};
      };
      activity_celebrations: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          message: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          activity_id: string;
          user_id: string;
          message: string;
          emoji: string;
        };
        Update: {};
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          multiplier: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          source: string;
          multiplier?: number;
        };
        Update: {};
      };
      offline_actions: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          action_data: any;
          idempotency_key: string;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          action_type: string;
          action_data: any;
          idempotency_key: string;
          processed?: boolean;
        };
        Update: {
          processed?: boolean;
        };
      };
    };
    Functions: {
      get_league_leaderboard: {
        Args: { league_name: string };
        Returns: Array<{
          user_id: string;
          name: string;
          avatar_url: string;
          weekly_xp: number;
          league_position: number;
        }>;
      };
      process_weekly_league_reset: {
        Args: {};
        Returns: void;
      };
    };
  };
}