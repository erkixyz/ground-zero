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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Paroolid ei kattu");
      return;
    }
    if (password.length < 6) {
      setError("Parool peab olema vähemalt 6 tähemärki");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? "Parooli muutmine ebaõnnestus");
        } else {
          setSuccess(true);
          setTimeout(() => router.push("/"), 2500);
        }
      } catch {
        setError("Viga päringu saatmisel");
      }
    });
  };

  if (!token) {
    return <Alert severity="error">Vale või puuduv token. Palu uut lähtestamislinki.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success ? (
          <Alert severity="success">Parool muudetud! Suunamine sisselogimislehele…</Alert>
        ) : (
          <>
            <TextField
              label="Uus parool"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="new-password"
            />
            <TextField
              label="Korda parooli"
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
              Muuda parool
            </Button>
          </>
        )}
      </Stack>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Parooli lähtestamine
          </Typography>
          <Suspense fallback={<CircularProgress size={24} />}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </Box>
  );
}
