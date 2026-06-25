export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ClientsClient from "./components/ClientsClient";
import type { ClientRow } from "./components/ClientFormDialog";
import { getServerTranslations } from "@/i18n/server";

export default async function ClientsPage() {
  const { t } = await getServerTranslations();
  let clients: ClientRow[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/clients`, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status}`);
    clients = await res.json();
  } catch (e) {
    fetchError = `${t.clients.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t.clients.title}
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
          <ClientsClient clients={clients} />
        )}
      </Stack>
    </Container>
  );
}
