import { createAuthClient } from "better-auth/react"
import { magicLinkClient } from "better-auth/client/plugins";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    secret: process.env.AUTH_SECRET,
    enableMagicLink: true,
    plugins: [
        magicLinkClient(),
        genericOAuthClient()
    ],
    pages: {
        signIn: "/login",
        error: "/error",
        verifyEmail: "/verify-email",
        magicLink: "/login",
    },

})

export const { signIn, signUp, signOut, useSession, getAccessToken } = authClient