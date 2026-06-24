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
import { useLanguage } from "@/context/LanguageContext";
import { authClient } from "../auth-client";

type Props = { open: boolean; onClose: () => void };

type View = "login" | "forgot" | "register";

export default function LoginDialog({ open, onClose }: Props) {
  const { login, signUp } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetFields();
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
      setError(/invalid email or password/i.test(err) ? t.login.invalidCredentials : err);
    } else {
      resetFields();
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
      setError((err as { message?: string }).message ?? t.login.requestError);
    } else {
      setSuccess(t.login.resetEmailSent);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) return;
    if (password.length < 6) {
      setError(t.register.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.register.passwordMismatch);
      return;
    }
    setPending(true);
    setError(null);
    const err = await signUp(email, password, firstName, lastName);
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(t.register.success);
  };

  const switchTo = (v: View) => {
    setError(null);
    setSuccess(null);
    setView(v);
  };

  if (view === "register") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleRegister}>
          <DialogTitle>{t.register.title}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success ? (
                <Alert severity="success">{success}</Alert>
              ) : (
                <>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label={t.register.firstName}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      fullWidth
                      autoFocus
                      autoComplete="given-name"
                    />
                    <TextField
                      label={t.register.lastName}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      fullWidth
                      autoComplete="family-name"
                    />
                  </Stack>
                  <TextField
                    label={t.register.email}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    autoComplete="email"
                  />
                  <TextField
                    label={t.register.password}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="new-password"
                  />
                  <TextField
                    label={t.register.confirmPassword}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="new-password"
                  />
                </>
              )}
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t.register.alreadyHaveAccount}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: "primary.main", cursor: "pointer" }}
                  onClick={() => switchTo("login")}
                >
                  {t.register.signIn}
                </Typography>
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={pending}>{t.register.cancel}</Button>
            {!success && (
              <Button
                type="submit"
                variant="contained"
                disabled={pending}
                startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {t.register.submit}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  if (view === "forgot") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleForgot}>
          <DialogTitle>{t.login.forgotTitle}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success ? (
                <Alert severity="success">{success}</Alert>
              ) : (
                <TextField
                  label={t.login.email}
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
            <Button onClick={() => switchTo("login")} disabled={pending}>{t.login.back}</Button>
            {!success && (
              <Button
                type="submit"
                variant="contained"
                disabled={pending}
                startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {t.login.sendLink}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleLogin}>
        <DialogTitle>{t.login.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t.login.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="email"
            />
            <TextField
              label={t.login.password}
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
              onClick={() => switchTo("forgot")}
            >
              {t.login.forgotPassword}
            </Typography>
            <Divider>{t.login.or}</Divider>
            <Button
              type="button"
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
              {t.login.continueWithGoogle}
            </Button>
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
              {t.login.noAccount}{" "}
              <Typography
                component="span"
                variant="body2"
                sx={{ color: "primary.main", cursor: "pointer" }}
                onClick={() => switchTo("register")}
              >
                {t.login.createAccount}
              </Typography>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={pending}>{t.login.cancel}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {t.login.submit}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
