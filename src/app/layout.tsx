import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/app/components/Providers";
import TopBar from "@/app/components/TopBar";
import Sidebar from "@/app/components/Sidebar";
import BottomNav from "@/app/components/BottomNav";
import LiveReloader from "@/app/components/LiveReloader";
import Box from "@mui/material/Box";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ground Zero",
  description: "Next.js · NestJS · PostgreSQL · Prisma 7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et" className={geist.variable}>
      <body>
        <Providers>
          <LiveReloader />
          <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <TopBar />
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <Sidebar />
              <Box component="main" sx={{ flex: 1, minWidth: 0, pb: { xs: 7, md: 0 } }}>
                {children}
              </Box>
            </Box>
            <BottomNav />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
