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
import Divider from "@mui/material/Divider";
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

  const handleGoogleLogin = async () => {
    setPending(true);
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: window.location.origin + "/" });
    setPending(false);
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
              <Divider>või</Divider>
              <Button
                variant="outlined"
                fullWidth
                disabled={pending}
                onClick={handleGoogleLogin}
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
                  </svg>
                }
              >
                Jätka Google'iga
              </Button>
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
