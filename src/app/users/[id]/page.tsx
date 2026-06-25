export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarTodayOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Link from "next/link";
import { getServerTranslations } from "@/i18n/server";
import { notFound } from "next/navigation";
import type { UserRow } from "../components/UserFormDialog";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getServerTranslations();

  let user: UserRow | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/users/${id}`, { cache: "no-store" });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`${res.status}`);
    user = await res.json();
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_NOT_FOUND") throw e;
    fetchError = `${t.users.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          href="/users"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ alignSelf: "flex-start", color: "text.secondary" }}
        >
          {t.users.backToUsers}
        </Button>

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>{fetchError}</Typography>
            </CardContent>
          </Card>
        ) : user ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <PersonOutlinedIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <EmailIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    <Typography variant="body2">{user.email}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <CalendarTodayIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {t.users.added}: {new Date(user.createdAt).toLocaleDateString(t.common.localeCode)}
                    </Typography>
                  </Stack>
                  {user.client && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <BusinessOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Link
                        href={`/clients/${user.client.id}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "primary.main", "&:hover": { textDecoration: "underline" } }}
                        >
                          {user.client.name}
                        </Typography>
                      </Link>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
