"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { authClient } from "../auth-client";
import { useLanguage } from "@/context/LanguageContext";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t.resetPassword.mismatch);
      return;
    }
    if (password.length < 6) {
      setError(t.resetPassword.tooShort);
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token });
      if (err) {
        setError((err as { message?: string }).message ?? t.resetPassword.failed);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2500);
      }
    });
  };

  if (!token) {
    return <Alert severity="error">{t.resetPassword.invalidToken}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success ? (
          <Alert severity="success">{t.resetPassword.success}</Alert>
        ) : (
          <>
            <TextField
              label={t.resetPassword.newPassword}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="new-password"
            />
            <TextField
              label={t.resetPassword.confirmPassword}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={pending}
              startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {t.resetPassword.submit}
            </Button>
          </>
        )}
      </Stack>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t.resetPassword.title}
          </Typography>
          <Suspense fallback={<CircularProgress size={24} />}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </Box>
  );
}
