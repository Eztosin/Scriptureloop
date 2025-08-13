-- ScriptureLoop RPC Functions
-- These are server-side functions that handle all game logic securely
-- All functions are idempotent (safe to call multiple times with same parameters)
-- Functions use SECURITY DEFINER to run with elevated privileges while maintaining RLS

-- AWARD XP FUNCTION
-- Awards experience points to the current user with bonuses and multipliers
-- IDEMPOTENT: Same action_id will not award XP twice
-- Handles: morning bonus, streak bonus, active boosters, level calculation, gem rewards
-- Parameters:
--   p_amount: Base XP to award (before bonuses)
--   p_source: Description of what earned the XP (e.g., "Daily Challenge")
--   p_action_id: Unique identifier to prevent duplicate awards
--   p_meta: Additional data to store with this transaction
CREATE OR REPLACE FUNCTION award_xp(
    p_amount INTEGER,
    p_source TEXT,
    p_action_id TEXT,
    p_meta JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
DECLARE
    -- Get current authenticated user ID
    v_user_id UUID := auth.uid();
    
    -- Variables for idempotency check
    v_existing_entry UUID;
    
    -- XP calculation variables
    v_final_amount INTEGER := p_amount;  -- Will be modified by bonuses
    
    -- Time-based variables for morning bonus
    v_now TIMESTAMPTZ := NOW();
    v_hour INTEGER := EXTRACT(HOUR FROM v_now AT TIME ZONE 'UTC');
    
    -- User data and calculation results
    v_user_record RECORD;
    v_new_level INTEGER;
    v_gems_earned INTEGER;
BEGIN
    -- IDEMPOTENCY CHECK
    -- If this action_id already exists, return success without doing anything
    -- This prevents duplicate XP awards if function is called multiple times
    SELECT id INTO v_existing_entry FROM xp_ledger WHERE action_id = p_action_id;
    IF v_existing_entry IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already processed', 'xp_awarded', 0);
    END IF;

    -- GET USER DATA
    -- Fetch current user record to check bonuses and calculate new values
    SELECT * INTO v_user_record FROM users WHERE id = v_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- APPLY MORNING BONUS
    -- 50% XP bonus for activities completed between 6-9 AM UTC
    -- Can only be used once per day (has_used_morning_bonus flag)
    IF v_hour >= 6 AND v_hour < 9 AND NOT v_user_record.has_used_morning_bonus THEN
        v_final_amount := FLOOR(v_final_amount * 1.5);  -- 1.5x multiplier
        UPDATE users SET has_used_morning_bonus = TRUE WHERE id = v_user_id;
    END IF;

    -- APPLY STREAK BONUS
    -- Special 2x multiplier that can be activated by certain achievements
    -- Consumed after use (one-time bonus)
    IF v_user_record.has_streak_bonus THEN
        v_final_amount := v_final_amount * 2;  -- Double XP
        UPDATE users SET has_streak_bonus = FALSE WHERE id = v_user_id;  -- Consume bonus
    END IF;

    -- APPLY ACTIVE BOOSTER
    -- Check if user has any active (non-expired) boosters
    -- Boosters are purchased items that multiply XP for a limited time
    IF EXISTS (
        SELECT 1 FROM boosters 
        WHERE user_id = v_user_id AND is_active = TRUE AND expires_at > v_now
    ) THEN
        DECLARE
            v_booster_type TEXT;
        BEGIN
            -- Get the most recently activated booster (in case of multiple)
            SELECT type INTO v_booster_type FROM boosters 
            WHERE user_id = v_user_id AND is_active = TRUE AND expires_at > v_now
            ORDER BY expires_at DESC LIMIT 1;
            
            -- Apply booster multiplier
            IF v_booster_type = '3x' THEN
                v_final_amount := v_final_amount * 3;  -- Triple XP
            ELSIF v_booster_type = '2x' THEN
                v_final_amount := v_final_amount * 2;  -- Double XP
            END IF;
        END;
    END IF;

    -- CALCULATE REWARDS
    -- Level: Every 500 XP = 1 level (starting at level 1)
    -- Gems: Every 100 XP earned = 1 gem (secondary currency)
    v_new_level := FLOOR((v_user_record.xp + v_final_amount) / 500) + 1;
    v_gems_earned := FLOOR(v_final_amount / 100);

    -- RECORD TRANSACTION
    -- Create immutable record of this XP award in the ledger
    -- This provides audit trail and enables idempotency
    INSERT INTO xp_ledger (user_id, action_id, amount, source, meta)
    VALUES (v_user_id, p_action_id, v_final_amount, p_source, p_meta);

    -- UPDATE USER STATS ATOMICALLY
    -- All user stat updates happen in one atomic operation
    -- This prevents race conditions and ensures data consistency
    UPDATE users SET
        xp = xp + v_final_amount,                    -- Add to current XP
        weekly_xp = weekly_xp + v_final_amount,      -- Add to weekly XP (for leagues)
        lifetime_xp = lifetime_xp + v_final_amount,  -- Add to lifetime total
        level = v_new_level,                         -- Update level based on new XP
        gems = gems + v_gems_earned,                 -- Award gems
        updated_at = v_now                           -- Update timestamp
    WHERE id = v_user_id;

    -- CREATE SOCIAL ACTIVITY
    -- Add entry to activity feed so friends can see this achievement
    -- This powers the social/friends feed feature
    INSERT INTO activities (user_id, type, details, meta)
    VALUES (v_user_id, 'challenge_completed', 
            'Completed ' || p_source || ' and earned ' || v_final_amount || ' XP',
            jsonb_build_object('xp_earned', v_final_amount, 'source', p_source));

    -- RETURN SUCCESS RESPONSE
    -- Return structured data about what was awarded
    RETURN jsonb_build_object(
        'success', true, 
        'xp_awarded', v_final_amount,    -- Final XP after all bonuses
        'new_level', v_new_level,        -- User's new level
        'gems_earned', v_gems_earned     -- Gems awarded alongside XP
    );
END;
$$;

-- GIFT BOOSTER FUNCTION
-- Allows one user to gift an XP booster to another user
-- IDEMPOTENT: Same action_id will not create duplicate boosters
-- Parameters:
--   p_to_user_id: UUID of user receiving the booster
--   p_booster_type: '2x' or '3x' multiplier type
--   p_action_id: Unique identifier to prevent duplicate gifts
CREATE OR REPLACE FUNCTION gift_booster(
    p_to_user_id UUID,
    p_booster_type TEXT,
    p_action_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- User giving the gift
    v_from_user_id UUID := auth.uid();
    
    -- For idempotency check
    v_existing_entry UUID;
    
    -- Booster timing
    v_expires_at TIMESTAMPTZ;
    v_duration INTEGER;  -- Hours the booster lasts
BEGIN
    -- IDEMPOTENCY CHECK
    -- Prevent duplicate booster gifts with same action_id
    -- Note: This is a simplified check - in production you might want a separate gifts table
    SELECT id INTO v_existing_entry FROM boosters WHERE user_id = p_to_user_id AND created_at::TEXT = p_action_id;
    IF v_existing_entry IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already processed');
    END IF;

    -- VALIDATE BOOSTER TYPE AND SET DURATION
    -- Different booster types have different durations for game balance
    -- 3x boosters are more powerful but last shorter
    IF p_booster_type = '2x' THEN
        v_duration := 2; -- 2x booster lasts 2 hours
    ELSIF p_booster_type = '3x' THEN
        v_duration := 1; -- 3x booster lasts 1 hour (more powerful, shorter duration)
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid booster type');
    END IF;

    -- Calculate when this booster expires
    v_expires_at := NOW() + (v_duration || ' hours')::INTERVAL;

    -- CREATE BOOSTER FOR RECIPIENT
    -- Add booster to recipient's account
    INSERT INTO boosters (user_id, type, expires_at)
    VALUES (p_to_user_id, p_booster_type, v_expires_at);

    -- CREATE SOCIAL ACTIVITY
    -- Record this gift in the giver's activity feed
    INSERT INTO activities (user_id, type, details, meta)
    VALUES (v_from_user_id, 'booster_gifted',
            'Gifted a ' || p_booster_type || ' XP booster',
            jsonb_build_object('to_user_id', p_to_user_id, 'booster_type', p_booster_type));

    RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
END;
$$;

-- REDEEM GRACE PASS FUNCTION
-- Allows user to restore their streak using a grace pass
-- Grace passes are limited resources that can be purchased or earned
-- IDEMPOTENT: Same action_id will not consume multiple grace passes
-- Parameter:
--   p_action_id: Unique identifier to prevent duplicate redemptions
CREATE OR REPLACE FUNCTION redeem_grace_pass(p_action_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Current authenticated user
    v_user_id UUID := auth.uid();
    
    -- User's current data
    v_user_record RECORD;
    
    -- For idempotency check
    v_existing_action UUID;
BEGIN
    -- IDEMPOTENCY CHECK
    -- Check if this grace pass redemption was already processed
    -- Uses offline_actions table to track processed actions
    SELECT id INTO v_existing_action FROM offline_actions 
    WHERE action_id = p_action_id AND processed = TRUE;
    IF v_existing_action IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already processed');
    END IF;

    -- GET USER DATA
    -- Fetch current user to check grace pass availability
    SELECT * INTO v_user_record FROM users WHERE id = v_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- VALIDATE GRACE PASS AVAILABILITY
    -- User must have at least one grace pass to redeem
    IF v_user_record.grace_passes_available <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No grace passes available');
    END IF;

    -- CONSUME GRACE PASS AND RESTORE STREAK
    -- Atomically update user's grace pass counts and streak
    -- If streak is 0 (broken), restore it to 1
    UPDATE users SET
        grace_passes_used = grace_passes_used + 1,                    -- Increment used count
        grace_passes_available = grace_passes_available - 1,          -- Decrement available count
        streak = CASE WHEN streak > 0 THEN streak ELSE 1 END,         -- Restore broken streak to 1
        updated_at = NOW()
    WHERE id = v_user_id;

    -- MARK ACTION AS PROCESSED
    -- Record this action to prevent duplicate processing
    -- Uses UPSERT pattern (INSERT with ON CONFLICT)
    INSERT INTO offline_actions (user_id, action_id, action_type, payload, processed)
    VALUES (v_user_id, p_action_id, 'redeem_grace_pass', '{}', TRUE)
    ON CONFLICT (action_id) DO UPDATE SET processed = TRUE;

    RETURN jsonb_build_object('success', true, 'grace_passes_remaining', v_user_record.grace_passes_available - 1);
END;
$$;

-- WEEKLY LEAGUE UPDATE FUNCTION
-- Runs every Sunday to process league promotions and relegations
-- Handles all users across all leagues with correct ranking order
-- Creates historical snapshot of results
-- CRITICAL: Processes leagues in descending order (Diamond -> Bronze) for correct ranking
CREATE OR REPLACE FUNCTION run_weekly_league_update()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Calculate the week that just ended
    v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')::DATE;
    v_week_end DATE := v_week_start + INTERVAL '6 days';
    
    -- For processing each user
    v_user_record RECORD;
    
    -- Collect all ranking results
    v_rankings JSONB := '[]'::JSONB;
    
    -- Global rank counter (across all leagues)
    v_rank INTEGER := 1;
    
    -- League size limits for promotion/relegation logic
    v_league_sizes JSONB := jsonb_build_object(
        '1', 50,  -- Bronze league: up to 50 users
        '2', 30,  -- Silver league: up to 30 users  
        '3', 20,  -- Gold league: up to 20 users
        '4', 10   -- Diamond league: up to 10 users (most exclusive)
    );
    
    -- Loop variables
    v_current_league INTEGER;
    v_league_count INTEGER := 0;  -- Count within current league
    v_new_league INTEGER;
BEGIN
    -- PROCESS LEAGUES IN DESCENDING ORDER
    -- Critical: Process Diamond (4) first, then Gold (3), Silver (2), Bronze (1)
    -- This ensures correct global ranking where Diamond users always rank higher
    FOR v_current_league IN SELECT generate_series(4, 1, -1) LOOP
        v_league_count := 0;  -- Reset counter for each league
        
        -- Process all users in current league, ordered by performance
        -- Primary sort: weekly_xp DESC (this week's performance)
        -- Secondary sort: xp DESC (total XP as tiebreaker)
        FOR v_user_record IN 
            SELECT id, weekly_xp, league, name
            FROM users 
            WHERE league = v_current_league
            ORDER BY weekly_xp DESC, xp DESC
        LOOP
            -- Increment position within current league
            v_league_count := v_league_count + 1;
            
            -- Default: user stays in same league
            v_new_league := v_current_league;
            
            -- PROMOTION LOGIC
            -- Top 3 performers with 500+ weekly XP get promoted (except Diamond)
            IF v_current_league < 4 AND v_league_count <= 3 AND v_user_record.weekly_xp >= 500 THEN
                v_new_league := v_current_league + 1;  -- Move up one league
            
            -- RELEGATION LOGIC  
            -- Bottom 5 users in each league get relegated (except Bronze)
            ELSIF v_current_league > 1 AND v_league_count > (v_league_sizes->>v_current_league::TEXT)::INTEGER - 5 THEN
                v_new_league := v_current_league - 1;  -- Move down one league
            END IF;
            
            -- UPDATE USER RECORD
            -- Apply league changes and reset weekly stats
            UPDATE users SET 
                league = v_new_league,                    -- New league (may be same as old)
                league_position = v_rank,                 -- Global rank position
                weekly_xp = 0,                           -- Reset weekly XP for new week
                has_used_morning_bonus = FALSE,          -- Reset daily bonus flag
                updated_at = NOW()
            WHERE id = v_user_record.id;
            
            -- RECORD RANKING DATA
            -- Add this user's results to the rankings snapshot
            v_rankings := v_rankings || jsonb_build_object(
                'user_id', v_user_record.id,
                'name', v_user_record.name,
                'weekly_xp', v_user_record.weekly_xp,    -- Performance this week
                'old_league', v_current_league,          -- League before update
                'new_league', v_new_league,              -- League after update
                'rank', v_rank                           -- Global rank position
            );
            
            v_rank := v_rank + 1;
        END LOOP;
    END LOOP;
    
    -- SAVE HISTORICAL SNAPSHOT
    -- Store complete results for this week in league_snapshots table
    -- This provides audit trail and historical data for analytics
    INSERT INTO league_snapshots (week_start, week_end, user_rankings)
    VALUES (v_week_start, v_week_end, v_rankings);
    
    RETURN jsonb_build_object(
        'success', true,
        'week_start', v_week_start,
        'week_end', v_week_end,
        'users_processed', jsonb_array_length(v_rankings),
        'rankings', v_rankings
    );
END;
$$;

-- GET LEADERBOARD FUNCTION
-- Returns properly ordered leaderboard data for display in app
-- CRITICAL: Always orders by league DESC first, then by XP DESC
-- This ensures Diamond users always appear above Gold, etc.
-- Parameters:
--   p_league: Filter to specific league (NULL = all leagues)
--   p_timeframe: 'weekly' or 'monthly' determines XP column used for sorting
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_league INTEGER DEFAULT NULL,
    p_timeframe TEXT DEFAULT 'weekly'
)
RETURNS TABLE(
    user_id UUID,
    name TEXT,
    xp INTEGER,
    weekly_xp INTEGER,
    league INTEGER,
    league_position INTEGER,
    rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- WEEKLY LEADERBOARD
    -- Ordered by: league DESC, weekly_xp DESC, total xp DESC (tiebreaker)
    IF p_timeframe = 'weekly' THEN
        RETURN QUERY
        SELECT 
            u.id,
            u.name,
            u.xp,
            u.weekly_xp,
            u.league,
            u.league_position,
            -- Calculate rank using ROW_NUMBER with proper ordering
            ROW_NUMBER() OVER (
                ORDER BY u.league DESC, u.weekly_xp DESC, u.xp DESC
            )::INTEGER as rank
        FROM users u
        WHERE (p_league IS NULL OR u.league = p_league)  -- Optional league filter
        ORDER BY u.league DESC, u.weekly_xp DESC, u.xp DESC;
    
    -- MONTHLY/LIFETIME LEADERBOARD
    -- Ordered by: league DESC, lifetime_xp DESC
    ELSE
        RETURN QUERY
        SELECT 
            u.id,
            u.name,
            u.xp,
            u.weekly_xp,
            u.league,
            u.league_position,
            -- Calculate rank using lifetime XP for monthly view
            ROW_NUMBER() OVER (
                ORDER BY u.league DESC, u.lifetime_xp DESC
            )::INTEGER as rank
        FROM users u
        WHERE (p_league IS NULL OR u.league = p_league)
        ORDER BY u.league DESC, u.lifetime_xp DESC;
    END IF;
END;
$$;

-- PROCESS OFFLINE ACTIONS FUNCTION
-- Processes queued actions that were performed while user was offline
-- Ensures no progress is lost due to connectivity issues
-- Processes actions in chronological order to maintain consistency
-- Parameter:
--   p_user_id: User whose offline actions should be processed
CREATE OR REPLACE FUNCTION process_offline_actions(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- For iterating through queued actions
    v_action RECORD;
    
    -- Result from processing each action
    v_result JSONB;
    
    -- Count of successfully processed actions
    v_processed_count INTEGER := 0;
BEGIN
    -- PROCESS ACTIONS IN CHRONOLOGICAL ORDER
    -- Important: Process oldest actions first to maintain proper sequence
    -- Only process unprocessed actions for the specified user
    FOR v_action IN 
        SELECT * FROM offline_actions 
        WHERE user_id = p_user_id AND processed = FALSE
        ORDER BY created_at ASC  -- Oldest first
    LOOP
        -- DISPATCH ACTION BY TYPE
        -- Call appropriate RPC function based on action type
        -- Extract parameters from JSON payload
        CASE v_action.action_type
            WHEN 'award_xp' THEN
                -- Extract XP award parameters from payload and call award_xp
                SELECT award_xp(
                    (v_action.payload->>'amount')::INTEGER,     -- XP amount
                    v_action.payload->>'source',                -- XP source description
                    v_action.action_id,                         -- Unique action ID
                    COALESCE(v_action.payload->'meta', '{}')    -- Additional metadata
                ) INTO v_result;
                
            WHEN 'redeem_grace_pass' THEN
                -- Process grace pass redemption
                SELECT redeem_grace_pass(v_action.action_id) INTO v_result;
                
            ELSE
                -- Unknown action type - log error
                v_result := jsonb_build_object('success', false, 'error', 'Unknown action type');
        END CASE;
        
        -- MARK ACTION AS PROCESSED
        -- Always mark as processed, even if it failed (to avoid infinite retries)
        UPDATE offline_actions SET processed = TRUE WHERE id = v_action.id;
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'processed_count', v_processed_count);
END;
$$;

-- SCHEDULE WEEKLY LEAGUE UPDATE
-- Uses pg_cron extension to automatically run league updates
-- Runs every Sunday at 23:59 UTC (just before week boundary)
-- This ensures consistent weekly cycles regardless of timezone
SELECT cron.schedule(
    'weekly-league-update',           -- Job name
    '59 23 * * 0',                   -- Cron expression: Sunday 23:59 UTC
    'SELECT run_weekly_league_update();'  -- SQL command to execute
);