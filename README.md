# Gamified Todo API

NestJS 11, PostgreSQL, Prisma, and TypeScript. Implemented endpoints cover authentication, current user, and server status. Todo, XP, progress, and daily activity currently have database models; their application workflows are still to be built.

## Development

Use Node.js 24 and pnpm 11.25.0.

```sh
pnpm install
# Copy .env.example to .env and set your own JWT secrets.
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm start:dev
```

Routes start with `/api/v1`; documentation is at `/docs` and the schema is at `/docs/openapi.json`. Production starts with `pnpm build` followed by `pnpm start:prod`.

JWT TTLs are positive integers measured in **seconds**: access defaults to `900`, refresh to `604800` (seven days). Replace the previous milliseconds value `604800000` with `604800` in deployed environment settings.

## Authentication

Registration returns 201 with public user fields. Login and refresh rotation return 200 with an access/refresh token pair. Tokens use separate secrets, a required token type, and validated identity/expiry claims.

Use `Authorization: Bearer <accessToken>` for `/api/v1/user/me`. Both token types require an active database session. Refresh rotation validates the stored token hash, atomically consumes the old session, and creates its replacement. Concurrent refresh calls allow only one success. Clients should coordinate refresh requests and replace both tokens together. Rotation also invalidates the old access token.

Previously issued tokens lack the required token type and return 401 after this update; users must log in again. Session IDs are opaque UUIDs; user IDs retain their database CUID format.

Public user responses contain only `id`, `displayName`, `email`, and `timezone`. Successes use `{ success: true, data, timestamp, path }`; errors use `{ success: false, statusCode, code, message, timestamp, path }` with optional `details`.

## API contracts and typed client

```sh
pnpm api:generate  # build, export OpenAPI offline, and regenerate TypeScript
pnpm api:check     # fail if checked-in schema or generated types are stale
pnpm check        # lint, typecheck, unit tests, HTTP tests, and contract drift
```

```ts
import { createApiClient } from './api/client';

const api = createApiClient('http://localhost:3000');

const { data, error } = await api.POST('/api/v1/auth/login', {
  body: { email: 'example@email.com', password: 'Password@123' },
});

if (data) console.log(data.data.accessToken);
if (error) console.log(error.code);
```

TypeScript does not validate untrusted JSON at runtime. Requests use the global ValidationPipe, JWT claims use Zod, and public database reads use explicit field selections. HTTP tests verify response envelopes and exact public user fields.

## Tests

```sh
pnpm test --runInBand
pnpm test:e2e --runInBand
pnpm test:integration
```

Unit and HTTP tests need no infrastructure. Integration tests require `TEST_DATABASE_URL` pointing to a **dedicated, migrated test database**. They insert uniquely named users and clean up only those users. Coverage includes token misuse, session expiration/revocation/hash checks, concurrent registration, concurrent refresh, and transaction rollback.

Provision a separate PostgreSQL database and set `DATABASE_URL` to its URL before running `pnpm db:deploy`. Set `TEST_DATABASE_URL` to the same URL before running `pnpm test:integration`.

CI provisions its own PostgreSQL database and runs all checks and integration tests.
