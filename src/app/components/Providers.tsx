"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/app/theme";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";
import { LanguageProvider } from "@/context/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
