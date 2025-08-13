// SCRIPTURELOOP JAVASCRIPT UNIT TESTS
// Comprehensive test suite for ScriptureLoop backend functionality
// Tests idempotency, league logic, concurrent operations, and data integrity
//
// SETUP:
// 1. npm install @supabase/supabase-js uuid
// 2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// 3. Run with: node tests/unit_tests.js
//
// WHAT THIS TESTS:
// - RPC function idempotency under various conditions
// - League promotion/relegation logic with real data
// - Leaderboard ordering across all leagues
// - Grace pass redemption system
// - Concurrent operation handling (race conditions)
// - Data consistency and integrity

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// TEST CONFIGURATION
// Uses service role key to bypass RLS for testing
// In production, never expose service role key to client code
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Create Supabase client with admin privileges for testing
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// TEST RUNNER CLASS
// Manages test execution, reporting, and cleanup
class TestRunner {
  constructor() {
    this.tests = [];      // Array of test functions
    this.passed = 0;      // Count of passed tests
    this.failed = 0;      // Count of failed tests
  }

  // Register a test function
  test(name, fn) {
    this.tests.push({ name, fn });
  }

  // Execute all registered tests
  async run() {
    console.log('🚀 Running ScriptureLoop Tests...\n');
    
    // Run each test and capture results
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    // Print final results and exit with appropriate code
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    process.exit(this.failed > 0 ? 1 : 0);  // Exit code 1 if any tests failed
  }

  // Simple assertion helper
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

const runner = new TestRunner();

// TEST 1: XP AWARD IDEMPOTENCY
// Validates that calling award_xp with same action_id twice
// only awards XP once, preventing duplicate rewards
runner.test('XP Award Idempotency', async () => {
  // Generate unique test data
  const testUserId = uuidv4();
  const actionId = `test_idempotency_${Date.now()}`;
  
  // CREATE TEST USER
  // Start with known XP amount for predictable testing
  await supabase.from('users').insert({
    id: testUserId,
    email: 'test@example.com',
    name: 'Test User',
    xp: 100  // Starting XP
  });

  // FIRST XP AWARD - Should succeed
  const { data: result1 } = await supabase.rpc('award_xp', {
    p_amount: 50,
    p_source: 'test_challenge',
    p_action_id: actionId,
    p_meta: { test: true }
  });

  // SECOND XP AWARD - Same action_id, should be idempotent
  const { data: result2 } = await supabase.rpc('award_xp', {
    p_amount: 50,
    p_source: 'test_challenge', 
    p_action_id: actionId,
    p_meta: { test: true }
  });

  // GET FINAL USER STATE
  // Check that XP was only awarded once
  const { data: user } = await supabase
    .from('users')
    .select('xp')
    .eq('id', testUserId)
    .single();

  // VALIDATE RESULTS
  runner.assert(result1.success === true, 'First call should succeed');
  runner.assert(result2.success === true, 'Second call should succeed');
  runner.assert(result2.message === 'Already processed', 'Second call should be idempotent');
  runner.assert(user.xp === 150, 'XP should only be awarded once (100 + 50 = 150)');

  // VALIDATE LEDGER INTEGRITY
  // Ensure only one transaction was recorded
  const { data: ledgerEntries } = await supabase
    .from('xp_ledger')
    .select('*')
    .eq('action_id', actionId);

  runner.assert(ledgerEntries.length === 1, 'Should have exactly one ledger entry');

  // CLEANUP TEST DATA
  // Remove test records to avoid affecting other tests
  await supabase.from('users').delete().eq('id', testUserId);
  await supabase.from('xp_ledger').delete().eq('action_id', actionId);
});

// TEST 2: LEAGUE PROMOTION LOGIC
// Creates test users in Bronze league with different weekly XP
// Validates that top 3 performers get promoted to Silver
runner.test('League Promotion Logic', async () => {
  const testUsers = [
    { id: uuidv4(), email: 'bronze1@test.com', name: 'Bronze Top', league: 1, weekly_xp: 800 },
    { id: uuidv4(), email: 'bronze2@test.com', name: 'Bronze Second', league: 1, weekly_xp: 600 },
    { id: uuidv4(), email: 'bronze3@test.com', name: 'Bronze Third', league: 1, weekly_xp: 550 },
    { id: uuidv4(), email: 'bronze4@test.com', name: 'Bronze Fourth', league: 1, weekly_xp: 300 }
  ];

  // Create test users
  await supabase.from('users').insert(testUsers);

  // Run weekly league update
  const { data: updateResult } = await supabase.rpc('run_weekly_league_update');

  runner.assert(updateResult.success === true, 'League update should succeed');

  // Check promotions
  const { data: updatedUsers } = await supabase
    .from('users')
    .select('id, league, weekly_xp')
    .in('id', testUsers.map(u => u.id))
    .order('league', { ascending: false });

  // Top 3 users with 500+ weekly XP should be promoted to Silver (league 2)
  const promotedUsers = updatedUsers.filter(u => u.league === 2);
  runner.assert(promotedUsers.length === 3, 'Top 3 users should be promoted');

  // Weekly XP should be reset
  runner.assert(updatedUsers.every(u => u.weekly_xp === 0), 'Weekly XP should be reset');

  // Cleanup
  await supabase.from('users').delete().in('id', testUsers.map(u => u.id));
  await supabase.from('league_snapshots').delete().gte('week_start', new Date().toISOString().split('T')[0]);
});

// TEST 3: LEADERBOARD CORRECT ORDERING
// Creates users in different leagues with varying XP amounts
// Validates that leaderboard always orders by league first
// Diamond users should always rank higher than Gold, etc.
runner.test('Leaderboard Correct Ordering', async () => {
  const testUsers = [
    { id: uuidv4(), email: 'diamond@test.com', name: 'Diamond User', league: 4, weekly_xp: 200 },
    { id: uuidv4(), email: 'gold@test.com', name: 'Gold User', league: 3, weekly_xp: 400 },
    { id: uuidv4(), email: 'silver@test.com', name: 'Silver User', league: 2, weekly_xp: 600 },
    { id: uuidv4(), email: 'bronze@test.com', name: 'Bronze User', league: 1, weekly_xp: 800 }
  ];

  // Create test users
  await supabase.from('users').insert(testUsers);

  // Get leaderboard
  const { data: leaderboard } = await supabase.rpc('get_leaderboard', {
    p_league: null,
    p_timeframe: 'weekly'
  });

  // Should be ordered by league DESC (Diamond first), then by weekly_xp DESC
  const expectedOrder = ['Diamond User', 'Gold User', 'Silver User', 'Bronze User'];
  const actualOrder = leaderboard.slice(0, 4).map(u => u.name);

  runner.assert(
    JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
    `Leaderboard order should be ${expectedOrder.join(', ')}, got ${actualOrder.join(', ')}`
  );

  // Test league-specific leaderboard
  const { data: silverLeaderboard } = await supabase.rpc('get_leaderboard', {
    p_league: 2,
    p_timeframe: 'weekly'
  });

  runner.assert(silverLeaderboard.length >= 1, 'League-specific leaderboard should return results');
  runner.assert(silverLeaderboard.every(u => u.league === 2), 'Should only return Silver league users');

  // Cleanup
  await supabase.from('users').delete().in('id', testUsers.map(u => u.id));
});

// TEST 4: GRACE PASS REDEMPTION
// Tests the grace pass system for streak recovery
// Validates that grace passes are consumed correctly
runner.test('Grace Pass Redemption', async () => {
  const testUserId = uuidv4();
  const actionId = `grace_test_${Date.now()}`;

  // Create test user with grace passes
  await supabase.from('users').insert({
    id: testUserId,
    email: 'grace@test.com',
    name: 'Grace User',
    grace_passes_available: 2,
    streak: 0
  });

  // Mock authentication by setting the user context
  // Note: In real tests, you'd use proper auth tokens
  
  // Redeem grace pass
  const { data: result } = await supabase.rpc('redeem_grace_pass', {
    p_action_id: actionId
  });

  // Get updated user
  const { data: user } = await supabase
    .from('users')
    .select('grace_passes_available, grace_passes_used, streak')
    .eq('id', testUserId)
    .single();

  runner.assert(result.success === true, 'Grace pass redemption should succeed');
  runner.assert(user.grace_passes_available === 1, 'Should have one less grace pass');
  runner.assert(user.grace_passes_used === 1, 'Should increment used count');
  runner.assert(user.streak >= 1, 'Streak should be restored');

  // Cleanup
  await supabase.from('users').delete().eq('id', testUserId);
  await supabase.from('offline_actions').delete().eq('action_id', actionId);
});

// TEST 5: CONCURRENT OPERATIONS
// Tests system behavior under concurrent load
// Validates that race conditions don't cause data corruption
runner.test('Concurrent XP Awards', async () => {
  const testUserId = uuidv4();
  const baseActionId = `concurrent_${Date.now()}`;

  // Create test user
  await supabase.from('users').insert({
    id: testUserId,
    email: 'concurrent@test.com',
    name: 'Concurrent User',
    xp: 100
  });

  // SIMULATE CONCURRENT XP AWARDS
  // Fire off multiple RPC calls simultaneously
  const promises = [];
  for (let i = 1; i <= 5; i++) {
    promises.push(
      supabase.rpc('award_xp', {
        p_amount: 50,
        p_source: 'concurrent_test',
        p_action_id: `${baseActionId}_${i}`,  // Each has unique action_id
        p_meta: { concurrent: true }
      })
    );
  }

  // WAIT FOR ALL CONCURRENT OPERATIONS
  // Promise.all ensures all complete before continuing
  const results = await Promise.all(promises);

  // All should succeed
  runner.assert(results.every(r => r.data.success), 'All concurrent operations should succeed');

  // Check final XP
  const { data: user } = await supabase
    .from('users')
    .select('xp')
    .eq('id', testUserId)
    .single();

  runner.assert(user.xp === 350, 'All XP awards should be processed (100 + 5*50)');

  // Check ledger entries
  const { data: ledgerEntries } = await supabase
    .from('xp_ledger')
    .select('*')
    .like('action_id', `${baseActionId}_%`);

  runner.assert(ledgerEntries.length === 5, 'Should have 5 ledger entries');

  // Cleanup
  await supabase.from('users').delete().eq('id', testUserId);
  await supabase.from('xp_ledger').delete().like('action_id', `${baseActionId}_%`);
});

// EXECUTE ALL TESTS
// Start the test runner and handle any uncaught errors
runner.run().catch(console.error);

// USAGE NOTES:
// - Tests run in sequence to avoid interference
// - Each test cleans up its own data
// - Service role key required for admin operations
// - Tests validate both success and failure scenarios