-- SCRIPTURELOOP LEAGUE PROMOTION TESTS
-- These tests validate the weekly league update system
-- Tests promotion/relegation logic and correct leaderboard ordering
--
-- HOW TO RUN:
-- 1. Copy and paste each test block into Supabase SQL Editor
-- 2. Execute each test individually
-- 3. Look for "Test X PASSED" messages
--
-- WHAT THESE TESTS VALIDATE:
-- - Top 3 users with 500+ weekly XP get promoted
-- - Bottom 5 users in each league get relegated
-- - Leaderboard orders correctly: Diamond > Gold > Silver > Bronze
-- - League snapshots are created with historical data
-- - Weekly XP resets after league update

-- TEST 1: BASIC LEAGUE PROMOTION LOGIC
-- Creates Bronze league users with different weekly XP
-- Validates that top performers get promoted to Silver
DO $$
DECLARE
    bronze_user_1 UUID := '10000000-0000-0000-0000-000000000001';
    bronze_user_2 UUID := '10000000-0000-0000-0000-000000000002';
    bronze_user_3 UUID := '10000000-0000-0000-0000-000000000003';
    bronze_user_4 UUID := '10000000-0000-0000-0000-000000000004';
    result JSONB;
BEGIN
    -- Create test users in Bronze league with different weekly XP
    INSERT INTO users (id, email, name, league, weekly_xp, xp) VALUES
    (bronze_user_1, 'bronze1@test.com', 'Bronze Top', 1, 800, 2000),      -- Should promote
    (bronze_user_2, 'bronze2@test.com', 'Bronze Second', 1, 600, 1500),   -- Should promote  
    (bronze_user_3, 'bronze3@test.com', 'Bronze Third', 1, 550, 1200),    -- Should promote
    (bronze_user_4, 'bronze4@test.com', 'Bronze Fourth', 1, 300, 800);    -- Should stay
    
    -- Run weekly league update
    SELECT run_weekly_league_update() INTO result;
    
    -- Check promotions
    ASSERT (SELECT league FROM users WHERE id = bronze_user_1) = 2, 'Top Bronze user should promote to Silver';
    ASSERT (SELECT league FROM users WHERE id = bronze_user_2) = 2, 'Second Bronze user should promote to Silver';
    ASSERT (SELECT league FROM users WHERE id = bronze_user_3) = 2, 'Third Bronze user should promote to Silver';
    ASSERT (SELECT league FROM users WHERE id = bronze_user_4) = 1, 'Fourth Bronze user should stay in Bronze';
    
    -- Check weekly XP reset
    ASSERT (SELECT weekly_xp FROM users WHERE id = bronze_user_1) = 0, 'Weekly XP should reset';
    
    RAISE NOTICE 'Test 1 PASSED: Basic League Promotion Logic';
    
    -- Cleanup
    DELETE FROM users WHERE id IN (bronze_user_1, bronze_user_2, bronze_user_3, bronze_user_4);
    DELETE FROM league_snapshots WHERE week_start >= CURRENT_DATE - INTERVAL '1 week';
END $$;

-- TEST 2: LEAGUE RELEGATION LOGIC
-- Creates full Silver league and validates that bottom users
-- get relegated back to Bronze league
DO $$
DECLARE
    silver_user_1 UUID := '20000000-0000-0000-0000-000000000001';
    silver_user_2 UUID := '20000000-0000-0000-0000-000000000002';
    i INTEGER;
    result JSONB;
BEGIN
    -- Create Silver league users (league size = 30, bottom 5 should relegate)
    INSERT INTO users (id, email, name, league, weekly_xp, xp) VALUES
    (silver_user_1, 'silver1@test.com', 'Silver Bottom', 2, 50, 1000),    -- Should relegate
    (silver_user_2, 'silver2@test.com', 'Silver Second Bottom', 2, 100, 1100); -- Should relegate
    
    -- Create 28 more Silver users with higher XP to fill the league
    FOR i IN 3..30 LOOP
        INSERT INTO users (id, email, name, league, weekly_xp, xp) VALUES
        (('20000000-0000-0000-0000-00000000' || LPAD(i::TEXT, 4, '0'))::UUID, 
         'silver' || i || '@test.com', 
         'Silver User ' || i, 
         2, 
         200 + i * 10,  -- Higher weekly XP
         1500 + i * 50);
    END LOOP;
    
    -- Run weekly league update
    SELECT run_weekly_league_update() INTO result;
    
    -- Check relegations (bottom users should be relegated)
    ASSERT (SELECT league FROM users WHERE id = silver_user_1) = 1, 'Bottom Silver user should relegate to Bronze';
    ASSERT (SELECT league FROM users WHERE id = silver_user_2) = 1, 'Second bottom Silver user should relegate to Bronze';
    
    RAISE NOTICE 'Test 2 PASSED: League Relegation Logic';
    
    -- Cleanup
    DELETE FROM users WHERE email LIKE 'silver%@test.com';
    DELETE FROM league_snapshots WHERE week_start >= CURRENT_DATE - INTERVAL '1 week';
END $$;

-- TEST 3: CORRECT LEAGUE ORDERING IN LEADERBOARD
-- Creates users in different leagues with varying XP
-- Validates that leaderboard always orders by league first
-- Diamond users should always rank higher than Gold, etc.
DO $$
DECLARE
    diamond_user UUID := '40000000-0000-0000-0000-000000000001';
    gold_user UUID := '30000000-0000-0000-0000-000000000001';
    silver_user UUID := '20000000-0000-0000-0000-000000000001';
    bronze_user UUID := '10000000-0000-0000-0000-000000000001';
    leaderboard_result RECORD;
    expected_order TEXT[] := ARRAY['Diamond User', 'Gold User', 'Silver User', 'Bronze User'];
    actual_order TEXT[];
    i INTEGER := 1;
BEGIN
    -- Create users in different leagues with varying XP
    INSERT INTO users (id, email, name, league, weekly_xp, xp) VALUES
    (diamond_user, 'diamond@test.com', 'Diamond User', 4, 200, 5000),  -- Lowest weekly XP but highest league
    (gold_user, 'gold@test.com', 'Gold User', 3, 400, 3000),
    (silver_user, 'silver@test.com', 'Silver User', 2, 600, 2000),
    (bronze_user, 'bronze@test.com', 'Bronze User', 1, 800, 1000);     -- Highest weekly XP but lowest league
    
    -- Get leaderboard and check ordering
    FOR leaderboard_result IN 
        SELECT * FROM get_leaderboard(NULL, 'weekly') ORDER BY rank
    LOOP
        actual_order[i] := leaderboard_result.name;
        i := i + 1;
    END LOOP;
    
    -- Check correct ordering: Diamond > Gold > Silver > Bronze (regardless of XP)
    ASSERT actual_order = expected_order, 
           'Leaderboard should order by league first: ' || array_to_string(actual_order, ', ');
    
    -- Test league-specific leaderboard
    ASSERT (SELECT COUNT(*) FROM get_leaderboard(2, 'weekly')) = 1, 
           'League-specific leaderboard should filter correctly';
    
    RAISE NOTICE 'Test 3 PASSED: Correct League Ordering in Leaderboard';
    
    -- Cleanup
    DELETE FROM users WHERE id IN (diamond_user, gold_user, silver_user, bronze_user);
END $$;

-- TEST 4: LEAGUE SNAPSHOT CREATION
-- Validates that weekly league updates create historical snapshots
-- These snapshots provide audit trail and analytics data
DO $$
DECLARE
    test_user UUID := '50000000-0000-0000-0000-000000000001';
    result JSONB;
    snapshot_count INTEGER;
BEGIN
    -- Create test user
    INSERT INTO users (id, email, name, league, weekly_xp) VALUES
    (test_user, 'snapshot@test.com', 'Snapshot User', 1, 500);
    
    -- Run weekly update
    SELECT run_weekly_league_update() INTO result;
    
    -- Check snapshot was created
    SELECT COUNT(*) INTO snapshot_count 
    FROM league_snapshots 
    WHERE week_start >= CURRENT_DATE - INTERVAL '1 week';
    
    ASSERT snapshot_count > 0, 'League snapshot should be created';
    
    -- Check snapshot contains user data
    ASSERT EXISTS (
        SELECT 1 FROM league_snapshots 
        WHERE user_rankings::TEXT LIKE '%' || test_user || '%'
    ), 'Snapshot should contain user rankings';
    
    RAISE NOTICE 'Test 4 PASSED: League Snapshot Creation';
    
    -- Cleanup
    DELETE FROM users WHERE id = test_user;
    DELETE FROM league_snapshots WHERE week_start >= CURRENT_DATE - INTERVAL '1 week';
END $$;

-- ALL LEAGUE TESTS COMPLETED
-- If you see this message, all league promotion tests passed
-- Your league system is working correctly
RAISE NOTICE 'All league promotion tests completed successfully!';

-- NEXT STEPS:
-- 1. Test the API endpoints manually (api_examples.http)
-- 2. Run the JavaScript unit tests (npm run test:unit)
-- 3. Deploy to production and test with real users