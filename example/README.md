# Cloudflare D1 + Better Auth Example

This example demonstrates the frontend UI and development setup for Better Auth with the `better-auth-workers-qb` adapter.

**Note:** This shows the UI and demonstrates how to import the adapter. The authentication would work when deployed to Cloudflare Pages with proper functions setup. For local development, use npm for dependency resolution.

## Features

- Better Auth frontend with email/password forms
- TypeScript path mapping to import the adapter
- Vite development server
- D1 database schema for Better Auth
- Demonstrates the adapter integration pattern

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
   
   **Important:** Use npm, not bun, to avoid native dependency issues.

2. **Start development server:**
   ```bash
   npm run dev
   ```

   The demo frontend will be available at `http://localhost:5173`

## Project Structure

```
example/
├── index.html                  # Demo frontend with auth forms
├── package.json               # Dependencies & scripts  
├── vite.config.ts             # Vite config with path mapping
├── tsconfig.json              # TypeScript config with path mapping
├── wrangler.jsonc             # Cloudflare D1 configuration
└── schema.sql                 # D1 database schema for Better Auth
```

## Path Mapping

The example imports the adapter using:

```typescript
import { workersQBAdapter } from "better-auth-workers-qb";
```

This is mapped to `../src` via:
- TypeScript path mapping in `tsconfig.json` 
- Vite aliases in `vite.config.ts`

This allows the example to use the actual source code without copying it.

## For Production Use

In a real Cloudflare Pages deployment, you would:

1. Create Cloudflare Functions in `functions/api/auth/[...auth].ts`
2. Use the adapter like this:

```typescript
import { betterAuth } from "better-auth";
import { workersQBAdapter } from "better-auth-workers-qb";

export async function onRequest(context) {
  const auth = betterAuth({
    database: workersQBAdapter({
      database: context.env.DB, // D1 database binding
      usePlural: false,
      debugLogs: true,
    }),
    emailAndPassword: { enabled: true },
  });

  return auth.handler(context.request);
}
```

3. Deploy with `wrangler pages deploy dist`

## Database Schema

The included `schema.sql` contains all the tables needed for Better Auth:
- `user` - User accounts
- `session` - User sessions  
- `account` - OAuth accounts
- `verification` - Email verification tokens

To set up the schema locally:
```bash
npm run db:local
```

## What This Demonstrates

- ✅ Complete Better Auth frontend UI
- ✅ TypeScript path mapping for clean imports
- ✅ D1 database schema setup
- ✅ Development workflow with Vite
- ✅ How the adapter would integrate in production