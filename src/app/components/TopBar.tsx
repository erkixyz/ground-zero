"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import StorageIcon from "@mui/icons-material/Storage";

export default function TopBar() {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 2 }}>
        <StorageIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Ground Zero
        </Typography>
        <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
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
