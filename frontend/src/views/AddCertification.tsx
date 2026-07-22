import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';

import GradientBox from '../components/ui/GradientBox';
import DropDownSearch from '../util/DropDownSearch';
import api from '../lib/api';
import { currentResourcePermissions } from '../util/resourcePermissions';

type CertificationData = {
  selectedStudentId: string;
  labId: string;
  trainingId: string;
  notes: string;
  level: string;
};

type Lab = {
  id: string;
  name: string;
};

type Training = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CertificationDetailResponse = {
  id: string;
  notes?: string | null;
  level: number;
  issuedTo: Student;
  trainingNode: {
    id: string;
    name: string;
    lab: {
      id: string;
      name: string;
    } | null;
  };
};

type LocationState = {
  from?: string;
};

const initialCertificationData: CertificationData = {
  selectedStudentId: '',
  labId: '',
  trainingId: '',
  level: '',
  notes: '',
};

const levels: Record<string, string> = {
  1: 'Basic',
  2: 'Trusted',
  3: 'Authorized',
};

const CertificationForm = () => {
  const permissions = currentResourcePermissions();
  const { certificationId } = useParams<{ certificationId?: string }>();
  const isEditMode = Boolean(certificationId);

  const [formData, setFormData] = useState<CertificationData>(initialCertificationData);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingCertification, setLoadingCertification] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/certifications';

  const handleChange =
    (field: keyof CertificationData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const goBack = () => {
    navigate(isEditMode && certificationId ? `/certifications/${certificationId}` : from);
  };

  const fetchLabs = async () => {
    try {
      const response = await api.get('/api/labs/listings');
      setLabs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchTrainings = async (labId: string) => {
    if (!labId) {
      setTrainings([]);
      return;
    }

    try {
      const response = await api.get('/api/trainings', { params: { labId } });
      setTrainings(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      setTrainings([]);
    }
  };

  const fetchUsers = async (query: string): Promise<Student[]> => {
    try {
      const response = await api.get('/api/user/search', {
        params: { query },
      });
      return Array.isArray(response.data.data) ? response.data.data : response.data.users ?? [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    if (formData.labId) {
      fetchTrainings(formData.labId);
    } else {
      setTrainings([]);
    }
  }, [formData.labId]);

  useEffect(() => {
    const fetchCertification = async () => {
      if (!isEditMode || !certificationId) {
        return;
      }

      try {
        setLoadingCertification(true);
        const response = await api.get<{ data: CertificationDetailResponse }>(`/api/certifications/${certificationId}`);
        const certification = response.data.data;

        setFormData({
          selectedStudentId: certification.issuedTo.id,
          labId: certification.trainingNode.lab?.id ?? '',
          trainingId: certification.trainingNode.id,
          notes: certification.notes ?? '',
          level: String(certification.level),
        });
        setSelectedStudent(certification.issuedTo);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(error.response?.data?.message ?? 'Failed to load certification.');
        } else {
          setErrorMessage('Failed to load certification.');
        }
      } finally {
        setLoadingCertification(false);
      }
    };

    fetchCertification();
  }, [certificationId, isEditMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.labId || !formData.trainingId || !formData.level) {
      return;
    }

    if (!isEditMode && !formData.selectedStudentId) {
      return;
    }

    const submitData = {
      issuedToId: isEditMode ? selectedStudent?.id ?? formData.selectedStudentId : formData.selectedStudentId,
      trainingNodeId: formData.trainingId,
      notes: formData.notes,
      level: Number(formData.level),
    };

    try {
      if (isEditMode && certificationId) {
        await api.put(`/api/certifications/${certificationId}`, submitData);
      } else {
        await api.post('/api/certifications/add', submitData);
      }

      goBack();
    } catch (error) {
      console.error('Error saving certification:', error);

      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message ?? error.message);
      } else {
        setErrorMessage('Something went wrong while saving the certification.');
      }
    }
  };

  return (
    <GradientBox sx={{ minHeight: 'calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))', px: 0, py: 0 }}>
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ letterSpacing: 3, color: 'text.secondary' }}>
            Certifications
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.1 }}>
            {isEditMode ? 'Edit Certification' : 'Add Certification'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            {isEditMode ? 'Update the certification fields and save the revised record.' : 'Add a new certification to a user profile.'}
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={3}
          sx={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2.5, md: 3 },
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              Certification details
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Select the lab, level, and optional notes.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <TextField select label="lab" value={formData.labId} onChange={handleChange('labId')} fullWidth required>
                {labs && labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
                {labs && labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                {labs.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField select label="Training" value={formData.trainingId} onChange={handleChange('trainingId')} fullWidth required>
                {trainings.length > 0 && <MenuItem value="">Select a training</MenuItem>}
                {trainings.length === 0 && !formData.labId && <MenuItem value="">No lab selected</MenuItem>}
                {trainings.length === 0 && formData.labId && <MenuItem value="">No trainings found for this lab</MenuItem>}
                {trainings.map((training) => (
                  <MenuItem key={training.id} value={training.id}>
                    {training.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField select label="Level" value={formData.level} onChange={handleChange('level')} fullWidth required>
                {Object.entries(levels).filter(([level]) => level !== '3' || permissions.canIssueLevel3).map(([level, label]) => (
                  <MenuItem key={level} value={level}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              {isEditMode ? (
                <TextField
                  label="Student"
                  value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.email})` : ''}
                  fullWidth
                  disabled
                />
              ) : (
                <DropDownSearch<Student>
                  label="Search student"
                  fetchOptions={fetchUsers}
                  getOptionLabel={(student) => `${student.firstName} ${student.lastName} (${student.email})`}
                  onChange={(student) => {
                    setFormData((current) => ({
                      ...current,
                      selectedStudentId: student?.id ?? '',
                    }));
                  }}
                />
              )}

              <TextField label="Notes" value={formData.notes} onChange={handleChange('notes')} fullWidth multiline minRows={4} />
            </Stack>

            {errorMessage && (
              <Typography variant="body1" color="error" sx={{ fontWeight: 'bold', mt: 2 }}>
                {errorMessage}
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <Button
                type="button"
                variant="contained"
                onClick={goBack}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: '#dc2626',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#b91c1c',
                    boxShadow: 'none',
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={loadingCertification}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: '#2563eb',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#1d4ed8',
                    boxShadow: 'none',
                  },
                }}
              >
                {isEditMode ? 'Save Changes' : 'Certify'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default CertificationForm;
