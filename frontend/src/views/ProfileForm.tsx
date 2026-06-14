import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GradientBox from "../components/ui/GradientBox.js";

type EditProfileProps = {
  mode: "edit" | "create";
};

type ProfileData = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  phoneNumber: string;
  purdueId: string;
  departmentCollege: string;
  graduationYear: string;
};

const initialProfileData: ProfileData = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  phoneNumber: "",
  purdueId: "",
  departmentCollege: "",
  graduationYear: "",
};

const EditProfile = ({ mode }: EditProfileProps) => {
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const navigate = useNavigate();

  const handleChange =
    (field: keyof ProfileData) => (event: ChangeEvent<HTMLInputElement>) => {
      setProfileData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const goToProfileDetails = () => {
    navigate("/profile");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToProfileDetails();
  };

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
            {mode === "edit" ? "Edit Profile" : "Create Profile"}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            {mode === "edit"
              ? "Update your profile information and manage your account settings."
              : "Create a new profile and manage your account settings."}
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={3}
          sx={{
            width: "100%",
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
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
              Profile details
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Use the fields below to update your account profile.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <TextField
                label="First Name"
                value={profileData.firstName}
                onChange={handleChange("firstName")}
                fullWidth
                required
              />

              <TextField
                label="Last Name"
                value={profileData.lastName}
                onChange={handleChange("lastName")}
                fullWidth
                required
              />

              <TextField
                label="Job Title"
                value={profileData.jobTitle}
                onChange={handleChange("jobTitle")}
                fullWidth
                required
              />

              <TextField
                label="Phone Number"
                type="tel"
                value={profileData.phoneNumber}
                onChange={handleChange("phoneNumber")}
                fullWidth
                required
              />

              <TextField
                label="Purdue ID"
                value={profileData.purdueId}
                onChange={handleChange("purdueId")}
                fullWidth
                required
              />

              <TextField
                label="Graduation Year"
                value={profileData.graduationYear}
                onChange={handleChange("graduationYear")}
                fullWidth
                required
              />

              <TextField
                label="Department/College"
                value={profileData.departmentCollege}
                onChange={handleChange("departmentCollege")}
                fullWidth
                required
                sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
              />

            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                type="button"
                variant="contained"
                onClick={goToProfileDetails}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: "#dc2626",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#b91c1c",
                    boxShadow: "none",
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: "#2563eb",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#1d4ed8",
                    boxShadow: "none",
                  },
                }}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default EditProfile;
