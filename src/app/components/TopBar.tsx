"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import StorageIcon from "@mui/icons-material/Storage";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import LoginDialog from "./LoginDialog";

export default function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1 }}>
          <StorageIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 1 }}>
            Ground Zero
          </Typography>

          <Button
            component={Link}
            href="/"
            size="small"
            startIcon={<NoteOutlinedIcon />}
            sx={{
              color: pathname === "/" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/" ? 700 : 400,
            }}
          >
            Märkmed
          </Button>
          <Button
            component={Link}
            href="/users"
            size="small"
            startIcon={<PeopleOutlinedIcon />}
            sx={{
              color: pathname === "/users" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/users" ? 700 : 400,
            }}
          >
            Kasutajad
          </Button>

          <Stack direction="row" spacing={1} sx={{ ml: "auto", display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
            {["Next.js 16", "NestJS", "PostgreSQL", "Prisma 7"].map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                variant="outlined"
                sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
              />
            ))}

            {user ? (
              <>
                <Tooltip title={`${user.firstName} ${user.lastName} · ${user.email}`}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "primary.dark", cursor: "default" }}>
                    {initials}
                  </Avatar>
                </Tooltip>
                <Tooltip title="Logi välja">
                  <IconButton size="small" onClick={logout} sx={{ color: "text.secondary" }}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button size="small" variant="outlined" onClick={() => setLoginOpen(true)}>
                Logi sisse
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
