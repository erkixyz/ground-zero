"use client";

import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isGlobalAdmin = user?.roles?.includes("GLOBAL_ADMIN") ?? false;

  const navItems = [
    { icon: <NoteOutlinedIcon />, href: "/", active: pathname === "/" },
    isGlobalAdmin && { icon: <PeopleOutlinedIcon />, href: "/users", active: pathname === "/users" },
    { icon: <BusinessOutlinedIcon />, href: "/clients", active: pathname.startsWith("/clients") },
    { icon: <DomainOutlinedIcon />, href: "/organisations", active: pathname.startsWith("/organisations") },
    { icon: <SmartToyIcon />, href: "/chat", active: pathname === "/chat" },
  ].filter(Boolean) as { icon: React.ReactNode; href: string; active: boolean }[];

  const value = navItems.findIndex((item) => item.active);

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", md: "none" },
        zIndex: 1100,
      }}
    >
      <BottomNavigation value={value === -1 ? false : value}>
        {navItems.map((item) => (
          <BottomNavigationAction key={item.href} icon={item.icon} component={Link} href={item.href} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
