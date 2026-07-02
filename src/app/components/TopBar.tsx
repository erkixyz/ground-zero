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
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import ArticleIcon from "@mui/icons-material/Article";
import MenuIcon from "@mui/icons-material/Menu";
import HandymanIcon from "@mui/icons-material/Handyman";
import BarChartIcon from "@mui/icons-material/BarChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import DnsIcon from "@mui/icons-material/Dns";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import DataObjectIcon from "@mui/icons-material/DataObject";
import TuneIcon from "@mui/icons-material/Tune";
import HubIcon from "@mui/icons-material/Hub";
import EmailIcon from "@mui/icons-material/Email";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/i18n";
import LoginDialog from "./LoginDialog";
import ReadmeDrawer from "./ReadmeDrawer";
import GlobalSearch from "./GlobalSearch";

const SERVICE_LINKS = (infrastructure: string) => [
  {
    group: "Observability",
    items: [
      { label: "Grafana", hint: "admin / admin", href: "http://localhost:3002", icon: <BarChartIcon fontSize="small" /> },
      { label: "Prometheus", hint: "localhost:9090", href: "http://localhost:9090", icon: <TimelineIcon fontSize="small" /> },
      { label: "Mailpit", hint: "localhost:8025", href: "http://localhost:8025", icon: <EmailIcon fontSize="small" /> },
      { label: "Loki", hint: "Grafana Explore → Loki", href: "http://localhost:3002/explore?orgId=1&left=%7B%22datasource%22%3A%22Loki%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%22%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D", icon: <TextSnippetIcon fontSize="small" /> },
    ],
  },
  {
    group: infrastructure,
    items: [
      { label: "RabbitMQ", hint: "guest / guest", href: "http://localhost:15672", icon: <HubIcon fontSize="small" /> },
      { label: "MinIO", hint: "minioadmin / minioadmin123", href: "http://localhost:9001", icon: <CloudQueueIcon fontSize="small" /> },
      { label: "Nginx Status", hint: "localhost:8080", href: "http://localhost:8080/nginx-status", icon: <DnsIcon fontSize="small" /> },
      { label: "pgAdmin", hint: "admin@admin.com / admin", href: "http://localhost:5050", icon: <TableChartOutlinedIcon fontSize="small" /> },
      { label: "HAProxy (DB)", hint: "localhost:8404", href: "http://localhost:8404", icon: <TuneIcon fontSize="small" /> },
      { label: "Redis LB", hint: "localhost:8405", href: "http://localhost:8405", icon: <TuneIcon fontSize="small" /> },
    ],
  },
  {
    group: "API",
    items: [
      { label: "Swagger UI", hint: "localhost:3001/docs", href: "http://localhost:3001/docs", icon: <DataObjectIcon fontSize="small" /> },
    ],
  },
];

export default function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const [loginOpen, setLoginOpen] = useState(false);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";
  const serviceLinks = SERVICE_LINKS(t.services.infrastructure);
  const isGlobalAdmin = user?.roles?.includes("GLOBAL_ADMIN") ?? false;

  const navItems = [
    { label: t.nav.notes, href: "/", icon: <NoteOutlinedIcon fontSize="small" />, active: pathname === "/" },
    isGlobalAdmin && { label: t.nav.users, href: "/users", icon: <PeopleOutlinedIcon fontSize="small" />, active: pathname === "/users" },
    { label: t.clients.title, href: "/clients", icon: <BusinessOutlinedIcon fontSize="small" />, active: pathname.startsWith("/clients") },
    { label: t.organisations.title, href: "/organisations", icon: <DomainOutlinedIcon fontSize="small" />, active: pathname.startsWith("/organisations") },
    { label: t.nav.chat, href: "/chat", icon: <SmartToyIcon fontSize="small" />, active: pathname === "/chat" },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode; active: boolean }[];

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1 }}>
          <Box
            component="svg"
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            sx={{ flexShrink: 0, color: "primary.contrastText" }}
          >
            <circle cx="15" cy="15" r="2.5" fill="currentColor" />
            <circle cx="15" cy="15" r="9.5" stroke="currentColor" strokeWidth="1.8" />
            <line x1="15" y1="0.5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="15" y1="25" x2="15" y2="29.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0.5" y1="15" x2="5" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="25" y1="15" x2="29.5" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mr: 1, display: { xs: "none", md: "block" } }}
          >
            Ground Zero
          </Typography>

          <Stack direction="row" spacing={0.5} sx={{ ml: "auto", alignItems: "center" }}>
            <Tooltip title={`${t.search.placeholder} (${t.search.shortcut})`}>
              <IconButton size="small" onClick={() => setSearchOpen(true)} sx={{ color: "text.secondary" }}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {(["et", "en"] as Locale[]).map((lang) => (
              <Tooltip key={lang} title={lang === "et" ? "Eesti" : "English"}>
                <IconButton
                  size="small"
                  onClick={() => setLocale(lang)}
                  sx={{
                    p: 0.5,
                    opacity: locale === lang ? 1 : 0.3,
                    transition: "opacity 0.15s",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <ReactCountryFlag
                    countryCode={lang === "et" ? "EE" : "GB"}
                    svg
                    style={{ width: 20, height: 15, display: "block" }}
                  />
                </IconButton>
              </Tooltip>
            ))}

            {user ? (
              <>
                {!user.emailVerified && (
                  <Tooltip title={t.emailVerification.unverified}>
                    <IconButton size="small" sx={{ color: "warning.main" }} component={Link} href="/verify-email">
                      <WarningAmberIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={`${t.nav.profile} · ${user.firstName} ${user.lastName}`}>
                  <Avatar
                    component={Link}
                    href="/profile"
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: 12,
                      bgcolor: pathname === "/profile" ? "primary.main" : "primary.dark",
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                      "&:hover": { opacity: 0.85 },
                    }}
                  >
                    {initials}
                  </Avatar>
                </Tooltip>
                <Tooltip title={t.nav.logout}>
                  <IconButton size="small" onClick={logout} sx={{ color: "text.secondary" }}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button size="small" variant="outlined" onClick={() => setLoginOpen(true)} sx={{ mr: 0.5 }}>
                {t.nav.login}
              </Button>
            )}

            <Tooltip title={t.nav.tools}>
              <IconButton size="small" onClick={() => setToolsOpen(true)} sx={{ color: "text.secondary" }}>
                <HandymanIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={t.nav.menu}>
              <IconButton
                size="small"
                onClick={() => setMenuOpen(true)}
                sx={{ color: "text.secondary", display: { xs: "flex", md: "none" } }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Navigation + README drawer */}
      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 260, pt: 1 }}>
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
                onClick={() => setMenuOpen(false)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: item.active ? "primary.main" : "text.secondary",
                  }}
                >
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
            <ListItemButton
              onClick={() => {
                setMenuOpen(false);
                setReadmeOpen(true);
              }}
            >
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
      </Drawer>

      {/* Tools / services drawer */}
      <Drawer anchor="right" open={toolsOpen} onClose={() => setToolsOpen(false)}>
        <Box sx={{ width: 260, pt: 1 }}>
          <Typography variant="overline" sx={{ px: 2, color: "text.disabled", fontSize: 10 }}>
            {t.services.links}
          </Typography>
          {serviceLinks.map((section, i) => (
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
                    onClick={() => setToolsOpen(false)}
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
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
