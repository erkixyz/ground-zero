export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import UsersClient from "./components/UsersClient";
import { UserRow } from "./components/UserFormDialog";
import { getServerTranslations } from "@/i18n/server";

export default async function UsersPage() {
  const { t } = await getServerTranslations();
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();
  let users: UserRow[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/users`, {
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : {},
    });
    if (!res.ok) throw new Error(`${res.status}`);
    users = await res.json();
  } catch (e) {
    fetchError = `${t.users.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t.users.title}
        </Typography>

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>
                {fetchError}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <UsersClient users={users} />
        )}
      </Stack>
    </Container>
  );
}
