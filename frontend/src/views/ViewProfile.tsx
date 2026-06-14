import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import GradientBox from "../components/ui/GradientBox.js";
import api from "../lib/api.js";

type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

const fieldStyles = {
  p: 2,
  borderRadius: 2.5,
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/user/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fullName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim()
    : "Your profile";

  const initial =
    userData?.firstName?.charAt(0) || userData?.email?.charAt(0) || "U";

  return (
    <GradientBox sx={{ minHeight: "calc(100vh - 72px)", px: 0, py: 0 }}>
      <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 3, color: "text.secondary" }}
          >
            Account
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              lineHeight: 1.1,
            }}
          >
            Profile
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            Review your account details and keep your profile information in one
            tidy place.
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2.5, md: 3 },
              borderBottom: "1px solid #e5e7eb",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  Account overview
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Your public-facing details and contact information.
                </Typography>
              </Box>

              <Chip
                label={userData?.role || "Member"}
                sx={{
                  fontWeight: 700,
                  bgcolor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(260px, 320px) minmax(0, 1fr)",
              },
            }}
          >
            <Box
              sx={{
                p: { xs: 2, md: 3 },
                borderRight: { md: "1px solid #e5e7eb" },
                backgroundColor: "#fbfdff",
              }}
            >
              <Stack spacing={2.25} alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: "#e5eefc",
                    color: "#1d4ed8",
                    fontSize: 34,
                    fontWeight: 700,
                    border: "1px solid #dbe4f3",
                  }}
                >
                  {initial}
                </Avatar>

                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
                    {fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {userData?.email || "email@example.com"}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.1,
                    boxShadow: "none",
                    maxWidth: 220,
                  }}
                  onClick={() => navigate("/profile/edit")}
                >
                  Edit profile
                </Button>

                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Profile editing can be enabled later without changing this layout.
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                Profile details
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                These values are read directly from your account.
              </Typography>

              <Divider sx={{ my: 2.5 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Box sx={fieldStyles}>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.5 }}
                  >
                    First name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {userData?.firstName || "-"}
                  </Typography>
                </Box>

                <Box sx={fieldStyles}>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.5 }}
                  >
                    Last name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {userData?.lastName || "-"}
                  </Typography>
                </Box>

                <Box sx={fieldStyles}>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.5 }}
                  >
                    Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {userData?.email || "-"}
                  </Typography>
                </Box>

                <Box sx={fieldStyles}>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.5 }}
                  >
                    Role
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {userData?.role || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default Profile;
