"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNote, type NoteFormState } from "@/app/actions";
import { useToast } from "./ToastProvider";
import { useLanguage } from "@/context/LanguageContext";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";

export default function NoteForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const processedNoteId = useRef<number | null>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: NoteFormState, formData: FormData) => {
      return createNote(prev, formData);
    },
    null,
  );

  useEffect(() => {
    if (!state || !("noteId" in state)) return;
    if (state.noteId === processedNoteId.current) return;
    processedNoteId.current = state.noteId;

    if (files.length === 0) {
      formRef.current?.reset();
      showToast(t.notes.saved);
      router.refresh();
      return;
    }

    (async () => {
      setUploading(true);
      try {
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/notes/${state.noteId}/files`,
            { method: "POST", body: fd },
          );
        }
        showToast(t.notes.saved);
      } finally {
        setUploading(false);
        setFiles([]);
        formRef.current?.reset();
        router.refresh();
      }
    })();
  }, [state]);

  const busy = pending || uploading;
  const error = state && "error" in state ? state.error : null;

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
            {t.notes.addNote}
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="title"
              label={t.notes.title}
              required
              disabled={busy}
              fullWidth
              size="small"
              autoComplete="off"
            />

            <TextField
              name="content"
              label={t.notes.content}
              required
              disabled={busy}
              fullWidth
              multiline
              rows={3}
              autoComplete="off"
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { sm: "center" } }}
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="category-label">{t.notes.category}</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  label={t.notes.category}
                  defaultValue=""
                  disabled={busy}
                >
                  <MenuItem value="">{t.notes.selectCategory}</MenuItem>
                  <MenuItem value="isiklik">{t.notes.categories.isiklik}</MenuItem>
                  <MenuItem value="too">{t.notes.categories.too}</MenuItem>
                  <MenuItem value="ideed">{t.notes.categories.ideed}</MenuItem>
                  <MenuItem value="muu">{t.notes.categories.muu}</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch name="pinned" disabled={busy} />}
                label={t.notes.pinned}
                sx={{ color: "text.secondary", userSelect: "none" }}
              />
            </Stack>

            <Box>
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon />}
                disabled={busy}
                sx={{ borderColor: "divider", color: "text.secondary" }}
              >
                {t.notes.addFiles}
                <input
                  type="file"
                  hidden
                  multiple
                  disabled={busy}
                  onChange={(e) =>
                    setFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files ?? []),
                    ])
                  }
                />
              </Button>

              {files.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {files.map((f, i) => (
                    <Chip
                      key={i}
                      label={f.name}
                      size="small"
                      variant="outlined"
                      disabled={busy}
                      onDelete={() =>
                        setFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      sx={{ maxWidth: 180, fontSize: 11, borderColor: "divider" }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}

            {uploading && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t.notes.uploadingFiles}
                </Typography>
                <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
              </Box>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            startIcon={<AddIcon />}
            fullWidth
          >
            {pending ? t.notes.saving : t.notes.addNote}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}
