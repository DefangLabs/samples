import { betterAuth } from "better-auth"

export const auth = betterAuth({
  // Basic configuration
})

export const { handler, api } = auth 