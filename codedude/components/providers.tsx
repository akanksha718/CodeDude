"use client"

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider, useTheme } from "./theme-provider"
import {dark} from "@clerk/themes";

function ClerkWithTheme({ children }: { children: React.ReactNode }) {
    const {theme} = useTheme();
    const isDark = theme==="dark" ||
     (theme === "system" && 
        (typeof window === "undefined" ||
            window.matchMedia("(prefers-color-scheme: dark)").matches
        )
     );
     return (
     <ClerkProvider appearance={{
        baseTheme : isDark ? dark : undefined
     }}>
        {children}
     </ClerkProvider>)
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <ThemeProvider defaultTheme="dark">
        <ClerkWithTheme>
        {children}
      </ClerkWithTheme>
      </ThemeProvider>
   
  )
}



/*
This file creates global providers for your Next.js app. It connects:

   Theme management (light/dark mode)
   Clerk authentication
   Makes Clerk automatically follow your app's theme.

ClerkProvider provides authentication features:

   Sign In
   Sign Up
   User management
   Session handling
to the entire application.

Why this check?
   typeof window === "undefined"
   In Next.js:
   Server has no window
   Browser has window
This prevents crashes.



 */
