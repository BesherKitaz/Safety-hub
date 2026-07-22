import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import GradientBox from "../components/ui/GradientBox";
import api from "../lib/api";

type Role = "ADMIN" | "STAFF" | "SUPERVISOR" | "MENTOR" | "STUDENT";
type ProfileData = {
  id: string; firstName: string; lastName: string; email: string; role: Role;
  graduationYear: number | null; jobTitle: string | null; department: string | null;
  phoneNumber: string | null; address: string | null; isActive: boolean; isUserAgreementComplete: boolean;
};
type EditProfileProps = { mode: "edit" | "create" };

const roles: Role[] = ["ADMIN", "STAFF", "SUPERVISOR", "MENTOR", "STUDENT"];
const staffRoles: Role[] = ["SUPERVISOR", "MENTOR", "STUDENT"];
const emptyProfile: ProfileData = { id: "", firstName: "", lastName: "", email: "", role: "STUDENT", graduationYear: null, jobTitle: null, department: null, phoneNumber: null, address: null, isActive: true, isUserAgreementComplete: false };
const apiError = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.error?.message ?? "Unable to update this profile." : "Unable to update this profile.";

const Section = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => <Box><Typography variant="h6" sx={{ fontWeight: 850 }}>{title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>{description}</Typography>{children}</Box>;

export default function EditProfile({ mode }: EditProfileProps) {
  const { id } = useParams<{ id: string }>();
  const actorId = localStorage.getItem("userId") ?? "";
  const actorRole = (localStorage.getItem("userRole") ?? "STUDENT") as Role;
  const targetId = id ?? actorId;
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [initial, setInitial] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !targetId) return;
    let active = true;
    api.get(`/api/user/profile/${targetId}`).then((response) => {
      if (!active) return;
      const loaded = { ...emptyProfile, ...response.data.data } as ProfileData;
      setProfile(loaded); setInitial(loaded);
    }).catch((requestError) => active && setError(apiError(requestError))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [mode, targetId]);

  const permissions = useMemo(() => {
    const self = actorId === profile.id;
    const staffTarget = actorRole === "STAFF" && !self && staffRoles.includes(profile.role);
    const agreement = actorRole === "ADMIN" || (actorRole === "STAFF" && (self || staffTarget)) || (!self && actorRole === "MENTOR" && ["MENTOR", "STUDENT"].includes(profile.role)) || (!self && actorRole === "SUPERVISOR" && ["SUPERVISOR", "MENTOR", "STUDENT"].includes(profile.role));
    return { self, basic: self || (actorRole === "ADMIN" && !self) || staffTarget, identity: actorRole === "ADMIN" && !self, role: !self && (actorRole === "ADMIN" || staffTarget), active: !self && (actorRole === "ADMIN" || staffTarget), agreement, roleOptions: actorRole === "ADMIN" ? roles : staffTarget ? staffRoles : [] };
  }, [actorId, actorRole, profile.id, profile.role]);

  const change = (field: keyof ProfileData) => (event: ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const changedPayload = () => {
    const allowed: (keyof ProfileData)[] = [];
    if (permissions.basic) allowed.push("graduationYear", "jobTitle", "department", "phoneNumber", "address");
    if (permissions.identity) allowed.push("firstName", "lastName", "email");
    if (permissions.role) allowed.push("role");
    if (permissions.agreement) allowed.push("isUserAgreementComplete");
    return Object.fromEntries(allowed.filter((field) => profile[field] !== initial[field]).map((field) => [field, field === "graduationYear" ? (profile[field] === null || profile[field] === ("" as never) ? null : Number(profile[field])) : profile[field]]));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setSuccess(null);
    const payload = changedPayload();
    if (!Object.keys(payload).length) { setSuccess("No profile changes to save."); return; }
    setSaving(true);
    try { const response = await api.put(`/api/user/profile/${targetId}`, payload); const updated = { ...profile, ...response.data.data }; setProfile(updated); setInitial(updated); setSuccess("Profile updated successfully."); }
    catch (requestError) { setError(apiError(requestError)); } finally { setSaving(false); }
  };

  const updateActiveStatus = async () => {
    setSaving(true); setError(null);
    try { const response = await api.put(`/api/user/profile/${targetId}`, { isActive: !profile.isActive }); const updated = { ...profile, ...response.data.data }; setProfile(updated); setInitial(updated); setSuccess(`User ${updated.isActive ? "reactivated" : "deactivated"} successfully.`); setConfirmOpen(false); }
    catch (requestError) { setError(apiError(requestError)); } finally { setSaving(false); }
  };

  if (loading) return <GradientBox><Typography sx={{ textAlign: "center", mt: 8 }}>Loading profile…</Typography></GradientBox>;
  if (mode === "create") return <GradientBox><Alert severity="info">New accounts must be created through the verified-email signup flow.</Alert></GradientBox>;

  return <GradientBox sx={{ px: 0, py: 0 }}><Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
    <Typography variant="overline" color="primary.main" sx={{ fontWeight: 850, letterSpacing: 2 }}>Account</Typography>
    <Typography component="h1" sx={{ fontSize: { xs: 36, md: 48 }, fontWeight: 900, color: "#111827", lineHeight: 1.1 }}>Edit profile</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Only fields you are authorized to change are shown.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
    <Paper component="form" onSubmit={save} elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid #dbe4ee", borderRadius: 4 }}>
      <Stack spacing={4} divider={<Divider flexItem />}>
        {permissions.identity && <Section title="Protected identity" description="Only administrators editing another user may change these fields."><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}><TextField label="First name" value={profile.firstName} onChange={change("firstName")} required /><TextField label="Last name" value={profile.lastName} onChange={change("lastName")} required /><TextField label="Email address" type="email" value={profile.email} onChange={change("email")} required sx={{ gridColumn: { md: "1 / -1" } }} /></Box></Section>}
        {permissions.basic && <Section title="Basic profile information" description="Contact, education, and organizational details."><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}><TextField label="Job title" value={profile.jobTitle ?? ""} onChange={change("jobTitle")} /><TextField label="Graduation year" type="number" value={profile.graduationYear ?? ""} onChange={change("graduationYear")} slotProps={{ htmlInput: { min: 1900, max: new Date().getFullYear() + 10 } }} /><TextField label="Department / college" value={profile.department ?? ""} onChange={change("department")} /><TextField label="Phone number" value={profile.phoneNumber ?? ""} onChange={change("phoneNumber")} /><TextField label="Address" value={profile.address ?? ""} onChange={change("address")} multiline minRows={2} sx={{ gridColumn: { md: "1 / -1" } }} /></Box></Section>}
        {(permissions.role || permissions.agreement) && <Section title="Administrative settings" description="Role and user-agreement controls allowed for this account."><Stack spacing={2}>{permissions.role && <TextField select label="Role" value={profile.role} onChange={change("role")} sx={{ maxWidth: 420 }}>{permissions.roleOptions.map((role) => <MenuItem key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</MenuItem>)}</TextField>}{permissions.agreement && <FormControlLabel control={<Switch checked={profile.isUserAgreementComplete} onChange={(_, checked) => setProfile((current) => ({ ...current, isUserAgreementComplete: checked }))} />} label="User agreement complete" />}</Stack></Section>}
        {permissions.active && <Section title="Account status" description="Deactivated users cannot log in. This action does not affect certification records."><Alert severity={profile.isActive ? "info" : "warning"} action={<Button color="inherit" onClick={() => profile.isActive ? setConfirmOpen(true) : void updateActiveStatus()} disabled={saving}>{profile.isActive ? "Deactivate user" : "Reactivate user"}</Button>}>This account is currently {profile.isActive ? "active" : "deactivated"}.</Alert></Section>}
        {!permissions.basic && !permissions.identity && !permissions.role && !permissions.agreement && !permissions.active && <Alert severity="warning">You do not have permission to edit this profile.</Alert>}
      </Stack>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} sx={{ mt: 4, justifyContent: "flex-end" }}><Button component={Link} to={`/user/${targetId}`} variant="outlined" disabled={saving}>Cancel</Button><Button type="submit" variant="contained" disabled={saving || (!permissions.basic && !permissions.identity && !permissions.role && !permissions.agreement)} sx={{ fontWeight: 800, boxShadow: "none" }}>{saving ? "Saving…" : "Save changes"}</Button></Stack>
    </Paper>
  </Box>
  <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}><DialogTitle>Deactivate this user?</DialogTitle><DialogContent><Typography color="text.secondary">{profile.firstName} {profile.lastName} will no longer be able to log in. Their profile and certifications will remain available.</Typography></DialogContent><DialogActions><Button onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button><Button color="error" variant="contained" onClick={updateActiveStatus} disabled={saving}>{saving ? "Deactivating…" : "Deactivate user"}</Button></DialogActions></Dialog>
  </GradientBox>;
}
