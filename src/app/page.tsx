export const dynamic = "force-dynamic";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import NoteForm from "@/app/components/NoteForm";
import NoteCard, { type Note } from "@/app/components/NoteCard";
import { getServerTranslations } from "@/i18n/server";

export default async function Home() {
  const { t } = await getServerTranslations();
  let notes: Note[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/notes`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    notes = await res.json();
  } catch (e) {
    fetchError = `${t.notes.loadError} — ${e instanceof Error ? e.message : t.common.unknownError}`;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <NoteForm />

        {fetchError ? (
          <Card sx={{ borderColor: "error.dark" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "error.light" }}>
                {fetchError}
              </Typography>
            </CardContent>
          </Card>
        ) : notes.length === 0 ? (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
            {t.notes.empty}
          </Typography>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </Stack>
    </Container>
  );
}
