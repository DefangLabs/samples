import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { magicLink } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { toNextJsHandler } from "better-auth/next-js";
import { verification, user, session, account } from "@/lib/db/schema";
import { genericOAuth } from "better-auth/plugins";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user, verification, session, account
    },
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log('🔗 Magic link requested for:', email);
        console.log('🔗 Magic link URL:', url);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Your Magic Login Link",
          html: `<p>Click <a href="${url}">here</a> to log in.</p>`,
        });
        console.log('📧 Magic link email sent successfully');
      },
    }),
    genericOAuth({
      config: [
        {
          providerId: "consentkeys-oidc",
          clientId: process.env.CONSENTKEYS_CLIENT_ID!,
          clientSecret: process.env.CONSENTKEYS_CLIENT_SECRET!,
          discoveryUrl: process.env.CONSENTKEYS_ISSUER_URL!,
          authorizationUrlParams: {
            scope: "openid profile email",
            response_mode: "query",
            nonce: crypto.randomUUID(),
          },
          getUserInfo: async (tokens) => {
            console.log('🔐 OAuth2 tokens received:', JSON.stringify(tokens, null, 2));
            console.log('🔍 Fetching user info from:', process.env.CONSENTKEYS_USERINFO_URL);

            try {
              const user = await fetch(process.env.CONSENTKEYS_USERINFO_URL!, {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`
                }
              });

              if (!user.ok) {
                console.error('❌ User info fetch failed:', user.status, user.statusText);
                throw new Error(`Failed to fetch user info: ${user.status}`);
              }

              const userData = await user.json();
              console.log('👤 User data received:', JSON.stringify(userData, null, 2));

              const userInfo = {
                id: userData.sub,
                name: userData.name,
                email: userData.email,
                emailVerified: Boolean(userData.email_verified),
                image: userData.picture || null,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              console.log('✅ Processed user info:', JSON.stringify(userInfo, null, 2));
              return userInfo;
            } catch (error) {
              console.error('❌ Error in getUserInfo:', error);
              throw error;
            }
          },
        },
      ],
    })
  ],
  secret: process.env.AUTH_SECRET!,
  logger: {
    level: "debug",
  }
});

export const { POST, GET } = toNextJsHandler(auth);
