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

export default function BottomNav() {
  const pathname = usePathname();

  const value =
    pathname === "/" ? 0
    : pathname === "/users" ? 1
    : pathname.startsWith("/clients") ? 2
    : pathname.startsWith("/organisations") ? 3
    : pathname === "/chat" ? 4
    : false;

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
      <BottomNavigation value={value}>
        <BottomNavigationAction icon={<NoteOutlinedIcon />} component={Link} href="/" />
        <BottomNavigationAction icon={<PeopleOutlinedIcon />} component={Link} href="/users" />
        <BottomNavigationAction icon={<BusinessOutlinedIcon />} component={Link} href="/clients" />
        <BottomNavigationAction icon={<DomainOutlinedIcon />} component={Link} href="/organisations" />
        <BottomNavigationAction icon={<SmartToyIcon />} component={Link} href="/chat" />
      </BottomNavigation>
    </Paper>
  );
}
