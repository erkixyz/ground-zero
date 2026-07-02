"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        px: 3,
        py: 2,
        pb: { xs: 9, md: 2 },
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        color: "text.secondary",
      }}
    >
      <Typography variant="body2">
        © {year} Ground Zero. {t.footer.rights}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <EmailOutlinedIcon fontSize="inherit" />
          <Typography variant="body2" component="a" href="mailto:info@example.com" sx={{ color: "inherit", textDecoration: "none" }}>
            info@example.com
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <PhoneOutlinedIcon fontSize="inherit" />
          <Typography variant="body2" component="a" href="tel:+3720000000" sx={{ color: "inherit", textDecoration: "none" }}>
            +372 000 0000
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
