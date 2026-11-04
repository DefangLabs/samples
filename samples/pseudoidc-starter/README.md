# BetterAuth + Next.js Starter for ConsentKeys OIDC

A modern authentication starter kit built with [Next.js 15](https://nextjs.org) and [BetterAuth](https://better-auth.com), featuring email magic links and OIDC authentication with ConsentKeys.

## ✨ Features

- 🔐 **Dual Authentication**: Email magic links + OIDC (ConsentKeys)
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🗄️ **Database Ready**: PostgreSQL with Drizzle ORM
- 🔒 **Type Safe**: Full TypeScript support
- 📧 **Email Integration**: Nodemailer for magic link delivery
- 🚀 **Production Ready**: Optimized for deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- ConsentKeys OIDC provider account
- Email service (Gmail, SendGrid, etc.)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pseudoidc-starter
yarn install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your-database"

# BetterAuth
AUTH_SECRET="your-secret-key-here"

# Email Provider (Magic Links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# ConsentKeys OIDC Provider
CONSENTKEYS_CLIENT_ID=your-consentkeys-client-id
CONSENTKEYS_CLIENT_SECRET=your-consentkeys-client-secret
CONSENTKEYS_ISSUER_URL=https://your-consentkeys-issuer.com
CONSENTKEYS_USERINFO_URL=https://your-consentkeys-issuer.com/userinfo
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate database migrations
yarn db:generate

# Apply migrations to your database
yarn db:migrate

# (Optional) Open Drizzle Studio for database management
yarn db:studio
```

### 4. Configure OIDC Provider

In your ConsentKeys OIDC provider dashboard, add these callback URLs:

**Required Callback URLs:**

```
https://your-domain.com/api/auth/oauth2/callback/consentkeys-oidc
http://localhost:3000/api/auth/oauth2/callback/consentkeys-oidc
```

**Redirect URLs:**

```
https://your-domain.com/protected
https://your-domain.com/dashboard
http://localhost:3000/protected
http://localhost:3000/dashboard
```

### 5. Start Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
src/
├── app/
│   ├── api/auth/[...auth]/route.ts  # BetterAuth API routes
│   ├── login/page.tsx               # Login page
│   └── protected/page.tsx           # Protected route example
├── components/
│   └── forms/
│       └── login-form.tsx          # Reusable login component
├── lib/
│   ├── auth/
│   │   ├── auth.ts                 # BetterAuth configuration
│   │   └── authClient.ts           # Frontend auth client
│   └── db/
│       ├── schema.ts               # Database schema
│       └── index.ts                # Database connection
```

## 🔐 Authentication Flows

### Magic Link Authentication

1. User enters email on `/login`
2. Magic link sent to email
3. User clicks link → automatically signed in
4. Redirected to protected page

### OIDC Authentication

1. User clicks "Login with ConsentKeys"
2. Redirected to ConsentKeys OIDC provider
3. User authenticates with ConsentKeys
4. Redirected back → automatically signed in
5. Redirected to protected page

## 🗄️ Database Schema

The app uses 4 main tables:

- **`user`**: User account information
- **`session`**: User sessions and authentication state
- **`account`**: OAuth/OIDC account links
- **`verification`**: Email verification and magic links

See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed schema documentation.

## 🛠️ Available Scripts

```bash
# Development
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint

# Database
yarn db:generate  # Generate migrations
yarn db:migrate   # Apply migrations
yarn db:studio    # Open Drizzle Studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app works with any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Customization

### Adding New OAuth Providers

1. Add provider configuration in `src/lib/auth/auth.ts`
2. Update environment variables
3. Configure callback URLs in provider dashboard

### Styling

The app uses Tailwind CSS. Customize styles in:

- `src/app/globals.css`
- Component files

### Database

Modify the schema in `src/lib/db/schema.ts` and run:

```bash
yarn db:generate
yarn db:migrate
```

## 📚 Learn More

- [BetterAuth Documentation](https://better-auth.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed setup instructions
- Open an issue for bugs or feature requests
- Join our community discussions

---

Built with ❤️ using Next.js and BetterAuth

Title: PseudOIDC Starter

Short Description: A sample Next.js app using ConsentKeys for authentication.

Tags: Node.js, Postgres, OIDC, BetterAuth, Next.js, Drizzle, Tailwind

Languages: nodejs
