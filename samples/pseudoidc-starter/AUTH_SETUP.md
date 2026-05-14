# BetterAuth Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Email Provider (Magic Link)
```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### ConsentKeys OIDC Provider
```
CONSENTKEYS_CLIENT_ID=your-consentkeys-client-id
CONSENTKEYS_CLIENT_SECRET=your-consentkeys-client-secret
CONSENTKEYS_ISSUER_URL=https://your-consentkeys-issuer.com
CONSENTKEYS_USERINFO_URL=https://your-consentkeys-issuer.com/userinfo
```

### Database
```
DATABASE_URL=postgresql://username:password@localhost:5432/your-database
```

### BetterAuth Secret
```
AUTH_SECRET=your-secret-key-here
```

Generate a secret key with: `openssl rand -base64 32`

## Database Schema

BetterAuth uses a specific database schema that must be followed exactly. Here's how each table works:

### User Table
```sql
CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

**Purpose**: Stores user account information
- `id`: Unique user identifier (usually from OIDC provider)
- `email_verified`: Boolean indicating if email is verified
- `image`: User profile picture URL
- Timestamps track account creation and updates

### Session Table
```sql
CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
```

**Purpose**: Manages user sessions and authentication state
- `token`: Unique session token for authentication
- `expires_at`: When the session expires
- `ip_address` & `user_agent`: Security tracking
- Automatically cleaned up when user is deleted

### Account Table
```sql
CREATE TABLE "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
```

**Purpose**: Links OAuth/OIDC accounts to users
- `account_id`: Provider's account identifier
- `provider_id`: Which OAuth provider (e.g., "consentkeys-oidc")
- `access_token`, `refresh_token`: OAuth tokens for API access
- `scope`: OAuth scopes granted

### Verification Table
```sql
CREATE TABLE "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
```

**Purpose**: Handles email verification and magic links
- `identifier`: Usually the email address
- `value`: Verification token or magic link token
- `expires_at`: When the verification expires

## Callback URLs Configuration

### For ConsentKeys OIDC Provider

You need to configure these callback URLs in your ConsentKeys OIDC provider dashboard:

#### Required Callback URLs:
```
https://your-domain.com/api/auth/oauth2/callback/consentkeys-oidc
http://localhost:3000/api/auth/oauth2/callback/consentkeys-oidc
```

#### Redirect URLs (where users go after login):
```
https://your-domain.com/protected
https://your-domain.com/dashboard
http://localhost:3000/protected
http://localhost:3000/dashboard
```

### How Redirects Work

1. **Login Flow**:
   - User clicks "Login with ConsentKeys" → `/api/auth/oauth2/consentkeys-oidc`
   - Redirected to ConsentKeys OIDC provider
   - User authenticates with ConsentKeys
   - Redirected back to → `/api/auth/oauth2/callback/consentkeys-oidc`
   - BetterAuth processes the callback and creates/updates user
   - User is redirected to the `callbackUrl` (e.g., `/protected`)

2. **Magic Link Flow**:
   - User enters email → `/api/auth/email`
   - Magic link sent to email
   - User clicks link → `/api/auth/verify-email`
   - User is redirected to the `callbackUrl`

## Current Setup

✅ BetterAuth is configured with:
- Email magic link provider with nodemailer
- ConsentKeys OIDC provider
- Drizzle ORM with PostgreSQL
- Custom sign-in page route (`/login`)
- API routes at `/api/auth/[...auth]`

## Features

- **Magic Link Authentication**: Users receive email links to sign in
- **OIDC Authentication**: Integration with ConsentKeys OIDC provider
- **Database Storage**: User sessions and accounts stored in PostgreSQL
- **Debug Logging**: Detailed logging for troubleshooting
- **Session Management**: Automatic session creation and cleanup
- **Token Management**: OAuth token storage and refresh handling

## API Endpoints

### Authentication Routes
- `POST /api/auth/email` - Send magic link
- `GET /api/auth/verify-email` - Verify magic link
- `GET /api/auth/oauth2/consentkeys-oidc` - Start OIDC flow
- `GET /api/auth/oauth2/callback/consentkeys-oidc` - OIDC callback
- `POST /api/auth/signout` - Sign out user

### Session Management
- `GET /api/auth/session` - Get current session
- `POST /api/auth/session` - Update session

## Next Steps

1. ✅ Set up your environment variables
2. ✅ Create a PostgreSQL database and update DATABASE_URL
3. ✅ Configure your ConsentKeys OIDC provider with callback URLs
4. ✅ Set up your email server for magic links
5. ✅ Create a sign-in page at `/login`
6. ✅ Add authentication UI components

## Usage Examples

### Frontend Authentication
```typescript
// Magic link login
const result = await fetch('/api/auth/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// OIDC login
window.location.href = '/api/auth/oauth2/consentkeys-oidc?callbackUrl=/dashboard';

// Sign out
await fetch('/api/auth/signout', { method: 'POST' });
```

### Server-side Session Check
```typescript
import { auth } from '@/lib/auth/auth';

const session = await auth.api.getSession({
  headers: await headers(),
});

if (session) {
  // User is authenticated
  console.log('User:', session.user);
}
```

## Troubleshooting

### Common Issues:
1. **"toISOString is not a function"**: Ensure all timestamp fields have proper defaults
2. **"Callback URL mismatch"**: Verify callback URLs in OIDC provider settings
3. **"Database connection failed"**: Check DATABASE_URL and PostgreSQL connection
4. **"Magic link not sent"**: Verify email server configuration

### Debug Mode
BetterAuth is configured with debug logging. Check your server logs for detailed information about authentication flows.

The authentication system is now ready to use with both email magic links and ConsentKeys OIDC! 