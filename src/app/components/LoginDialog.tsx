"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useAuth } from "./AuthProvider";
import { authClient } from "../auth-client";

type Props = { open: boolean; onClose: () => void };

export default function LoginDialog({ open, onClose }: Props) {
  const { login } = useAuth();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setView("login");
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setPending(true);
    setError(null);
    const err = await login(email, password);
    setPending(false);
    if (err) {
      setError(err);
    } else {
      setEmail("");
      setPassword("");
      onClose();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError(null);
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (err) {
      setError((err as { message?: string }).message ?? "Viga päringu saatmisel");
    } else {
      setSuccess("Kui e-post on registreeritud, saatisime parooli lähtestamise lingi.");
    }
  };

  const switchToForgot = () => {
    setError(null);
    setSuccess(null);
    setPassword("");
    setView("forgot");
  };

  const switchToLogin = () => {
    setError(null);
    setSuccess(null);
    setView("login");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      {view === "login" ? (
        <form onSubmit={handleLogin}>
          <DialogTitle>Logi sisse</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="E-post"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoFocus
                autoComplete="email"
              />
              <TextField
                label="Parool"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
              />
              <Typography
                variant="body2"
                sx={{ color: "primary.main", cursor: "pointer", alignSelf: "flex-start" }}
                onClick={switchToForgot}
              >
                Unustasid parooli?
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={pending}>Tühista</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pending}
              startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Logi sisse
            </Button>
          </DialogActions>
        </form>
      ) : (
        <form onSubmit={handleForgot}>
          <DialogTitle>Parooli lähtestamine</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success ? (
                <Alert severity="success">{success}</Alert>
              ) : (
                <TextField
                  label="E-post"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  autoComplete="email"
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={switchToLogin} disabled={pending}>Tagasi</Button>
            {!success && (
              <Button
                type="submit"
                variant="contained"
                disabled={pending}
                startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
              >
                Saada link
              </Button>
            )}
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
