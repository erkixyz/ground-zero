"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import { useAuth } from "@/app/components/AuthProvider";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "?";
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 6, px: 2 }}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar sx={{ width: 56, height: 56, fontSize: 22, bgcolor: "primary.dark" }}>
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {fullName || "—"}
                </Typography>
                <Chip label={t.profile.role} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: 11 }} />
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <TextField
                label={t.profile.firstName}
                value={user.firstName}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label={t.profile.lastName}
                value={user.lastName}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label={t.profile.email}
                value={user.email}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label={t.profile.userId}
                value={user.id}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
                size="small"
                sx={{ "& input": { fontFamily: "monospace", fontSize: 12 } }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
