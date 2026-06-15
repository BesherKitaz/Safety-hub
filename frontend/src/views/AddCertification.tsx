import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import GradientBox from "../components/ui/GradientBox";
import DropDownSearch from '../util/DropDownSearch'

import api from '../lib/api'

type CertificationData = {
  lab: string;
  notes: string;
};

const initialCertificationData: CertificationData = {
  lab: "",
  notes: "",
};

type LocationState = {
  from?: string;
};

type Lab = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const AddCertification = () => {
  const [formData, setFormData] = useState<CertificationData>(
    initialCertificationData
  );
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState | null)?.from ?? "/certifications";


  const handleChange =
    (field: keyof CertificationData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const goBack = () => {
    navigate(from);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudent) return;
    const sendData = async () => {
      try {
        const response = await api.post("/api/certifications/add", formData);
        console.log("Certification added successfully:", response.data.data);
      } catch (error) {
        console.error("Error adding certification:", error);
      }
    }
    sendData();
    goBack();
  };

  const fetchLabs = async () => {
    try {
      const response = await api.get("/api/labs");
      setLabs(response.data.data);
      console.log("Labs fetched successfully:", response.data.data);
    } catch (error) {
      console.error("Error fetching labs:", error);
    }
  };


  const fetchUsers = async (query: string): Promise<Student[]> => {
    try {
      const response = await api.get("/api/user/search", {
        params: { query }
      });
      console.log("Users fetched successfully:", response.data.data);
      return Array.isArray(response.data.data) ? response.data.data : response.data.users ?? [];;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };


  useEffect(() => {
    fetchLabs();
  }, [])
  return (
    <GradientBox sx={{ minHeight: "calc(100vh - 72px)", px: 0, py: 0 }}>
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 3, color: "text.secondary" }}
          >
            Certifications
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              lineHeight: 1.1,
            }}
          >
            Add Certification
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            Add a new certification to a user profile.
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
              Certification details
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Select the lab, level, and optional notes.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <DropDownSearch<Student>
                label="Search student"
                fetchOptions={fetchUsers}
                getOptionLabel={(student) =>
                  `${student.firstName} ${student.lastName} (${student.email})`
                }
                onChange={setSelectedStudent}
              />

              <TextField
                select
                label="lab"
                value={formData.lab}
                onChange={handleChange("lab")}
                fullWidth
                required
              >
              {labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
               {labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                {labs.map((lab) => (
                  <MenuItem key={lab.id} value={lab.name}>
                    {lab.name}
                  </MenuItem>
                ))}

              </TextField>



              <TextField
                label="Notes"
                value={formData.notes}
                onChange={handleChange("notes")}
                fullWidth
                multiline
                minRows={4}
              />
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                type="button"
                variant="contained"
                onClick={goBack}
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
                Add Certification
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default AddCertification;