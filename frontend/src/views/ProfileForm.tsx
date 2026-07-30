import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import GradientBox from "../components/ui/GradientBox";
import api from "../lib/api";

type Role = "ADMIN" | "STAFF" | "SUPERVISOR" | "MENTOR" | "STUDENT";
type ProfileData = {
  id: string; firstName: string; lastName: string; email: string; role: Role;
  graduationYear: number | null; jobTitle: string | null; department: string | null;
  phoneNumber: string | null; address: string | null; isActive: boolean; isUserAgreementComplete: boolean;
  academicAffiliations: { collegeId: string; departmentId: string }[];
};
type DepartmentOption = { id: string; name: string; collegeId: string };
type CollegeOption = { id: string; name: string; departments: DepartmentOption[] };
type EditProfileProps = { mode: "edit" | "create" };

const roles: Role[] = ["ADMIN", "STAFF", "SUPERVISOR", "MENTOR", "STUDENT"];
const staffRoles: Role[] = ["SUPERVISOR", "MENTOR", "STUDENT"];
const emptyProfile: ProfileData = { id: "", firstName: "", lastName: "", email: "", role: "STUDENT", graduationYear: null, jobTitle: null, department: null, phoneNumber: null, address: null, isActive: true, isUserAgreementComplete: false, academicAffiliations: [] };
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
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !targetId) return;
    let active = true;
    api.get(`/api/user/profile/${targetId}`).then((response) => {
      if (!active) return;
      const loaded = { ...emptyProfile, ...response.data.data } as ProfileData;
      setProfile(loaded); setInitial(loaded);
      setSelectedCollegeIds([...new Set(loaded.academicAffiliations.map((entry) => entry.collegeId))]);
    }).catch((requestError) => active && setError(apiError(requestError))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [mode, targetId]);

  useEffect(() => {
    if (mode !== "edit") return;
    api.get("/api/academics/options")
      .then((response) => setColleges(Array.isArray(response.data.data) ? response.data.data : []))
      .catch(() => setError("College and department choices could not be loaded."));
  }, [mode]);

  const permissions = useMemo(() => {
    const self = actorId === profile.id;
    const staffTarget = actorRole === "STAFF" && !self && staffRoles.includes(profile.role);
    const identity = !self && (
      actorRole === "ADMIN"
      || ((actorRole === "STAFF" || actorRole === "SUPERVISOR") && (profile.role === "MENTOR" || profile.role === "STUDENT"))
    );
    return { self, basic: self || (actorRole === "ADMIN" && !self), identity, role: !self && (actorRole === "ADMIN" || staffTarget), active: !self && (actorRole === "ADMIN" || staffTarget), roleOptions: actorRole === "ADMIN" ? roles : staffTarget ? staffRoles : [] };
  }, [actorId, actorRole, profile.id, profile.role]);

  const change = (field: keyof ProfileData) => (event: ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const changedPayload = () => {
    const allowed: (keyof ProfileData)[] = [];
    if (permissions.basic) allowed.push("graduationYear", "jobTitle", "phoneNumber", "address", "academicAffiliations");
    if (permissions.identity) allowed.push("firstName", "lastName");
    if (permissions.role) allowed.push("role");
    return Object.fromEntries(allowed.filter((field) => JSON.stringify(profile[field]) !== JSON.stringify(initial[field])).map((field) => [field, field === "graduationYear" ? (profile[field] === null || profile[field] === ("" as never) ? null : Number(profile[field])) : profile[field]]));
  };

  const requestEmailChange = async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      await api.post("/api/user/email-change/request", { email: newEmail });
      setEmailChangeSent(true);
      setSuccess(`A verification link was sent to ${newEmail}. Your email will change only after you open it.`);
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const selectedDepartments = colleges.flatMap((college) => college.departments)
    .filter((department) => profile.academicAffiliations.some((entry) => entry.departmentId === department.id));
  const selectedColleges = colleges.filter((college) => selectedCollegeIds.includes(college.id));
  const departmentOptions = selectedColleges.flatMap((college) => college.departments);

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
        {permissions.identity && <Section title="Protected legal name" description="Legal names cannot be changed by the profile owner. Access depends on the editor’s role."><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}><TextField label="Legal first name" value={profile.firstName} onChange={change("firstName")} required /><TextField label="Legal last name" value={profile.lastName} onChange={change("lastName")} required /></Box></Section>}
        {permissions.self && <Section title="Email address" description="Only you can change your email. Every new address must be verified before it replaces the current one."><Stack spacing={2} sx={{ maxWidth: 600 }}><TextField label="Current email address" value={profile.email} slotProps={{ input: { readOnly: true } }} /><TextField label="New email address" type="email" value={newEmail} onChange={(event) => { setNewEmail(event.target.value); setEmailChangeSent(false); }} /><Button variant="outlined" onClick={requestEmailChange} disabled={saving || emailChangeSent || !newEmail.trim()} sx={{ alignSelf: "flex-start" }}>Send verification link</Button></Stack></Section>}
        {permissions.basic && <Section title="Basic profile information" description="Contact, education, and organizational details."><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}><TextField label="Job title" value={profile.jobTitle ?? ""} onChange={change("jobTitle")} /><TextField label="Graduation year" type="number" value={profile.graduationYear ?? ""} onChange={change("graduationYear")} slotProps={{ htmlInput: { min: 1900, max: new Date().getFullYear() + 10 } }} /><Autocomplete multiple options={colleges} value={selectedColleges} getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id} onChange={(_event, value) => { const ids = value.map((college) => college.id); setSelectedCollegeIds(ids); setProfile((current) => ({ ...current, academicAffiliations: current.academicAffiliations.filter((entry) => ids.includes(entry.collegeId)) })); }} renderInput={(params) => <TextField {...params} label="College or school" helperText="Select every college or school associated with this user." />} /><Autocomplete multiple options={departmentOptions} value={selectedDepartments} disabled={!selectedColleges.length} getOptionLabel={(option) => `${option.name} — ${colleges.find((college) => college.id === option.collegeId)?.name ?? ""}`} isOptionEqualToValue={(option, value) => option.id === value.id} onChange={(_event, value) => setProfile((current) => ({ ...current, academicAffiliations: value.map((department) => ({ collegeId: department.collegeId, departmentId: department.id })) }))} renderInput={(params) => <TextField {...params} label="Department" helperText={selectedColleges.length ? "Select departments from the chosen colleges or schools." : "Select a college or school first."} />} /><TextField label="Phone number" value={profile.phoneNumber ?? ""} onChange={change("phoneNumber")} /><TextField label="Address" value={profile.address ?? ""} onChange={change("address")} multiline minRows={2} sx={{ gridColumn: { md: "1 / -1" } }} /></Box></Section>}
        {permissions.role && <Section title="Administrative settings" description="Role controls allowed for this account."><Stack spacing={2}><TextField select label="Role" value={profile.role} onChange={change("role")} disabled={!profile.isUserAgreementComplete} helperText={profile.isUserAgreementComplete ? "The selected role takes effect when changes are saved." : "This user must complete the user agreement before their role can be changed."} sx={{ maxWidth: 420 }}>{permissions.roleOptions.map((role) => <MenuItem key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</MenuItem>)}</TextField></Stack></Section>}
        {permissions.active && <Section title="Account status" description="Deactivated users cannot log in. This action does not affect certification records."><Alert severity={profile.isActive ? "info" : "warning"} action={<Button color="inherit" onClick={() => profile.isActive ? setConfirmOpen(true) : void updateActiveStatus()} disabled={saving}>{profile.isActive ? "Deactivate user" : "Reactivate user"}</Button>}>This account is currently {profile.isActive ? "active" : "deactivated"}.</Alert></Section>}
        {!permissions.basic && !permissions.identity && !permissions.role && !permissions.active && <Alert severity="warning">You do not have permission to edit this profile.</Alert>}
      </Stack>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} sx={{ mt: 4, justifyContent: "flex-end" }}><Button component={Link} to={`/user/${targetId}`} variant="outlined" disabled={saving}>Cancel</Button><Button type="submit" variant="contained" disabled={saving || (!permissions.basic && !permissions.identity && !permissions.role)} sx={{ fontWeight: 800, boxShadow: "none" }}>{saving ? "Saving…" : "Save changes"}</Button></Stack>
    </Paper>
  </Box>
  <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}><DialogTitle>Deactivate this user?</DialogTitle><DialogContent><Typography color="text.secondary">{profile.firstName} {profile.lastName} will no longer be able to log in. Their profile and certifications will remain available.</Typography></DialogContent><DialogActions><Button onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button><Button color="error" variant="contained" onClick={updateActiveStatus} disabled={saving}>{saving ? "Deactivating…" : "Deactivate user"}</Button></DialogActions></Dialog>
  </GradientBox>;
}
