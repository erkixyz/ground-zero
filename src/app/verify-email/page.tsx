"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function ResendSection({ defaultEmail }: { defaultEmail: string }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/users/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      setResult(res.ok ? "success" : "error");
    } catch {
      setResult("error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, width: "100%", maxWidth: 360 }}>
      {result === "success" && <Alert severity="success" sx={{ width: "100%" }}>{t.emailVerification.resendSuccess}</Alert>}
      {result === "error" && <Alert severity="error" sx={{ width: "100%" }}>{t.emailVerification.resendError}</Alert>}
      <Button
        variant="outlined"
        onClick={handleResend}
        disabled={pending}
        startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {t.emailVerification.resend}
      </Button>
    </Box>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user } = useAuth();

  const verified = searchParams.get("verified") === "true";
  const hasError = searchParams.get("error") !== null;

  const userEmail = user?.email ?? "";

  // Success state — came from clicking the link
  if (verified && !hasError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 3, px: 2 }}>
        <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: "success.main" }} />
        <Typography variant="h5" fontWeight={600}>{t.emailVerification.verifiedTitle}</Typography>
        <Alert severity="success" sx={{ maxWidth: 400, width: "100%" }}>
          {t.emailVerification.verifiedMessage}
        </Alert>
        <Button variant="contained" onClick={() => { window.location.href = "/"; }}>
          {t.emailVerification.goHome}
        </Button>
      </Box>
    );
  }

  // Error state — expired or invalid link
  if (hasError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 3, px: 2 }}>
        <ErrorOutlinedIcon sx={{ fontSize: 64, color: "error.main" }} />
        <Typography variant="h5" fontWeight={600}>{t.emailVerification.errorTitle}</Typography>
        <Alert severity="error" sx={{ maxWidth: 400, width: "100%" }}>
          {t.emailVerification.errorMessage}
        </Alert>
        <ResendSection defaultEmail={userEmail} />
        <Button variant="text" component={Link} href="/" sx={{ mt: 1 }}>
          {t.emailVerification.goHome}
        </Button>
      </Box>
    );
  }

  // Default state — user navigated here from unverified badge
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 3, px: 2 }}>
      <EmailOutlinedIcon sx={{ fontSize: 64, color: "warning.main" }} />
      <Typography variant="h5" fontWeight={600}>{t.emailVerification.pendingTitle}</Typography>
      <Alert severity="warning" sx={{ maxWidth: 400, width: "100%" }}>
        {t.emailVerification.pendingMessage}
      </Alert>
      <ResendSection defaultEmail={userEmail} />
      <Button variant="text" component={Link} href="/">
        {t.emailVerification.goHome}
      </Button>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
