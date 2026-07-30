import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Alert, Autocomplete, Box, Button, Chip, IconButton, InputAdornment, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { Visibility, VisibilityOff, VerifiedUserOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import api from "../lib/api";
const passwordScore = (password: string) => [password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;

type DepartmentOption = { id: string; name: string; collegeId: string };
type CollegeOption = { id: string; name: string; departments: DepartmentOption[] };
export type AuthFormData = {
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
  login: { eyebrow: "Welcome back", title: "Log in to Safety Hub", body: "Use your account to manage certifications, members, and labs.", button: "Log in" },
  signup: { eyebrow: "Email verified", title: "Finish creating your account", body: "Add your name and choose a secure password.", button: "Create account" },
  email: { eyebrow: "New account", title: "Verify your email", body: "We’ll email you a secure link before you create your account.", button: "Send verification link" },
  forgot: { eyebrow: "Account recovery", title: "Reset your password", body: "Enter your account email and we’ll send a secure reset link.", button: "Send reset link" },
  reset: { eyebrow: "Secure reset", title: "Choose a new password", body: "Use at least 12 characters and avoid common words.", button: "Update password" },
};

export default function AuthForm({ mode, onSubmit, signupEmail }: AuthFormProps) {
  const [data, setData] = useState<AuthFormData>({ firstName: "", lastName: "", email: signupEmail ?? "", password: "", confirmPassword: "" });
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<CollegeOption[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentOption[]>([]);
  const [loadingAcademics, setLoadingAcademics] = useState(mode === "signup");
  const needsPassword = mode === "login" || mode === "signup" || mode === "reset";
  const needsConfirmation = mode === "signup" || mode === "reset";
  const strength = needsConfirmation && data.password ? passwordScore(data.password) : 0;
  const details = copy[mode];
  const departmentOptions = selectedColleges.flatMap((college) => college.departments);

  useEffect(() => {
    if (mode !== "signup") return;
    let active = true;
    api.get("/api/academics/options")
      .then((response) => {
        if (active) setColleges(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch(() => {
        if (active) setError("College and department choices could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoadingAcademics(false);
      });
    return () => { active = false; };
  }, [mode]);

  const change = (key: keyof AuthFormData) => (event: ChangeEvent<HTMLInputElement>) => setData((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (needsConfirmation && data.password !== data.confirmPassword) { setError("Passwords must match."); return; }
    if (needsConfirmation && (data.password.length < 12 || strength < 3)) { setError("Choose a stronger password with at least 12 characters."); return; }
    if (mode === "signup" && (selectedColleges.length === 0 || selectedDepartments.length === 0)) {
      setError("Select at least one college or school and one department.");
      return;
    }
    setSubmitting(true);
    const academicAffiliations = selectedDepartments.map((department) => ({
      collegeId: department.collegeId,
      departmentId: department.id,
    }));
    try {
      await onSubmit(mode === "signup" ? { ...data, academicAffiliations } : data);
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
            {mode === "signup" && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField label="Legal first name" value={data.firstName} onChange={change("firstName")} required fullWidth autoComplete="given-name" /><TextField label="Legal last name" value={data.lastName} onChange={change("lastName")} required fullWidth autoComplete="family-name" /></Stack>}
            {mode === "signup" ? <TextField label="Verified email" value={signupEmail ?? ""} fullWidth slotProps={{ input: { readOnly: true } }} helperText="Verified through your email link." /> : mode !== "reset" && <TextField label="Email address" type="email" value={data.email} onChange={change("email")} required fullWidth autoComplete="email" />}
            {mode === "signup" && (
              <>
                <Autocomplete
                  multiple
                  options={colleges}
                  value={selectedColleges}
                  loading={loadingAcademics}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_event, value) => {
                    const collegeIds = new Set(value.map((college) => college.id));
                    setSelectedColleges(value);
                    setSelectedDepartments((current) =>
                      current.filter((department) => collegeIds.has(department.collegeId)),
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="College or school"
                      required={selectedColleges.length === 0}
                      helperText="Search and select every college or school associated with your programs."
                    />
                  )}
                />
                <Autocomplete
                  multiple
                  options={departmentOptions}
                  value={selectedDepartments}
                  disabled={selectedColleges.length === 0}
                  getOptionLabel={(option) => {
                    const collegeName = colleges.find((college) => college.id === option.collegeId)?.name;
                    return collegeName ? `${option.name} — ${collegeName}` : option.name;
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_event, value) => setSelectedDepartments(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department"
                      required={selectedDepartments.length === 0}
                      helperText={
                        selectedColleges.length
                          ? "Search departments from all selected colleges or schools."
                          : "Select at least one college or school first."
                      }
                    />
                  )}
                />
              </>
            )}
            {needsPassword && <TextField label={mode === "reset" ? "New password" : "Password"} type={visible ? "text" : "password"} value={data.password} onChange={change("password")} required fullWidth autoComplete={mode === "login" ? "current-password" : "new-password"} slotProps={passwordAdornment(visible, () => setVisible((v) => !v))} />}
            {needsConfirmation && <><TextField label="Confirm password" type={confirmVisible ? "text" : "password"} value={data.confirmPassword} onChange={change("confirmPassword")} required fullWidth autoComplete="new-password" slotProps={passwordAdornment(confirmVisible, () => setConfirmVisible((v) => !v))} /><Box><LinearProgress variant="determinate" value={(strength + 1) * 20} color={strength >= 3 ? "success" : "primary"} sx={{ borderRadius: 99, height: 6 }} /><Typography variant="caption" color="text.secondary">Password strength: {data.password ? ["Very weak", "Weak", "Fair", "Strong", "Very strong"][strength] : "enter a password"}</Typography></Box></>}
            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.4, borderRadius: 2, textTransform: "none", fontWeight: 850, boxShadow: "none" }}>{submitting ? "Please wait…" : details.button}</Button>
            {mode === "login" && <Stack direction="row" sx={{ justifyContent: "space-between" }}><Link to="/email">Create account</Link><Link to="/forgot-password">Forgot password?</Link></Stack>}
            {(mode === "email" || mode === "forgot") && <Typography variant="body2" sx={{ textAlign: "center" }}><Link to="/login">Back to login</Link></Typography>}
            {(mode === "signup" || mode === "reset") && <Typography variant="body2" sx={{ textAlign: "center" }}>Already have access? <Link to="/login">Log in</Link></Typography>}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
