"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import StorageIcon from "@mui/icons-material/Storage";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ArticleIcon from "@mui/icons-material/Article";
import MenuIcon from "@mui/icons-material/Menu";
import BarChartIcon from "@mui/icons-material/BarChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import DnsIcon from "@mui/icons-material/Dns";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import DataObjectIcon from "@mui/icons-material/DataObject";
import TuneIcon from "@mui/icons-material/Tune";
import HubIcon from "@mui/icons-material/Hub";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import LoginDialog from "./LoginDialog";
import ReadmeDrawer from "./ReadmeDrawer";

const SERVICE_LINKS = [
  {
    group: "Observability",
    items: [
      { label: "Grafana", hint: "admin / admin", href: "http://localhost:3002", icon: <BarChartIcon fontSize="small" /> },
      { label: "Prometheus", hint: "localhost:9090", href: "http://localhost:9090", icon: <TimelineIcon fontSize="small" /> },
      { label: "Loki", hint: "Grafana Explore → Loki", href: "http://localhost:3002/explore?orgId=1&left=%7B%22datasource%22%3A%22Loki%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%22%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D", icon: <TextSnippetIcon fontSize="small" /> },
    ],
  },
  {
    group: "Infrastruktuur",
    items: [
      { label: "RabbitMQ", hint: "guest / guest", href: "http://localhost:15672", icon: <HubIcon fontSize="small" /> },
      { label: "MinIO", hint: "localhost:9001", href: "http://localhost:9001", icon: <CloudQueueIcon fontSize="small" /> },
      { label: "Nginx Status", hint: "localhost:8080", href: "http://localhost:8080/nginx-status", icon: <DnsIcon fontSize="small" /> },
      { label: "HAProxy (DB)", hint: "localhost:8404", href: "http://localhost:8404", icon: <TuneIcon fontSize="small" /> },
      { label: "Redis LB", hint: "localhost:8405", href: "http://localhost:8405", icon: <TuneIcon fontSize="small" /> },
    ],
  },
  {
    group: "API",
    items: [
      { label: "Swagger UI", hint: "localhost:3001/api", href: "http://localhost:3001/api", icon: <DataObjectIcon fontSize="small" /> },
    ],
  },
];

export default function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

          <Stack direction="row" spacing={0.5} sx={{ ml: "auto", alignItems: "center" }}>
            <Tooltip title="README">
              <IconButton size="small" onClick={() => setReadmeOpen(true)} sx={{ color: "text.secondary" }}>
                <ArticleIcon fontSize="small" />
              </IconButton>
            </Tooltip>

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
              <Button size="small" variant="outlined" onClick={() => setLoginOpen(true)} sx={{ mr: 0.5 }}>
                Logi sisse
              </Button>
            )}

            <Tooltip title="Teenused">
              <IconButton size="small" onClick={() => setMenuOpen(true)} sx={{ color: "text.secondary" }}>
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 260, pt: 1 }}>
          <Typography variant="overline" sx={{ px: 2, color: "text.disabled", fontSize: 10 }}>
            Teenuste lingid
          </Typography>
          {SERVICE_LINKS.map((section, i) => (
            <Box key={section.group}>
              {i > 0 && <Divider sx={{ my: 0.5 }} />}
              <Typography variant="overline" sx={{ px: 2, color: "text.disabled", fontSize: 10 }}>
                {section.group}
              </Typography>
              <List dense disablePadding>
                {section.items.map((item) => (
                  <ListItemButton
                    key={item.label}
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.hint}
                      slotProps={{
                        primary: { sx: { fontSize: 14 } },
                        secondary: { sx: { fontSize: 11 } },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      </Drawer>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      <ReadmeDrawer open={readmeOpen} onClose={() => setReadmeOpen(false)} />
    </>
  );
}
