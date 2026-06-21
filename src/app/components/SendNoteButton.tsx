"use client";

import { useState, useTransition } from "react";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { sendNote } from "@/app/actions";

export default function SendNoteButton({ noteId }: { noteId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(false);
    setEmail("");
  };

  const handleClose = () => {
    if (pending) return;
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    startTransition(async () => {
      const result = await sendNote(noteId, email);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setOpen(false), 1500);
      }
    });
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
        aria-label="Saada e-postiga"
      >
        <SendIcon fontSize="small" />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Saada märge e-postiga</DialogTitle>
          <DialogContent>
            {success ? (
              <Alert severity="success">Märge saadetud!</Alert>
            ) : (
              <>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                  label="Saaja e-post"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </DialogContent>
          {!success && (
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleClose} disabled={pending}>
                Tühista
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={pending}
                startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
              >
                Saada
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </>
  );
}
