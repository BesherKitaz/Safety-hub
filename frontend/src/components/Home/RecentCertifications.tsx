import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

type CertificationType = {
  id: string;
  level: string | number;
  issuedAt: string;
  trainingNode: { id: string; name: string; lab: { id: string; name: string } };
  issuedTo: { id: string; firstName: string; lastName: string; email: string };
};

const levelLabel = (level: string | number) => {
  const value = String(level).replace("LEVEL_", "");
  return `Level ${value}`;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ error?: { message?: string }; message?: string }>(error)) {
    return error.response?.data?.error?.message ?? error.response?.data?.message ?? "Recent certifications could not be loaded.";
  }
  return "Recent certifications could not be loaded.";
};

export default function RecentCertifications() {
  const [items, setItems] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const fetchRecent = async () => {
      try {
        const response = await api.get("/api/certifications/recent");
        if (mounted) { setItems(response.data.data ?? []); setError(null); }
      } catch (requestError) {
        if (mounted) setError(getErrorMessage(requestError));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRecent();
    const interval = window.setInterval(fetchRecent, 300000);
    window.addEventListener("focus", fetchRecent);
    return () => { mounted = false; window.clearInterval(interval); window.removeEventListener("focus", fetchRecent); };
  }, []);

  return (
    <Box component="section" aria-labelledby="recent-heading">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: "end" }, justifyContent: "space-between" }}>
        <Box>
          <Typography id="recent-heading" variant="h5" sx={{ fontWeight: 900, color: "#111827" }}>Recent certifications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>The latest certification activity across all labs.</Typography>
        </Box>
        <Button component={RouterLink} to="/certifications" endIcon={<ArrowForwardIcon />} sx={{ textTransform: "none", fontWeight: 800, alignSelf: { xs: "flex-start", sm: "auto" } }}>View all</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 3, overflow: "hidden", bgcolor: "rgba(255,255,255,0.96)" }}>
        {loading ? (
          <Stack spacing={1} sx={{ p: 2.5 }}><Skeleton height={54} /><Skeleton height={54} /><Skeleton height={54} /></Stack>
        ) : items.length === 0 ? (
          <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
            <WorkspacePremiumOutlinedIcon sx={{ fontSize: 42, color: "text.disabled" }} />
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 800 }}>No certifications yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Newly issued certifications will appear here.</Typography>
          </Box>
        ) : items.map((certification, index) => (
          <Box
            component="button"
            type="button"
            key={certification.id}
            onClick={() => navigate(`/certifications/${certification.id}`, { state: { from: location.pathname } })}
            sx={{
              width: "100%", display: "grid", gridTemplateColumns: { xs: "1fr auto", md: "1.3fr 1fr auto auto" }, gap: { xs: 1, md: 2 },
              alignItems: "center", textAlign: "left", p: 2.25, border: 0, borderBottom: index === items.length - 1 ? 0 : "1px solid #e5e7eb",
              bgcolor: "transparent", cursor: "pointer", font: "inherit", color: "inherit", "&:hover": { bgcolor: "#f8fbff" }, "&:focus-visible": { outline: "2px solid #2563eb", outlineOffset: -2 },
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 850, color: "#111827" }}>{certification.issuedTo.firstName} {certification.issuedTo.lastName}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{certification.issuedTo.email}</Typography>
            </Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: 750 }}>{certification.trainingNode.name}</Typography>
              <Typography variant="caption" color="text.secondary">{certification.trainingNode.lab.name}</Typography>
            </Box>
            <Chip label={levelLabel(certification.level)} size="small" sx={{ fontWeight: 750, bgcolor: "#eaf3ff", color: "#1d4ed8" }} />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, minWidth: 100, textAlign: "right" }}>{new Date(certification.issuedAt).toLocaleDateString()}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
