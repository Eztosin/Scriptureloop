-- ScriptureLoop Production Database Schema
-- This file creates the complete database structure for the ScriptureLoop app
-- Run this in Supabase SQL Editor to set up all tables, indexes, and security policies

-- Enable required PostgreSQL extensions
-- uuid-ossp: Provides UUID generation functions for primary keys
-- pg_cron: Enables scheduled jobs (like weekly league updates)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- USERS TABLE
-- Central table storing all user profile data and game statistics
-- Each user has one record that tracks their progress, league, XP, etc.
CREATE TABLE users (
    -- Primary identifier - auto-generated UUID for each user
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication & Profile Info
    email TEXT UNIQUE NOT NULL,              -- User's email (must be unique)
    name TEXT NOT NULL,                      -- Display name
    avatar TEXT,                             -- Profile picture URL (optional)
    join_date TIMESTAMPTZ DEFAULT NOW(),     -- When user first registered
    favorite_bible_book TEXT,                -- User's preferred Bible book (optional)
    
    -- Experience Points & Leveling System
    xp INTEGER DEFAULT 0,                    -- Current total XP
    weekly_xp INTEGER DEFAULT 0,             -- XP earned this week (resets weekly)
    lifetime_xp INTEGER DEFAULT 0,           -- All-time XP earned
    level INTEGER DEFAULT 1,                 -- Current level (calculated from XP)
    
    -- Streak & Activity Tracking
    streak INTEGER DEFAULT 0,                -- Current daily streak count
    last_active_date DATE DEFAULT CURRENT_DATE, -- Last day user was active
    today_completed BOOLEAN DEFAULT FALSE,   -- Whether user completed today's challenge
    total_days_studied INTEGER DEFAULT 0,    -- Total days user has been active
    verses_memorized INTEGER DEFAULT 0,      -- Count of memorized verses
    
    -- Grace Pass System (for streak recovery)
    grace_passes_used INTEGER DEFAULT 0,     -- How many grace passes user has used
    grace_passes_available INTEGER DEFAULT 1, -- How many grace passes user has left
    
    -- In-Game Currency & League System
    gems INTEGER DEFAULT 50,                 -- Virtual currency for purchases
    league INTEGER DEFAULT 1,                -- League tier: 1=Bronze, 2=Silver, 3=Gold, 4=Diamond
    league_position INTEGER DEFAULT 0,       -- Position within current league
    
    -- Daily Bonus Tracking (prevents multiple bonuses per day)
    has_used_morning_bonus BOOLEAN DEFAULT FALSE, -- Morning bonus (6-9 AM UTC)
    has_streak_bonus BOOLEAN DEFAULT FALSE,  -- Special streak bonus flag
    
    -- User Preferences (stored as JSON)
    notification_settings JSONB DEFAULT '{"dailyReminder": true, "streakReminder": true, "weeklyXP": true, "friendActivity": true}',
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),    -- When record was created
    updated_at TIMESTAMPTZ DEFAULT NOW()     -- When record was last modified
);

-- XP LEDGER TABLE
-- Immutable log of all XP transactions for audit trail and idempotency
-- Every XP award creates one record here with unique action_id
CREATE TABLE xp_ledger (
    -- Primary key for this transaction record
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user earned this XP (foreign key to users table)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique identifier for this action (prevents duplicate XP awards)
    -- Format: "challenge_2024_001_uuid" or "flashcards_timestamp_uuid"
    action_id TEXT UNIQUE NOT NULL,
    
    -- How much XP was awarded (can be negative for penalties)
    amount INTEGER NOT NULL,
    
    -- What activity generated this XP (e.g., "Daily Challenge", "Memory Verses")
    source TEXT NOT NULL,
    
    -- Additional data about this transaction (JSON format)
    -- Example: {"score": 8, "total_questions": 10, "difficulty": "medium"}
    meta JSONB DEFAULT '{}',
    
    -- When this XP was awarded
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FOLLOWERS TABLE
-- Manages social connections between users (who follows whom)
-- Creates many-to-many relationship between users
CREATE TABLE followers (
    -- Primary key for this relationship
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User who is doing the following
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- User who is being followed
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- When this follow relationship was created
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate follow relationships (user can't follow same person twice)
    UNIQUE(follower_id, following_id)
);

-- ACTIVITIES TABLE
-- Social feed of user activities that friends can see
-- Powers the "Friends Feed" feature in the app
CREATE TABLE activities (
    -- Primary key for this activity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user performed this activity
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of activity (constrained to specific values)
    -- challenge_completed: User finished a daily challenge
    -- milestone_reached: User hit a streak or XP milestone
    -- league_promoted: User moved up a league
    -- booster_gifted: User sent a booster to someone
    type TEXT NOT NULL CHECK (type IN ('challenge_completed', 'milestone_reached', 'league_promoted', 'booster_gifted')),
    
    -- Human-readable description of the activity
    -- Example: "Completed Daily Reading and earned 75 XP"
    details TEXT NOT NULL,
    
    -- Additional structured data about this activity
    -- Example: {"xp_earned": 75, "source": "Daily Challenge"}
    meta JSONB DEFAULT '{}',
    
    -- Array of celebrations from friends (likes, comments, emojis)
    -- Example: [{"user_id": "uuid", "message": "Great job!", "emoji": "🎉"}]
    celebrations JSONB DEFAULT '[]',
    
    -- When this activity occurred
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOSTERS TABLE
-- Temporary XP multipliers that users can purchase or receive as gifts
-- Active boosters multiply XP earned for a limited time
CREATE TABLE boosters (
    -- Primary key for this booster
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user owns this booster
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Multiplier type: '2x' doubles XP, '3x' triples XP
    type TEXT NOT NULL CHECK (type IN ('2x', '3x')),
    
    -- When this booster expires (UTC timestamp)
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Whether this booster is currently active (can be manually deactivated)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- When this booster was created/purchased
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFLINE ACTIONS TABLE
-- Queue for actions performed while offline that need to be processed later
-- Ensures no progress is lost when user has poor connectivity
CREATE TABLE offline_actions (
    -- Primary key for this queued action
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user performed this action
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique identifier for this action (prevents duplicate processing)
    action_id TEXT UNIQUE NOT NULL,
    
    -- Type of action to process (e.g., 'award_xp', 'redeem_grace_pass')
    action_type TEXT NOT NULL,
    
    -- Data needed to process this action
    -- Example: {"amount": 50, "source": "Offline Challenge", "meta": {...}}
    payload JSONB NOT NULL,
    
    -- Whether this action has been processed yet
    processed BOOLEAN DEFAULT FALSE,
    
    -- When this action was queued
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PURCHASES TABLE
-- Log of all in-app purchases processed via RevenueCat webhooks
-- Provides audit trail and prevents duplicate entitlement grants
CREATE TABLE purchases (
    -- Primary key for this purchase record
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user made this purchase
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- RevenueCat's unique transaction ID (prevents duplicate processing)
    revenuecat_transaction_id TEXT UNIQUE NOT NULL,
    
    -- Product purchased (e.g., 'grace_pass_single', 'premium_content')
    product_id TEXT NOT NULL,
    
    -- Price paid in USD (converted from original currency)
    price_usd DECIMAL(10,2),
    
    -- Original currency of purchase
    currency TEXT DEFAULT 'USD',
    
    -- When the purchase was made (from RevenueCat)
    purchase_date TIMESTAMPTZ NOT NULL,
    
    -- Complete webhook payload from RevenueCat (for debugging)
    webhook_data JSONB NOT NULL,
    
    -- What entitlements were granted for this purchase
    -- Example: ["grace_pass", "premium_devotionals"]
    entitlements_granted JSONB DEFAULT '[]',
    
    -- When we processed this purchase
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAGUE SNAPSHOTS TABLE
-- Historical record of weekly league standings and promotions/relegations
-- Created automatically every Sunday by the weekly league update job
CREATE TABLE league_snapshots (
    -- Primary key for this snapshot
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Start date of the week this snapshot covers
    week_start DATE NOT NULL,
    
    -- End date of the week this snapshot covers
    week_end DATE NOT NULL,
    
    -- Complete rankings data for this week (JSON array)
    -- Each entry: {"user_id": "uuid", "name": "User Name", "weekly_xp": 850, 
    --             "old_league": 2, "new_league": 3, "rank": 15}
    user_rankings JSONB NOT NULL,
    
    -- When this snapshot was created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES
-- These indexes speed up common queries by creating sorted lookup tables

-- Speed up leaderboard queries (order by league DESC, weekly_xp DESC)
CREATE INDEX idx_users_league ON users(league, weekly_xp DESC);

-- Speed up user login/lookup by email
CREATE INDEX idx_users_email ON users(email);

-- Speed up XP history queries for a specific user
CREATE INDEX idx_xp_ledger_user_id ON xp_ledger(user_id);

-- Speed up idempotency checks (looking up existing action_id)
CREATE INDEX idx_xp_ledger_action_id ON xp_ledger(action_id);

-- Speed up "who am I following" queries
CREATE INDEX idx_followers_follower_id ON followers(follower_id);

-- Speed up "who follows me" queries
CREATE INDEX idx_followers_following_id ON followers(following_id);

-- Speed up activity feed queries (recent activities by user)
CREATE INDEX idx_activities_user_id ON activities(user_id, created_at DESC);

-- Speed up active booster lookups
CREATE INDEX idx_boosters_user_active ON boosters(user_id, is_active, expires_at);

-- Speed up offline action processing
CREATE INDEX idx_offline_actions_user_processed ON offline_actions(user_id, processed);

-- Speed up purchase history queries
CREATE INDEX idx_purchases_user_id ON purchases(user_id);

-- Speed up duplicate purchase prevention
CREATE INDEX idx_purchases_transaction_id ON purchases(revenuecat_transaction_id);

-- AUTOMATIC TIMESTAMP UPDATES
-- This trigger automatically updates the 'updated_at' column whenever a user record changes

-- Function that sets updated_at to current timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the updated_at field to current time
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger that calls the function before any UPDATE on users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) SETUP
-- RLS ensures users can only access their own data and data they're authorized to see
-- This is Supabase's primary security mechanism

-- Enable RLS on all tables (required for security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can only access their own profile data

-- Allow users to read their own profile (auth.uid() returns current user's ID)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile only
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- XP LEDGER POLICIES
-- Users can view their own XP transaction history but cannot modify it
-- (XP ledger is append-only via RPC functions)

-- Allow users to see their own XP transaction history
CREATE POLICY "Users can view own xp transactions" ON xp_ledger FOR SELECT USING (auth.uid() = user_id);

-- FOLLOWERS TABLE POLICIES
-- Users can manage their own follow relationships

-- Users can see relationships where they are either the follower or being followed
CREATE POLICY "Users can view followers" ON followers FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can only create follow relationships where they are the follower
CREATE POLICY "Users can create follow relationships" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete follow relationships where they are the follower (unfollow)
CREATE POLICY "Users can delete follow relationships" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- ACTIVITIES TABLE POLICIES
-- Users can see activities from people they follow, plus their own activities

-- Allow users to see activities from:
-- 1. People they follow (subquery checks followers table)
-- 2. Their own activities
CREATE POLICY "Users can view followed activities" ON activities FOR SELECT USING (
    user_id IN (SELECT following_id FROM followers WHERE follower_id = auth.uid())
    OR user_id = auth.uid()
);

-- BOOSTERS TABLE POLICIES
-- Users can only see their own boosters

-- Allow users to view their own active and expired boosters
CREATE POLICY "Users can view own boosters" ON boosters FOR SELECT USING (auth.uid() = user_id);

-- OFFLINE ACTIONS TABLE POLICIES
-- Users can manage their own queued offline actions

-- Allow users full access (SELECT, INSERT, UPDATE, DELETE) to their own offline actions
CREATE POLICY "Users can manage own offline actions" ON offline_actions FOR ALL USING (auth.uid() = user_id);

-- PURCHASES TABLE POLICIES
-- Users can view their own purchase history

-- Allow users to see their own purchase history (read-only)
-- Purchases are created by server-side webhook, not by users directly
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);