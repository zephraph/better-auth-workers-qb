# Cloudflare D1 + Better Auth Example

This example demonstrates how to use the `better-auth-workers-qb` adapter with Cloudflare D1 in a Vite-powered application.

**Note:** This is a local development example only. It uses npm for proper dependency resolution (bun may cause build issues).

## Features

- Better Auth authentication with email/password
- Cloudflare D1 database integration
- Vite development server
- TypeScript support
- Simple HTML frontend with authentication flow

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
   
   **Important:** Use npm, not bun, to avoid native dependency issues.

2. **Create the D1 database locally:**
   ```bash
   # Initialize the local database with schema
   npm run db:local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Database Setup

### Local Development

The local database will be automatically created when you run the dev server. To manually set up the schema:

```bash
npm run db:local
```

This example is designed for local development only.

## Project Structure

```
example/
├── functions/
│   └── api/
│       └── auth/
│           └── [...auth].ts    # Better Auth API routes
├── index.html                  # Simple frontend
├── package.json
├── vite.config.ts             # Vite configuration (with path mapping)
├── tsconfig.json              # TypeScript config (with path mapping)
├── wrangler.jsonc             # Cloudflare configuration
└── schema.sql                 # D1 database schema
```

**Note:** The example imports the adapter from `better-auth-workers-qb` which is mapped to `../src` via TypeScript path mapping in `tsconfig.json` and Vite aliases in `vite.config.ts`. This allows the example to use the actual source code without copying it.

## How It Works

1. **Authentication API**: The `functions/api/auth/[...auth].ts` file handles all Better Auth routes using the `better-auth-workers-qb` adapter.

2. **Database**: Cloudflare D1 provides the SQLite database, accessed through the workers-qb query builder.

3. **Frontend**: A simple HTML page demonstrates the authentication flow with sign up, sign in, and sign out functionality.

4. **Development**: The Vite dev server provides local development. The auth API routes are served from the functions directory.

## API Endpoints

All Better Auth endpoints are available under `/api/auth/`:

- `POST /api/auth/sign-up/email` - Sign up with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- And more...

## Configuration

The Better Auth configuration in `functions/api/auth/[...auth].ts` includes:

- Email/password authentication
- Session management (7-day expiry, 1-day update age)
- Debug logging enabled
- Workers QB adapter with D1 database

## Troubleshooting

- **Database errors**: Make sure you've run the schema migration with `npm run db:local`
- **Import errors**: Ensure all dependencies are installed with `npm install`
- **CORS issues**: The Cloudflare Functions plugin should handle CORS automatically in development