"use client";

import { useActionState, useRef } from "react";
import { createNote, type NoteFormState } from "@/app/actions";

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
import AddIcon from "@mui/icons-material/Add";

export default function NoteForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: NoteFormState, formData: FormData) => {
      const result = await createNote(prev, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    null,
  );

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
            Lisa märge
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="title"
              label="Pealkiri"
              required
              disabled={pending}
              fullWidth
              size="small"
              autoComplete="off"
            />

            <TextField
              name="content"
              label="Sisu"
              required
              disabled={pending}
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
                <InputLabel id="category-label">Kategooria</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  label="Kategooria"
                  defaultValue=""
                  disabled={pending}
                >
                  <MenuItem value="">— Vali —</MenuItem>
                  <MenuItem value="isiklik">Isiklik</MenuItem>
                  <MenuItem value="too">Töö</MenuItem>
                  <MenuItem value="ideed">Ideed</MenuItem>
                  <MenuItem value="muu">Muu</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch name="pinned" disabled={pending} />}
                label="Tähtsustatud"
                sx={{ color: "text.secondary", userSelect: "none" }}
              />
            </Stack>

            {state?.error && (
              <Alert severity="error" variant="outlined">
                {state.error}
              </Alert>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={<AddIcon />}
            fullWidth
          >
            {pending ? "Salvestan…" : "Lisa märge"}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}
