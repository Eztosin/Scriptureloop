-- Enable RLS
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  favorite_bible_book TEXT
);

-- Create user_stats table
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  lifetime_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  gems INTEGER DEFAULT 50,
  league TEXT DEFAULT 'Bronze' CHECK (league IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
  league_position INTEGER DEFAULT 0,
  today_completed BOOLEAN DEFAULT FALSE,
  last_active_date DATE DEFAULT CURRENT_DATE,
  total_days_studied INTEGER DEFAULT 0,
  verses_memorized INTEGER DEFAULT 0,
  grace_passes_used INTEGER DEFAULT 0,
  grace_passes_available INTEGER DEFAULT 1,
  has_used_morning_bonus BOOLEAN DEFAULT FALSE,
  has_streak_bonus BOOLEAN DEFAULT FALSE,
  active_booster JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create friend_activities table
CREATE TABLE friend_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('challenge_completed', 'milestone_reached', 'league_promoted')),
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create xp_transactions table
CREATE TABLE xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  multiplier DECIMAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create offline_actions table
CREATE TABLE offline_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, idempotency_key)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view public profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can view own stats" ON user_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public stats" ON user_stats FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Users can view follows" ON follows FOR SELECT USING (true);

CREATE POLICY "Users can view friend activities" ON friend_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = friend_activities.user_id
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can create own activities" ON friend_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own offline actions" ON offline_actions FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION get_league_leaderboard(league_name TEXT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  weekly_xp INTEGER,
  league_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.avatar_url,
    us.weekly_xp,
    us.league_position
  FROM profiles p
  JOIN user_stats us ON p.id = us.user_id
  WHERE us.league = league_name
  ORDER BY us.weekly_xp DESC, us.league_position ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Weekly league reset function
CREATE OR REPLACE FUNCTION process_weekly_league_reset()
RETURNS VOID AS $$
DECLARE
  league_names TEXT[] := ARRAY['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  league_name TEXT;
  user_record RECORD;
  position_counter INTEGER;
BEGIN
  FOREACH league_name IN ARRAY league_names
  LOOP
    position_counter := 1;
    
    FOR user_record IN
      SELECT user_id, weekly_xp, league_position
      FROM user_stats
      WHERE league = league_name
      ORDER BY weekly_xp DESC, league_position ASC
    LOOP
      IF position_counter <= 5 AND league_name != 'Diamond' THEN
        UPDATE user_stats 
        SET league = CASE 
          WHEN league_name = 'Bronze' THEN 'Silver'
          WHEN league_name = 'Silver' THEN 'Gold'
          WHEN league_name = 'Gold' THEN 'Platinum'
          WHEN league_name = 'Platinum' THEN 'Diamond'
        END,
        league_position = 1,
        weekly_xp = 0,
        has_used_morning_bonus = FALSE
        WHERE user_id = user_record.user_id;
        
      ELSIF position_counter > (SELECT COUNT(*) FROM user_stats WHERE league = league_name) - 5 
            AND league_name != 'Bronze' THEN
        UPDATE user_stats 
        SET league = CASE 
          WHEN league_name = 'Silver' THEN 'Bronze'
          WHEN league_name = 'Gold' THEN 'Silver'
          WHEN league_name = 'Platinum' THEN 'Gold'
          WHEN league_name = 'Diamond' THEN 'Platinum'
        END,
        league_position = 999,
        weekly_xp = 0,
        has_used_morning_bonus = FALSE
        WHERE user_id = user_record.user_id;
        
      ELSE
        UPDATE user_stats 
        SET weekly_xp = 0,
            has_used_morning_bonus = FALSE,
            league_position = position_counter
        WHERE user_id = user_record.user_id;
      END IF;
      
      position_counter := position_counter + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_stats when profile is created
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_stats();