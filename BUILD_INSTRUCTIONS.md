# ScriptureLoop Production Build Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI**: `npm install -g @expo/cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Supabase Account**: [supabase.com](https://supabase.com)
5. **RevenueCat Account**: [revenuecat.com](https://revenuecat.com)
6. **Sentry Account**: [sentry.io](https://sentry.io)

## Setup Instructions

### 1. Environment Configuration

Create `.env` file in project root:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_api_key

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Expo
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

### 2. Supabase Setup

1. Create new Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Enable Row Level Security (RLS)
4. Configure authentication providers
5. Set up weekly cron job for league resets:

```sql
-- Add to Supabase SQL Editor
SELECT cron.schedule(
  'weekly-league-reset',
  '59 23 * * 0',  -- Every Sunday at 23:59 UTC
  'SELECT process_weekly_league_reset();'
);
```

### 3. RevenueCat Setup

1. Create RevenueCat project
2. Configure products in RevenueCat dashboard:

**iOS Products (App Store Connect):**
- `grace_pass_pack_5` - Grace Pass Pack (5) - $0.99
- `premium_boosters` - Premium Booster Pack - $2.99
- `premium_monthly` - Premium Monthly - $3.99/month
- `premium_yearly` - Premium Yearly - $39.99/year

**Android Products (Google Play Console):**
- Same product IDs with corresponding prices

**Entitlements:**
- `premium` - Premium Access
- `grace_passes` - Grace Passes
- `extra_boosters` - Extra Boosters

### 4. Sentry Setup

1. Create Sentry project
2. Copy DSN to environment variables
3. Configure source maps upload (optional)

### 5. App Store Configuration

Update `app.json` with your details:
- Replace `your-eas-project-id` with actual EAS project ID
- Update bundle identifiers
- Add privacy policy URL

## Build Commands

### Development Build
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Create development build
eas build --profile development --platform all
```

### Preview Build
```bash
# Create preview build for testing
eas build --profile preview --platform all
```

### Production Build
```bash
# Create production build
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

## Testing Checklist

### Pre-Production Testing

1. **Authentication Flow**
   - Sign up with email verification
   - Sign in with existing account
   - Password reset functionality
   - Sign out and session management

2. **Core Features**
   - Daily challenge completion
   - XP earning and level progression
   - Streak tracking and grace pass usage
   - League system and weekly resets

3. **Social Features**
   - Follow/unfollow users
   - Friend activity feed
   - Activity celebrations

4. **Monetization**
   - RevenueCat product loading
   - Purchase flows (sandbox)
   - Restore purchases
   - Entitlement checks

5. **Push Notifications**
   - Permission requests
   - Local scheduled notifications
   - Remote push notifications
   - Notification handling

6. **Offline Functionality**
   - Offline action queuing
   - Data sync when back online
   - Cached content access

### Device Testing

Test on:
- **iOS**: iPhone SE (low-end), iPhone 14 Pro (high-end)
- **Android**: Budget device (Android 8+), Flagship device

### Performance Testing

- App launch time < 3 seconds
- Smooth animations (60fps)
- Memory usage monitoring
- Network request optimization

## Deployment Steps

### 1. TestFlight (iOS)
```bash
# Build and submit to TestFlight
eas build --profile production --platform ios
eas submit --platform ios
```

### 2. Google Play Internal Testing
```bash
# Build and submit to Google Play
eas build --profile production --platform android
eas submit --platform android
```

### 3. Production Release

1. Complete beta testing with 10+ users
2. Address any critical issues
3. Submit for app store review
4. Monitor crash reports and analytics
5. Plan post-launch updates

## Monitoring and Analytics

### Sentry Integration
- Crash reporting enabled
- Performance monitoring
- User feedback collection

### Analytics Setup
Add Firebase Analytics or Amplitude:
```bash
# Firebase
expo install @react-native-firebase/app @react-native-firebase/analytics

# Amplitude
expo install @amplitude/analytics-react-native
```

### Key Metrics to Track
- Daily/Monthly Active Users
- Retention rates (Day 1, 7, 30)
- Purchase conversion rates
- Feature usage (challenges, social)
- Crash-free sessions

## Legal Requirements

### Privacy Policy
Create privacy policy covering:
- Data collection and usage
- Third-party services (Supabase, RevenueCat, Sentry)
- User rights and data deletion
- Contact information

### Terms of Service
Include terms for:
- User accounts and content
- In-app purchases and refunds
- Acceptable use policy
- Limitation of liability

### Bible API Attribution
Ensure compliance with Bible API license:
- Add attribution in app settings
- Verify redistribution rights
- Include required notices

## Support and Maintenance

### Post-Launch Checklist
- [ ] Monitor crash reports daily
- [ ] Track key metrics and KPIs
- [ ] Respond to user reviews
- [ ] Plan feature updates
- [ ] Monitor server costs and scaling
- [ ] Regular security updates

### Backup and Recovery
- Database backups (Supabase handles this)
- Code repository backups
- Environment variable documentation
- Disaster recovery procedures

## Troubleshooting

### Common Issues

**Build Failures:**
- Check environment variables
- Verify EAS project configuration
- Update dependencies

**Authentication Issues:**
- Verify Supabase configuration
- Check RLS policies
- Test email verification

**Purchase Issues:**
- Verify RevenueCat setup
- Test with sandbox accounts
- Check product configurations

**Push Notification Issues:**
- Verify APNs/FCM setup
- Test permission flows
- Check notification payload format