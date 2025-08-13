# ScriptureLoop

A Duolingo-inspired mobile app that gamifies daily Bible reading and study to help Christians maintain consistent spiritual growth.

## Features

- **Daily Bible Challenges** with interactive questions
- **Streak System** with grace pass recovery
- **XP & Leveling** with morning bonuses and boosters
- **League Competition** (Bronze → Silver → Gold → Diamond)
- **Memory Verses** flashcard system
- **Social Features** - follow friends and share achievements
- **In-App Purchases** via RevenueCat integration

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Payments**: RevenueCat
- **Navigation**: Expo Router

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Scriptureloop
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your Supabase and RevenueCat keys
   ```

3. **Database Setup**
   - Create Supabase project
   - Run `sql/schema.sql` in SQL Editor
   - Run `sql/functions.sql` in SQL Editor

4. **Start Development**
   ```bash
   npm run dev
   ```

## Production Deployment

See [Migration & Deploy Guide](docs/migration_and_deploy.md) for complete setup instructions.

## Testing

```bash
npm run test:unit        # JavaScript tests
npm run test:sql         # SQL tests (run in Supabase)
npm run test:api         # API tests (REST Client)
```

## Architecture

- **Client**: React Native app with offline support
- **Database**: PostgreSQL with Row Level Security
- **API**: Supabase RPC functions for game logic
- **Payments**: RevenueCat webhooks for purchase processing
- **Scheduling**: pg_cron for weekly league updates

## Security

- All game logic runs server-side via RPC functions
- Row Level Security prevents data access violations
- Idempotent operations prevent duplicate rewards
- Service role key isolated to server environments only

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the list of contributors.

## Support

For issues and questions, please create a GitHub issue or contact the maintainers.