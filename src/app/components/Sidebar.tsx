"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import ArticleIcon from "@mui/icons-material/Article";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import ReadmeDrawer from "./ReadmeDrawer";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [readmeOpen, setReadmeOpen] = useState(false);

  const navItems = [
    { label: t.nav.notes, href: "/", icon: <NoteOutlinedIcon fontSize="small" />, active: pathname === "/" },
    { label: t.nav.users, href: "/users", icon: <PeopleOutlinedIcon fontSize="small" />, active: pathname === "/users" },
    { label: t.clients.title, href: "/clients", icon: <BusinessOutlinedIcon fontSize="small" />, active: pathname.startsWith("/clients") },
    { label: t.organisations.title, href: "/organisations", icon: <DomainOutlinedIcon fontSize="small" />, active: pathname.startsWith("/organisations") },
    { label: t.nav.chat, href: "/chat", icon: <SmartToyIcon fontSize="small" />, active: pathname === "/chat" },
  ];

  return (
    <>
      <Box
        component="nav"
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: 220,
          flexShrink: 0,
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          position: "sticky",
          top: "64px",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          pt: 1,
        }}
      >
        <Typography variant="overline" sx={{ px: 2, color: "text.disabled", fontSize: 10 }}>
          {t.nav.services}
        </Typography>
        <List dense disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={item.active}
            >
              <ListItemIcon sx={{ minWidth: 36, color: item.active ? "primary.main" : "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 14,
                      fontWeight: item.active ? 700 : 400,
                      color: item.active ? "primary.main" : "text.primary",
                    },
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 0.5 }} />
        <List dense disablePadding>
          <ListItemButton onClick={() => setReadmeOpen(true)}>
            <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
              <ArticleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t.nav.readme}
              slotProps={{ primary: { sx: { fontSize: 14 } } }}
            />
          </ListItemButton>
        </List>
      </Box>

      <ReadmeDrawer open={readmeOpen} onClose={() => setReadmeOpen(false)} />
    </>
  );
}
