export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
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

type OrganisationDetail = {
  id: string;
  name: string;
  regCode: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  createdAt: string;
};

export default async function OrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getServerTranslations();

  let org: OrganisationDetail | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/organisations/${id}`, { cache: "no-store" });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`${res.status}`);
    org = await res.json();
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_NOT_FOUND") throw e;
    fetchError = `${t.organisations.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          href="/organisations"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ alignSelf: "flex-start", color: "text.secondary" }}
        >
          {t.organisations.backToOrganisations}
        </Button>

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>{fetchError}</Typography>
            </CardContent>
          </Card>
        ) : org ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <DomainOutlinedIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {org.name}
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  {org.regCode && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <FingerprintIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2">{org.regCode}</Typography>
                    </Stack>
                  )}
                  {(org.street || org.city || org.zip || org.country) && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <LocationOnOutlinedIcon sx={{ color: "text.secondary", fontSize: 18, mt: 0.3 }} />
                      <Stack>
                        {org.street && <Typography variant="body2">{org.street}</Typography>}
                        {(org.zip || org.city) && (
                          <Typography variant="body2">
                            {[org.zip, org.city].filter(Boolean).join(" ")}
                          </Typography>
                        )}
                        {org.country && (
                          <Typography variant="body2">
                            {flagEmoji(org.country)} {countryName(org.country, t.common.localeCode)}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <CalendarTodayIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {t.organisations.added}: {new Date(org.createdAt).toLocaleDateString(t.common.localeCode)}
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
