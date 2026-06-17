"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import StorageIcon from "@mui/icons-material/Storage";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopBar() {
  const pathname = usePathname();

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 2 }}>
        <StorageIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Ground Zero
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
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
        </Stack>

        <Stack direction="row" spacing={1} sx={{ ml: "auto", display: { xs: "none", sm: "flex" } }}>
          {["Next.js 16", "NestJS", "PostgreSQL", "Prisma 7"].map((label) => (
            <Chip
              key={label}
              label={label}
              size="small"
              variant="outlined"
              sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
            />
          ))}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
