import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AuthForm, { type AuthFormData } from "../components/AuthForm";
import api from "../lib/api";

const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.error?.message ?? "Unable to send the verification email." : "Unable to send the verification email.";

export default function EmailForm() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestToken = params.get("requestToken") ?? "";
  const email = params.get("email") ?? "";
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestToken) return;
    let active = true;
    const check = async () => {
      try {
        const response = await api.get("/api/user/email-verification/status", { params: { requestToken } });
        if (active && response.data.data.verified) navigate(`/signup?email=${encodeURIComponent(response.data.data.email)}&requestToken=${encodeURIComponent(requestToken)}`, { replace: true });
      } catch (error) { if (active) setPollError(errorMessage(error)); }
    };
    check();
    const interval = window.setInterval(check, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [navigate, requestToken]);

  const submit = async (data: AuthFormData) => {
    try {
      const response = await api.post("/api/user/send-email", { email: data.email });
      setParams({ requestToken: response.data.data.requestToken, email: data.email });
    } catch (error) { throw new Error(errorMessage(error), { cause: error }); }
  };

  if (!requestToken) return <AuthForm mode="email" onSubmit={submit} />;
  return <WaitingPage email={email} error={pollError} onRestart={() => setParams({})} />;
}

export function WaitingPage({ email, error, onRestart, reset = false }: { email: string; error: string | null; onRestart: () => void; reset?: boolean }) {
  return <Box sx={{ minHeight: "calc(100dvh / var(--app-scale, 1))", display: "grid", placeItems: "center", p: 2.5, background: "linear-gradient(135deg, #e9f2fb, #f8fafc)" }}><Paper elevation={0} sx={{ maxWidth: 560, width: "100%", p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: "center", boxShadow: "0 24px 70px rgba(15,23,42,.13)" }}><Stack spacing={2.5} sx={{ alignItems: "center" }}><Box sx={{ width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#eaf3ff", color: "primary.main" }}><MarkEmailReadOutlinedIcon sx={{ fontSize: 38 }} /></Box><Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>Check your email</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>We sent {reset ? "a password reset" : "a verification"} link to <strong>{email}</strong>. This page will continue automatically after you click it.</Typography><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><CircularProgress size={18} /><Typography variant="body2" color="text.secondary">Waiting for confirmation…</Typography></Stack>{error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}<Button variant="outlined" onClick={onRestart} sx={{ textTransform: "none", fontWeight: 800 }}>Use a different email</Button><Typography variant="body2"><Link to="/login">Back to login</Link></Typography></Stack></Paper></Box>;
}
