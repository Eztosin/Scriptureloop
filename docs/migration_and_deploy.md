# ScriptureLoop Production Migration & Deployment Guide

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **RevenueCat Account**: Set up at [revenuecat.com](https://revenuecat.com)
3. **Environment Variables**: Copy `.env.example` to `.env` and fill in values

## Step 1: Database Setup

### 1.1 Import Schema
```bash
# In Supabase SQL Editor, run:
# 1. Copy contents of sql/schema.sql and execute
# 2. Copy contents of sql/functions.sql and execute
```

### 1.2 Enable Extensions
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
```

### 1.3 Verify Tables
Check that all tables are created:
- users
- xp_ledger  
- followers
- activities
- boosters
- offline_actions
- purchases
- league_snapshots

## Step 2: Row Level Security (RLS)

RLS is automatically enabled by the schema. Verify policies are active:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## Step 3: Environment Variables

### 3.1 Client Environment (.env)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_key
```

### 3.2 Supabase Edge Functions Environment
In Supabase Dashboard > Edge Functions > Settings:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
```

## Step 4: Deploy Edge Functions

### 4.1 Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 4.2 Link Project
```bash
supabase link --project-ref your-project-ref
```

### 4.3 Deploy Functions
```bash
supabase functions deploy revenuecat-webhook
supabase functions deploy weekly-league-update
```

## Step 5: Schedule Weekly League Updates

### Option A: Using pg_cron (Recommended)
The schema already includes the cron job. Verify it's active:

```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-league-update';
```

### Option B: External Scheduler
Set up a weekly HTTP call to your Edge Function:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/weekly-league-update \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Step 6: RevenueCat Integration

### 6.1 Configure Webhook
In RevenueCat Dashboard:
1. Go to Project Settings > Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
3. Select events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION

### 6.2 Configure Products
Create products in RevenueCat:
- `grace_pass_single` - $0.99
- `premium_content` - $2.99  
- `support_mission_small` - $1.99
- `support_mission_medium` - $4.99
- `support_mission_large` - $9.99
- `ad_free_monthly` - $3.99/month

## Step 7: Update Client Code

### 7.1 Replace UserService
```typescript
// Replace imports in your components
import { supabaseUserService } from '../services/supabaseUserService';

// Instead of:
// import { userService } from '../services/userService';
```

### 7.2 Update Authentication
Ensure Supabase auth is properly configured in your app entry point.

## Step 8: Testing

### 8.1 Test Database Functions
```sql
-- Test award_xp function
SELECT award_xp(100, 'test_challenge', 'test_action_123', '{"test": true}');

-- Test idempotency
SELECT award_xp(100, 'test_challenge', 'test_action_123', '{"test": true}');
```

### 8.2 Test Edge Functions
```bash
# Test weekly league update
curl -X POST https://your-project.supabase.co/functions/v1/weekly-league-update \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test RevenueCat webhook (use RevenueCat's test events)
```

### 8.3 Test RevenueCat Sandbox
1. Configure sandbox environment in RevenueCat
2. Use test Apple/Google accounts
3. Verify purchases appear in `purchases` table
4. Verify entitlements are granted

## Step 9: Security Checklist

### 9.1 Service Role Key Security
- ✅ Service role key only in Edge Functions environment
- ✅ Never expose service role key in client code
- ✅ Use anon key for client-side operations

### 9.2 RLS Verification
```sql
-- Test RLS as different users
SET request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM users; -- Should only return current user
```

### 9.3 Function Security
- ✅ All RPC functions use `SECURITY DEFINER`
- ✅ Input validation in all functions
- ✅ Idempotency checks implemented

## Step 10: Monitoring & Maintenance

### 10.1 Set up Monitoring
- Enable Supabase logging
- Monitor Edge Function logs
- Set up alerts for failed webhook calls

### 10.2 Weekly Maintenance
- Check league update execution
- Monitor purchase webhook success rate
- Review XP ledger for anomalies

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**
   - Check user authentication
   - Verify RLS policies match your auth setup

2. **Edge Function Timeouts**
   - Check function logs in Supabase Dashboard
   - Verify environment variables are set

3. **RevenueCat Webhook Failures**
   - Check webhook signature validation
   - Verify user mapping between RevenueCat and Supabase

4. **League Update Not Running**
   - Check pg_cron extension is enabled
   - Verify cron job is scheduled correctly

### Support
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- RevenueCat: [docs.revenuecat.com](https://docs.revenuecat.com)
- ScriptureLoop Issues: Create GitHub issue with logs