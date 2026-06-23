export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NoteCard, { type Note } from "@/app/components/NoteCard";
import { getServerTranslations } from "@/i18n/server";
import { notFound } from "next/navigation";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getServerTranslations();

  let note: Note | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/notes/${id}`, {
      cache: "no-store",
    });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`${res.status}`);
    note = await res.json();
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_NOT_FOUND") throw e;
    fetchError = `${t.notes.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          href="/"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ alignSelf: "flex-start", color: "text.secondary" }}
        >
          {t.notes.backToNotes}
        </Button>

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>
                {fetchError}
              </Typography>
            </CardContent>
          </Card>
        ) : note ? (
          <NoteCard note={note} />
        ) : null}
      </Stack>
    </Container>
  );
}
