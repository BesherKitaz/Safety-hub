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
} from "@mui/material";
import GradientBox from "../components/ui/GradientBox";
import DropDownSearch from '../util/DropDownSearch'
import axios from "axios";

import api from '../lib/api'

type CertificationData = {
  selectedStudentId: string;
  labId: string;
  trainingId: string;
  notes: string;
  level: string;
};

const initialCertificationData: CertificationData = {
  selectedStudentId: "",
  labId: "",
  trainingId: "",
  level: "",
  notes: "",
};

type LocationState = {
  from?: string;
};

type Training = {
  id: string;
  name: string;
}
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


const levels = {
  1: "Basic",
  2: "Trusted",
  3: "Authorized"
}

// Component for adding a new certification
const AddCertification = () => {

  // Main form data states (except for the selected users/students)
  const [formData, setFormData] = useState<CertificationData>(
    initialCertificationData
  );
  // State for the list of available labs and trainings (fetched from the backend)
  const [labs, setLabs] = useState<Lab[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Helper to get the navigation source or to /certifications if no souce is found
  const from = (location.state as LocationState | null)?.from ?? "/certifications";


  // Generic handler for form input changes (takes an input field name and event and returns the function for the specific field)
  const handleChange =
    (field: keyof CertificationData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  
  // Chrystal clear
  const goBack = () => {
    navigate(from);
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.selectedStudentId) return;
    if (!formData.labId) return;
    if (!formData.trainingId) return;

    // Send the certification data to the backend
    const sendData = async () => {
      // Get the users data into the rest of the form data together
      const submitData = {
        issuedToId: formData.selectedStudentId,
        trainingNodeId: formData.trainingId,
        notes: formData.notes,
        level: formData.level,
      }
      try {
        await api.post("/api/certifications/add", submitData);
        goBack();
      } catch (error) {
        console.error("Error adding certification:", error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            setErrorMessage(error.response.data?.message ?? "Conflict error.");
          } else {
            setErrorMessage(
              error.response?.data?.message ?? "Something went wrong. Please try again."
            );
          }
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
      }
    }
    await sendData();
    
  };

  // Fetch us the labs
  const fetchLabs = async () => {
    try {
      const response = await api.get("/api/labs");
      setLabs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching labs:", error);
    }
  };

  // Fetch us the trainings
  const fetchTrainings = async () => {
    if (!formData.labId) {
      setTrainings([]);
      return;
    }
    
    try {
      const response = await api.get("/api/trainings", { params: { labId: formData.labId } });
      console.log("training response:", response.data.data);
      setTrainings(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching trainings:", error);
    }
  };



  // Fetch users based on search query
  const fetchUsers = async (query: string): Promise<Student[]> => {
    try {
      const response = await api.get("/api/user/search", {
        params: { query }
      });
      return Array.isArray(response.data.data) ? response.data.data : response.data.users ?? [];;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  

  // We only have a few labs, so we can fetch them once on component mount
  useEffect(() => {
    fetchLabs();
  }, [])

  useEffect(() => {
    if (formData.labId) {
      fetchTrainings();
    } else {
      setFormData((prev) => ({
        ...prev,
        trainingId: "",
      }));
      setTrainings([]);
    }

  }, [formData.labId])


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

              <TextField
                select
                label="lab"
                value={formData.labId}
                onChange={handleChange("labId")}
                fullWidth
                required
              >
              {labs && labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
               {labs && labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                {labs.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.name}
                  </MenuItem>
                ))}

              </TextField>

              <TextField
                select 
                label="Training"
                value={formData.trainingId}
                onChange={handleChange("trainingId")}
                fullWidth
                required
              >
              {trainings.length > 0 && <MenuItem value="">Select a training</MenuItem>}
              {trainings.length === 0 && !formData.labId && <MenuItem value="">No lab selected</MenuItem>}
              {trainings.length === 0 && formData.labId && <MenuItem value="">No traings found for this lab</MenuItem>}

                {trainings.map((training) => (
                  <MenuItem key={training.id} value={training.id}>
                    {training.name}
                  </MenuItem>
                ))}

              </TextField>
              <TextField
                select 
                label="Level"
                value={formData.level}
                onChange={handleChange("level")}
                fullWidth
                required
              >

                {(() => {
                  const items = [];
                  for (let i = 1; i <= 3; i++) {
                    items.push(
                      <MenuItem key={i} value={i}>
                        {levels[i]}
                      </MenuItem>
                    );
                  }
                  return items;
                })()}

              </TextField>

              <DropDownSearch<Student>
                label="Search student"
                fetchOptions={fetchUsers}
                getOptionLabel={(student) =>
                  `${student.firstName} ${student.lastName} (${student.email})`
                }
                onChange={(student) => {
                  setFormData((current) => ({
                    ...current,
                    selectedStudentId: student?.id ?? "",
                  }));
                }}
              />

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={handleChange("notes")}
                fullWidth
                multiline
                minRows={4}
              />
            </Stack>
              {errorMessage && (
                <Typography variant="body2" color="error">
                  {errorMessage}
                </Typography>
              )}
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