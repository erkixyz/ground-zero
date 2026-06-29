export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import OrganisationsClient from "./components/OrganisationsClient";
import type { OrganisationRow } from "./components/OrganisationFormDialog";
import { getServerTranslations } from "@/i18n/server";

export default async function OrganisationsPage() {
  const { t } = await getServerTranslations();
  let organisations: OrganisationRow[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/organisations`, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status}`);
    organisations = await res.json();
  } catch (e) {
    fetchError = `${t.organisations.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t.organisations.title}
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
          <OrganisationsClient organisations={organisations} />
        )}
      </Stack>
    </Container>
  );
}
