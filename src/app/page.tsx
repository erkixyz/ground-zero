import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

import NoteForm from "@/app/components/NoteForm";
import DeleteButton from "@/app/components/DeleteButton";
import NoteFileChip from "@/app/components/NoteFileChip";

export const dynamic = "force-dynamic";

type NoteFile = {
  id: number;
  filename: string;
  key: string;
  size: number;
  mimeType: string;
  url: string;
};

type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  files: NoteFile[];
};

export default async function Home() {
  let notes: Note[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${process.env.API_URL}/api/notes`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    notes = await res.json();
  } catch (e) {
    fetchError = `Märkmete laadimine ebaõnnestus — ${e instanceof Error ? e.message : "tundmatu viga"}`;
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
            Märkmeid pole. Lisa esimene!
          </Typography>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent sx={{ pb: "12px !important" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {note.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 0.5, whiteSpace: "pre-wrap" }}
                    >
                      {note.content}
                    </Typography>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
                      <Chip
                        label={new Date(note.createdAt).toLocaleString("et-EE")}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
                      />
                      {note.files.map((file) => (
                        <NoteFileChip
                          key={file.id}
                          fileId={file.id}
                          noteId={note.id}
                          filename={file.filename}
                          url={file.url}
                        />
                      ))}
                    </Box>
                  </Box>
                  <DeleteButton id={note.id} />
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  );
}
