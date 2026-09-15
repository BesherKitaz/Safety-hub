import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Alert, Box, Button, Chip, IconButton, InputAdornment, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { Visibility, VisibilityOff, VerifiedUserOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { isPurdueEmail, requiresPurdueEmail } from "../util/emailPolicy";
// Provide immediate password guidance; the backend remains the security authority.
const passwordScore = (password: string) => [password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;

export type AuthFormData = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  academicAffiliations?: { collegeId: string; departmentId: string }[];
};
type AuthMode = "login" | "signup" | "email" | "forgot" | "reset";
type AuthFormProps = { mode: AuthMode; onSubmit: (data: AuthFormData) => Promise<unknown> | void; signupEmail?: string };

const copy = {
  login: { eyebrow: "Demo access", title: "Log in to Safety Hub", body: "Please enter your name.", button: "Log in as admin" },
  signup: { eyebrow: "Demo access", title: "Create your account", body: "Please enter your name. This is a demo app; a real app would require real authentication steps.", button: "Create demo account with full access" },
  email: { eyebrow: "New account", title: "Verify your email", body: "We’ll email you a secure link before you create your account.", button: "Send verification link" },
  forgot: { eyebrow: "Account recovery", title: "Reset your password", body: "Enter your account email and we’ll send a secure reset link.", button: "Send reset link" },
  reset: { eyebrow: "Secure reset", title: "Choose a new password", body: "Use at least 12 characters and avoid common words.", button: "Update password" },
};

export default function AuthForm({ mode, onSubmit, signupEmail }: AuthFormProps) {
  // One form component serves login, signup, verification, and recovery variants.
  const [data, setData] = useState<AuthFormData>({ name: "", firstName: "", lastName: "", email: signupEmail ?? "", password: "", confirmPassword: "" });
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsPassword = mode === "reset";
  const needsConfirmation = mode === "reset";
  const strength = needsConfirmation && data.password ? passwordScore(data.password) : 0;
  const details = copy[mode];

  const change = (key: keyof AuthFormData) => (event: ChangeEvent<HTMLInputElement>) => setData((current) => ({ ...current, [key]: event.target.value }));

  // Perform mode-specific client checks before delegating the request to the page.
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (mode === "email" && requiresPurdueEmail() && !isPurdueEmail(data.email)) {
      setError("Use a Purdue University email ending in @purdue.edu.");
      return;
    }
    if (needsConfirmation && data.password !== data.confirmPassword) { setError("Passwords must match."); return; }
    if (needsConfirmation && (data.password.length < 12 || strength < 3)) { setError("Choose a stronger password with at least 12 characters."); return; }
    if ((mode === "login" || mode === "signup") && (!data.name || data.name.trim().length < 2)) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordAdornment = (shown: boolean, toggle: () => void) => ({ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={toggle} edge="end" aria-label={shown ? "Hide password" : "Show password"}>{shown ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } });

  return (
    <Box sx={{ minHeight: "calc(100dvh / var(--app-scale, 1))", display: "grid", placeItems: "center", p: 2.5, background: "linear-gradient(135deg, #e9f2fb 0%, #f8fafc 55%, #e7f1fc 100%)" }}>
      <Box sx={{ width: "100%", maxWidth: 1040, display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.15fr" }, borderRadius: 4, overflow: "hidden", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.14)" }}>
        <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", p: 5, color: "white", background: "linear-gradient(145deg, #123a70, #1769c2)" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>BIDC Safety Hub</Typography>
          <Box><VerifiedUserOutlined sx={{ fontSize: 52, opacity: 0.9 }} /><Typography variant="h3" sx={{ mt: 2, fontWeight: 900, lineHeight: 1.1 }}>Safer spaces start with clear records.</Typography><Typography sx={{ mt: 2, color: "rgba(255,255,255,.75)", lineHeight: 1.7 }}>One secure account for training, certifications, and lab access.</Typography></Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,.65)" }}>Secure account access</Typography>
        </Box>
        <Paper component="form" onSubmit={submit} elevation={0} square sx={{ p: { xs: 3, sm: 5 }, bgcolor: "rgba(255,255,255,.98)" }}>
          <Stack spacing={2.25}>
            <Box><Chip label={details.eyebrow} size="small" color="primary" variant="outlined" sx={{ mb: 2, fontWeight: 800 }} /><Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: "#111827", letterSpacing: -0.5 }}>{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.65 }}>{details.body}</Typography></Box>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {(mode === "login" || mode === "signup") && <TextField label="Your name" value={data.name} onChange={change("name")} required fullWidth autoFocus autoComplete="name" placeholder="Please enter your name" />}
            {mode !== "login" && mode !== "signup" && mode !== "reset" && <TextField label="Email address" type="email" value={data.email} onChange={change("email")} required fullWidth autoComplete="email" />}
            {needsPassword && <TextField label="New password" type={visible ? "text" : "password"} value={data.password} onChange={change("password")} required fullWidth autoComplete="new-password" slotProps={passwordAdornment(visible, () => setVisible((v) => !v))} />}
            {needsConfirmation && <><TextField label="Confirm password" type={confirmVisible ? "text" : "password"} value={data.confirmPassword} onChange={change("confirmPassword")} required fullWidth autoComplete="new-password" slotProps={passwordAdornment(confirmVisible, () => setConfirmVisible((v) => !v))} /><Box><LinearProgress variant="determinate" value={(strength + 1) * 20} color={strength >= 3 ? "success" : "primary"} sx={{ borderRadius: 99, height: 6 }} /><Typography variant="caption" color="text.secondary">Password strength: {data.password ? ["Very weak", "Weak", "Fair", "Strong", "Very strong"][strength] : "enter a password"}</Typography></Box></>}
            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.4, borderRadius: 2, textTransform: "none", fontWeight: 850, boxShadow: "none" }}>{submitting ? "Please wait…" : details.button}</Button>
            {mode === "login" && <Typography variant="body2" sx={{ textAlign: "center" }}>New here? <Link to="/signup">Create an account</Link></Typography>}
            {(mode === "email" || mode === "forgot") && <Typography variant="body2" sx={{ textAlign: "center" }}><Link to="/login">Back to login</Link></Typography>}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
