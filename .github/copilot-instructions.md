# NoFOMO - AI Coding Guidelines

## Project Overview
NoFOMO is a French crypto trading automation platform that protects profits through automated take-profit and stop-loss rules. Built with Next.js 16, React 19, TypeScript, and Supabase.

## Architecture
- **Frontend**: Next.js App Router with client components
- **Backend**: API routes in `app/api/` for cron jobs and surveillance
- **Database**: Supabase (auth, trading_rules, exchange_connections, notifications)
- **Exchanges**: CCXT library for Binance/Hyperliquid integration
- **Web3**: Wagmi + RainbowKit for wallet connections

## Key Patterns

### Authentication & Data
- Use `useUser()` hook from `@/lib/hooks/useUser` for auth state
- Initialize Supabase client from `@/lib/supabase`
- All user data queries filter by `user_id`
- API keys encrypted with CryptoJS AES before Supabase storage

### Trading Rules
- Rules stored in `trading_rules` table with types: take_profit, stop_loss, price_target
- Trigger types: percent_profit, percent_loss, price_above, price_below
- Cron job at `/api/cron/check-prices` executes trades via CCXT
- Surveillance endpoint `/api/surveillance` monitors without executing

### UI Components
- Shadcn/ui components from `@/components/ui` with CVA variants
- Cyan/blue gradient theme (`from-cyan-500 to-blue-500`)
- French language throughout user-facing text
- Glass morphism effects with `glass` class

### API Integration
- Price fetching with 1-minute cache in Map
- CCXT for exchange operations (balances, orders)
- Cron endpoints protected with `Bearer ${CRON_SECRET}` header
- Hyperliquid uses custom API, others via CoinGecko

### Development Workflow
- `npm run dev` uses Turbopack
- Environment variables: SUPABASE_URL, CRON_SECRET, ENCRYPTION_KEY
- API keys decrypted on-demand for trade execution
- Notifications created on rule execution

## Code Style
- French comments and error messages
- Async/await with try/catch blocks
- Price calculations: `((current - entry) / entry) * 100`
- Quantity rounding: `Math.floor(quantity * 1000000) / 1000000`

## Security
- API keys encrypted in database
- Cron endpoints require Bearer auth
- User isolation by `user_id` in all queries
- No secrets in client-side code

## Common Tasks
- Add new exchange: Extend CCXT integration in `lib/binance.ts`
- New rule type: Update cron logic and UI forms
- Price source: Add to `getCurrentPrice()` with platform mapping
- UI component: Use CVA variants in `components/ui.tsx`