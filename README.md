# Better Auth Workers QB Adapter

A database adapter for [Better Auth](https://www.better-auth.com/) that uses [Workers QB](https://workers-qb.massadas.com/) as the query builder, designed specifically for Cloudflare D1 and edge environments.

## Features

- Zero dependencies query building with Workers QB
- Full TypeScript support
- Compatible with Cloudflare D1
- Supports all Better Auth adapter operations
- Edge-optimized performance

## Installation

```bash
npm install better-auth-workers-qb
# or
yarn add better-auth-workers-qb
# or
bun add better-auth-workers-qb
```

## Usage

### With Cloudflare D1

```typescript
import { betterAuth } from "better-auth";
import { workersQBAdapter } from "better-auth-workers-qb";

// In your Cloudflare Worker
export default {
  async fetch(request: Request, env: Env) {
    const auth = betterAuth({
      database: workersQBAdapter({
        database: env.D1_DATABASE, // Your D1 database binding
        usePlural: false, // Optional: Use plural table names (default: false)
        debugLogs: true, // Optional: Enable debug logging (default: false)
      }),
      // ... other Better Auth config
    });

    return auth.handler(request);
  },
};
```

### With QueryBuilder Instance

You can also pass a pre-configured QueryBuilder instance:

```typescript
import { QueryBuilder } from "workers-qb";
import { workersQBAdapter } from "better-auth-workers-qb";

const qb = new QueryBuilder(env.D1_DATABASE);

const auth = betterAuth({
  database: workersQBAdapter({
    database: qb,
  }),
  // ... other Better Auth config
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database` | `D1Database \| QueryBuilder` | required | The D1 database binding or QueryBuilder instance |
| `usePlural` | `boolean` | `false` | Whether to use plural table names (e.g., "users" instead of "user") |
| `debugLogs` | `boolean \| object` | `false` | Enable debug logging for adapter operations |

### Debug Logs Configuration

```typescript
workersQBAdapter({
  database: env.D1_DATABASE,
  debugLogs: {
    logCondition: () => process.env.NODE_ENV === "development",
    create: true,
    update: true,
    updateMany: true,
    findOne: true,
    findMany: true,
    delete: true,
    deleteMany: true,
    count: true,
  },
});
```

## Supported Operations

The adapter implements all required Better Auth database operations:

- `create` - Insert new records
- `update` - Update a single record
- `updateMany` - Update multiple records
- `delete` - Delete a single record
- `deleteMany` - Delete multiple records
- `findOne` - Find a single record
- `findMany` - Find multiple records with pagination and sorting
- `count` - Count records matching criteria

## TypeScript Support

The adapter is fully typed and exports all necessary TypeScript interfaces:

```typescript
import type { 
  WorkersQBAdapterConfig,
  D1Database,
  D1PreparedStatement,
  D1Result,
} from "better-auth-workers-qb";
```

## Testing

Run tests with:

```bash
bun test
```

## Development

```bash
# Install dependencies
bun install

# Run type checking
bun run type-check

# Build the package
bun run build

# Run tests
bun test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Better Auth Documentation](https://www.better-auth.com/)
- [Workers QB Documentation](https://workers-qb.massadas.com/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)