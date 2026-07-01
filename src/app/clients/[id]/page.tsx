export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import FingerprintIcon from "@mui/icons-material/FingerprintOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarTodayOutlined";
import { getServerTranslations } from "@/i18n/server";
import { notFound } from "next/navigation";

function flagEmoji(code: string) {
  return String.fromCodePoint(...code.split("").map((c) => c.charCodeAt(0) + 0x1f1a5));
}

function countryName(code: string, locale: string) {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

type ClientDetail = {
  id: string;
  name: string;
  regCode: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  createdAt: string;
};

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getServerTranslations();

  let client: ClientDetail | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/clients/${id}`, { cache: "no-store" });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`${res.status}`);
    client = await res.json();
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_NOT_FOUND") throw e;
    fetchError = `${t.clients.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          href="/clients"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ alignSelf: "flex-start", color: "text.secondary" }}
        >
          {t.clients.backToClients}
        </Button>

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>{fetchError}</Typography>
            </CardContent>
          </Card>
        ) : client ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <BusinessOutlinedIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {client.name}
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  {client.regCode && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <FingerprintIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2">{client.regCode}</Typography>
                    </Stack>
                  )}
                  {(client.street || client.city || client.zip || client.country) && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <LocationOnOutlinedIcon sx={{ color: "text.secondary", fontSize: 18, mt: 0.3 }} />
                      <Stack>
                        {client.street && <Typography variant="body2">{client.street}</Typography>}
                        {(client.zip || client.city) && (
                          <Typography variant="body2">
                            {[client.zip, client.city].filter(Boolean).join(" ")}
                          </Typography>
                        )}
                        {client.country && (
                          <Typography variant="body2">
                            {flagEmoji(client.country)} {countryName(client.country, t.common.localeCode)}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <CalendarTodayIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {t.clients.added}: {new Date(client.createdAt).toLocaleDateString(t.common.localeCode)}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
