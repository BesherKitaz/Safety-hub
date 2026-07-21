import { Alert, Box, Paper, Skeleton, Typography } from "@mui/material";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";

type StatsData = {
  totalStudents: number;
  totalCertifications: number;
  totalMentors: number;
  certificationsThisMonth: number;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ error?: { message?: string }; message?: string }>(error)) {
    return error.response?.data?.error?.message ?? error.response?.data?.message ?? "Dashboard statistics could not be loaded.";
  }
  return "Dashboard statistics could not be loaded.";
};

export default function Stats() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get("/api/stats")
      .then((response) => mounted && setStatsData(response.data.data))
      .catch((requestError) => mounted && setError(getErrorMessage(requestError)));
    return () => { mounted = false; };
  }, []);

  const stats = [
    { label: "Students", value: statsData?.totalStudents, icon: PeopleOutlineIcon, accent: "#2563eb", background: "#eff6ff" },
    { label: "Mentors", value: statsData?.totalMentors, icon: PeopleOutlineIcon, accent: "#0f766e", background: "#ecfeff" },
    { label: "Total certifications", value: statsData?.totalCertifications, icon: WorkspacePremiumIcon, accent: "#b45309", background: "#fff7ed" },
    { label: "Issued this month", value: statsData?.certificationsThisMonth, icon: EventAvailableIcon, accent: "#7c3aed", background: "#f5f3ff" },
  ];

  return (
    <Box component="section" aria-labelledby="overview-heading">
      <Typography id="overview-heading" variant="h5" sx={{ fontWeight: 900, color: "#111827", mb: 2 }}>Overview</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        {stats.map(({ label, value, icon: Icon, accent, background }) => (
          <Paper key={label} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe4ee", bgcolor: "rgba(255,255,255,0.94)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 46, height: 46, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: background, color: accent, flexShrink: 0 }}><Icon /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
                {value === undefined ? <Skeleton width={55} height={40} /> : <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827", lineHeight: 1.15 }}>{value.toLocaleString()}</Typography>}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
