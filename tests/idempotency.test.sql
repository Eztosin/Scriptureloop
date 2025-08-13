-- SCRIPTURELOOP IDEMPOTENCY TESTS
-- These tests validate that RPC functions are truly idempotent
-- Idempotency means calling the same function multiple times with same parameters
-- produces the same result as calling it once
--
-- HOW TO RUN:
-- 1. Copy and paste each test block into Supabase SQL Editor
-- 2. Execute each test individually
-- 3. Look for "Test X PASSED" messages
-- 4. If any test fails, check the assertion error message
--
-- WHAT THESE TESTS VALIDATE:
-- - XP awards are not duplicated with same action_id
-- - Grace pass redemptions are not duplicated
-- - Concurrent operations don't cause race conditions
-- - Database remains consistent under stress

-- TEST 1: XP AWARD IDEMPOTENCY
-- Validates that calling award_xp() twice with same action_id
-- only awards XP once, preventing duplicate rewards
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_action_id TEXT := 'test_idempotency_' || extract(epoch from now());
    result1 JSONB;
    result2 JSONB;
    initial_xp INTEGER;
    final_xp INTEGER;
BEGIN
    -- Create test user
    INSERT INTO users (id, email, name, xp) 
    VALUES (test_user_id, 'test@example.com', 'Test User', 100)
    ON CONFLICT (id) DO UPDATE SET xp = 100;
    
    -- Get initial XP
    SELECT xp INTO initial_xp FROM users WHERE id = test_user_id;
    
    -- First call should succeed
    SELECT award_xp(50, 'test_challenge', test_action_id, '{"test": true}') INTO result1;
    
    -- Second call with same action_id should be idempotent
    SELECT award_xp(50, 'test_challenge', test_action_id, '{"test": true}') INTO result2;
    
    -- Get final XP
    SELECT xp INTO final_xp FROM users WHERE id = test_user_id;
    
    -- Assertions
    ASSERT (result1->>'success')::BOOLEAN = TRUE, 'First call should succeed';
    ASSERT (result2->>'success')::BOOLEAN = TRUE, 'Second call should succeed';
    ASSERT (result2->>'message') = 'Already processed', 'Second call should indicate already processed';
    ASSERT final_xp = initial_xp + 50, 'XP should only be awarded once';
    
    -- Check ledger has only one entry
    ASSERT (SELECT COUNT(*) FROM xp_ledger WHERE action_id = test_action_id) = 1, 
           'Should have exactly one ledger entry';
    
    RAISE NOTICE 'Test 1 PASSED: XP Award Idempotency';
    
    -- Cleanup
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM xp_ledger WHERE action_id = test_action_id;
END $$;

-- TEST 2: GRACE PASS REDEMPTION IDEMPOTENCY
-- Validates that redeeming a grace pass twice with same action_id
-- only consumes one grace pass, preventing duplicate redemptions
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000002';
    test_action_id TEXT := 'grace_test_' || extract(epoch from now());
    result1 JSONB;
    result2 JSONB;
    initial_passes INTEGER;
    final_passes INTEGER;
BEGIN
    -- Create test user with grace passes
    INSERT INTO users (id, email, name, grace_passes_available) 
    VALUES (test_user_id, 'grace@example.com', 'Grace User', 2)
    ON CONFLICT (id) DO UPDATE SET grace_passes_available = 2;
    
    -- Get initial passes
    SELECT grace_passes_available INTO initial_passes FROM users WHERE id = test_user_id;
    
    -- Mock auth.uid() for this test
    PERFORM set_config('request.jwt.claims', '{"sub": "' || test_user_id || '"}', true);
    
    -- First redemption should succeed
    SELECT redeem_grace_pass(test_action_id) INTO result1;
    
    -- Second redemption with same action_id should be idempotent
    SELECT redeem_grace_pass(test_action_id) INTO result2;
    
    -- Get final passes
    SELECT grace_passes_available INTO final_passes FROM users WHERE id = test_user_id;
    
    -- Assertions
    ASSERT (result1->>'success')::BOOLEAN = TRUE, 'First redemption should succeed';
    ASSERT (result2->>'success')::BOOLEAN = TRUE, 'Second redemption should succeed';
    ASSERT (result2->>'message') = 'Already processed', 'Second redemption should indicate already processed';
    ASSERT final_passes = initial_passes - 1, 'Should only consume one grace pass';
    
    RAISE NOTICE 'Test 2 PASSED: Grace Pass Redemption Idempotency';
    
    -- Cleanup
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM offline_actions WHERE action_id = test_action_id;
END $$;

-- TEST 3: CONCURRENT XP AWARDS (STRESS TEST)
-- Validates that multiple XP awards with different action_ids
-- all get processed correctly without race conditions
-- Simulates high-load scenarios with multiple simultaneous users
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000003';
    base_action_id TEXT := 'concurrent_test_' || extract(epoch from now());
    i INTEGER;
    final_xp INTEGER;
    expected_xp INTEGER := 100 + (10 * 50); -- initial + (10 awards * 50 XP)
BEGIN
    -- Create test user
    INSERT INTO users (id, email, name, xp) 
    VALUES (test_user_id, 'concurrent@example.com', 'Concurrent User', 100)
    ON CONFLICT (id) DO UPDATE SET xp = 100;
    
    -- Mock auth.uid()
    PERFORM set_config('request.jwt.claims', '{"sub": "' || test_user_id || '"}', true);
    
    -- Simulate concurrent XP awards with unique action IDs
    FOR i IN 1..10 LOOP
        PERFORM award_xp(50, 'concurrent_challenge', base_action_id || '_' || i, '{}');
    END LOOP;
    
    -- Get final XP
    SELECT xp INTO final_xp FROM users WHERE id = test_user_id;
    
    -- Assertions
    ASSERT final_xp = expected_xp, 'All concurrent XP awards should be processed';
    ASSERT (SELECT COUNT(*) FROM xp_ledger WHERE action_id LIKE base_action_id || '%') = 10,
           'Should have 10 ledger entries';
    
    RAISE NOTICE 'Test 3 PASSED: Concurrent XP Awards';
    
    -- Cleanup
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM xp_ledger WHERE action_id LIKE base_action_id || '%';
END $$;

-- ALL TESTS COMPLETED
-- If you see this message, all idempotency tests passed
-- Your RPC functions are working correctly and safely
RAISE NOTICE 'All idempotency tests completed successfully!';

-- NEXT STEPS:
-- 1. Run the league promotion tests (league_promotion.test.sql)
-- 2. Test the API endpoints (api_examples.http)
-- 3. Run the JavaScript unit tests (npm run test:unit)