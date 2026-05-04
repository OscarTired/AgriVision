import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : "https://agri-vision-lac.vercel.app"
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession
} = authClient