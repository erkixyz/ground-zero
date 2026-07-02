import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/app/components/Providers";
import TopBar from "@/app/components/TopBar";
import Sidebar from "@/app/components/Sidebar";
import BottomNav from "@/app/components/BottomNav";
import Footer from "@/app/components/Footer";
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
          <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
            <TopBar />
            <Box sx={{ display: "flex", flex: 1 }}>
              <Sidebar />
              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
                  {children}
                </Box>
                <Footer />
              </Box>
            </Box>
            <BottomNav />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
