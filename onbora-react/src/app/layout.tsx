import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import ThemeRegistry from "@/components/ThemeRegistry";
import { OnboraProvider } from "@/context/OnboraContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onbora — AI-Powered Onboarding",
  description:
    "AI agents that learn your company culture and guide new hires through personalized onboarding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <OnboraProvider>{children}</OnboraProvider>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
