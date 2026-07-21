import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../lib/api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const reset = params.get("purpose") === "reset";
  const [error, setError] = useState<string | null>(token ? null : "The verification token is missing.");
  useEffect(() => {
    if (!token) return;
    let active = true;
    const confirm = async () => {
      try {
        const endpoint = reset ? "/api/user/password-reset/confirm" : "/api/user/verify-email";
        const response = await api.get(endpoint, { params: { token } });
        if (!active) return;
        if (reset) navigate(`/reset-password?credential=${encodeURIComponent(token)}`, { replace: true });
        else navigate(`/signup?email=${encodeURIComponent(response.data.data.email)}&linkToken=${encodeURIComponent(token)}`, { replace: true });
      } catch (requestError) {
        if (active) setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error?.message ?? "This link is invalid or expired." : "This link is invalid or expired.");
      }
    };
    confirm();
    return () => { active = false; };
  }, [navigate, reset, token]);
  return <Box sx={{ minHeight: "calc(100dvh / var(--app-scale, 1))", display: "grid", placeItems: "center", p: 2.5, background: "linear-gradient(135deg, #e9f2fb, #f8fafc)" }}><Paper elevation={0} sx={{ width: "100%", maxWidth: 520, p: 5, borderRadius: 4, textAlign: "center", boxShadow: "0 24px 70px rgba(15,23,42,.13)" }}><Stack spacing={2.5} sx={{ alignItems: "center" }}>{error ? <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert> : <><CircularProgress /><Typography variant="h5" sx={{ fontWeight: 900 }}>Confirming your secure link…</Typography><Typography color="text.secondary">You’ll be redirected automatically.</Typography></>}</Stack></Paper></Box>;
}
