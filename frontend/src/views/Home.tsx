import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Landing from "../components/Home/Landing";
import Stats from "../components/Home/Stats";
import RecentCertifications from "../components/Home/RecentCertifications";
import SearchBox from "../components/ui/SearchBox";
import GradientBox from "../components/ui/GradientBox";
import api from "../lib/api";
import { isLoggedIn } from "../util/isLoggedIn";

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ error?: { message?: string }; message?: string }>(error)) {
    return error.response?.data?.error?.message ?? error.response?.data?.message ?? "Your profile details could not be loaded.";
  }
  return "Your profile details could not be loaded.";
};

const Home = () => {
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login", { replace: true }); return; }
    let mounted = true;
    api.get("/api/user/name")
      .then((response) => mounted && setUserFirstName(response.data.data.firstName))
      .catch((error) => mounted && setProfileError(getErrorMessage(error)));
    return () => { mounted = false; };
  }, [navigate]);

  const searchCertifications = (query: string) => {
    navigate(query ? `/certifications?search=${encodeURIComponent(query)}` : "/certifications");
  };

  return (
    <GradientBox sx={{ p: 0 }}>
      <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        {profileError && <Alert severity="error" sx={{ mb: 3 }}>{profileError}</Alert>}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, mb: 4, borderRadius: 4, color: "white", background: "linear-gradient(125deg, #123a70 0%, #1769c2 62%, #2788dc 100%)", overflow: "hidden", position: "relative" }}>
          <Box sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", right: -80, top: -170, bgcolor: "rgba(255,255,255,0.08)" }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ position: "relative", alignItems: { md: "center" }, justifyContent: "space-between" }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.78, fontWeight: 800, letterSpacing: 1.5 }}>Safety Hub dashboard</Typography>
              <Typography component="h1" sx={{ mt: 0.5, fontSize: { xs: 34, md: 48 }, fontWeight: 900, letterSpacing: -1, lineHeight: 1.08 }}>
                {userFirstName ? `Welcome back, ${userFirstName}` : "Welcome back"}
              </Typography>
              <Typography sx={{ mt: 1.25, maxWidth: 640, color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>
                Review recent activity, find a certification, or start a common safety-management task.
              </Typography>
            </Box>
            <Button component={RouterLink} to="/certifications/add" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0, bgcolor: "white", color: "#1559a6", textTransform: "none", fontWeight: 850, borderRadius: 2.5, px: 2.5, boxShadow: "none", "&:hover": { bgcolor: "#f3f7fc", boxShadow: "none" } }}>
              Issue certification
            </Button>
          </Stack>
          <Box sx={{ mt: 3, maxWidth: 760 }}>
            <SearchBox placeholder="Search by student email, name, training, or lab" buttonLabel="Find" onSearch={searchCertifications} />
            <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, alignItems: "center", color: "rgba(255,255,255,0.72)" }}><SearchIcon fontSize="small" /><Typography variant="caption">Search opens the full certification list with your query applied.</Typography></Stack>
          </Box>
        </Paper>

        <Stack spacing={4}>
          <Stats />
          <Landing />
          <RecentCertifications />
        </Stack>
      </Box>
    </GradientBox>
  );
};

export default Home;
