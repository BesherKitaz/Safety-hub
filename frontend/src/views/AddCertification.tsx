import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import {
  CheckCircle,
} from "@mui/icons-material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";


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
  eligibleLevel: 1 | 2 | 3 | null;
  isAuthorized: boolean;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isUserAgreementComplete?: boolean;
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

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
  message?: string;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
};

const initialCertificationData: CertificationData = {
  selectedStudentId: '',
  labId: '',
  trainingId: '',
  level: '',
  notes: '',
};

const recentLabStorageKey = () =>
  `safetyHub:lastCertificationLabId:${localStorage.getItem('userId') ?? 'anonymous'}`;

const getInitialCertificationData = (isEditMode: boolean): CertificationData => ({
  ...initialCertificationData,
  labId: isEditMode ? '' : localStorage.getItem(recentLabStorageKey()) ?? '',
});

const levels: Record<string, string> = {
  1: 'Basic',
  2: 'Trusted',
  3: 'Authorized',
};

const CertificationForm = () => {
  const permissions = currentResourcePermissions();
  const { certificationId } = useParams<{ certificationId?: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(certificationId);
  const prefilledStudentId = !isEditMode ? searchParams.get('studentId')?.trim() ?? '' : '';

  const [formData, setFormData] = useState<CertificationData>(() =>
    getInitialCertificationData(isEditMode)
  );
  const [labs, setLabs] = useState<Lab[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingCertification, setLoadingCertification] = useState(false);
  const [loadingRecipient, setLoadingRecipient] = useState(Boolean(prefilledStudentId));
  const [recipientAgreementComplete, setRecipientAgreementComplete] = useState<boolean | null>(null);
  const [changeReason, setChangeReason] = useState('');

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

  const handleTrainingChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      trainingId: event.target.value,
      level: '',
    }));
  };

  const goBack = () => {
    navigate(isEditMode && certificationId ? `/certifications/${certificationId}` : from);
  };

  const selectedTraining = trainings.find((training) => training.id === formData.trainingId);
  const eligibleLevels = Object.entries(levels).filter(([level]) => {
    if (level === '3' && !permissions.canIssueLevel3) {
      return false;
    }

    return isEditMode || Number(level) === selectedTraining?.eligibleLevel;
  });

  const fetchLabs = async () => {
    try {
      const response = await api.get('/api/labs/listings');
      const fetchedLabs: Lab[] = Array.isArray(response.data.data) ? response.data.data : [];
      setLabs(fetchedLabs);

      if (!isEditMode) {
        const recentLabId = localStorage.getItem(recentLabStorageKey());
        if (recentLabId && !fetchedLabs.some((lab) => lab.id === recentLabId)) {
          localStorage.removeItem(recentLabStorageKey());
          setFormData((current) =>
            current.labId === recentLabId ? { ...current, labId: '' } : current
          );
        }
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };


  const getTrainingStatus = (training: Training) => {
    if (training.isAuthorized) {
      return 1; // Completed
    }

    if (training.eligibleLevel !== null) {
      return 0; // Selectable
    }

    return 2; // Prerequisites missing
  };


  const fetchTrainings = async (labId: string, studentId?: string) => {
    if (!labId) {
      setTrainings([]);
      return;
    }

    try {
      const response = await api.get('/api/trainings', { params: { labId, studentId } });
        const sortedTrainings = [...response.data.data.trainings].sort((a, b) => {
          const statusDifference =
            getTrainingStatus(a) - getTrainingStatus(b);

          if (statusDifference !== 0) {
            return statusDifference;
          }

          return a.name.localeCompare(b.name);
        });
  
      setTrainings(Array.isArray(sortedTrainings) ? sortedTrainings : []);
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
      const users: Student[] = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.users ?? [];
      return users.filter((user) => user.id !== localStorage.getItem('userId'));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    if (!prefilledStudentId) {
      return;
    }

    let active = true;
    api.get(`/api/user/profile/${encodeURIComponent(prefilledStudentId)}`)
      .then((response) => {
        if (!active) return;
        const user = response.data.data as Student;
        setSelectedStudent(user);
        setRecipientAgreementComplete(user.isUserAgreementComplete === true);
        setFormData((current) => ({
          ...current,
          selectedStudentId: user.id,
        }));
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(getApiErrorMessage(error, 'Failed to load the selected certification recipient.'));
      })
      .finally(() => {
        if (active) setLoadingRecipient(false);
      });

    return () => {
      active = false;
    };
  }, [prefilledStudentId]);

  useEffect(() => {
    if (formData.labId) {
      fetchTrainings(formData.labId, formData.selectedStudentId);
    } else {
      setTrainings([]);
    }
  }, [formData.labId, formData.selectedStudentId]);

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
        setErrorMessage(getApiErrorMessage(error, 'Failed to load certification.'));
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
        await api.put(`/api/certifications/${certificationId}`, {
          ...submitData,
          reason: changeReason,
        });
      } else {
        await api.post('/api/certifications/add', submitData);
        localStorage.setItem(recentLabStorageKey(), formData.labId);
      }

      goBack();
    } catch (error) {
      console.error('Error saving certification:', error);
      setErrorMessage(getApiErrorMessage(error, 'Something went wrong while saving the certification.'));
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
              {isEditMode ? (
                <TextField
                  label="Student"
                  value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.email})` : ''}
                  fullWidth
                  disabled
                />
              ) : (
                prefilledStudentId ? (
                  <TextField
                    label="Certification recipient"
                    value={
                      loadingRecipient
                        ? 'Loading selected user…'
                        : selectedStudent
                          ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.email})`
                          : ''
                    }
                    fullWidth
                    disabled
                  />
                ) : (
                  <DropDownSearch<Student>
                    label="Search student"
                    fetchOptions={fetchUsers}
                    getOptionLabel={(student) => `${student.firstName} ${student.lastName} (${student.email})`}
                    onChange={(student) => {
                      setSelectedStudent(student);
                      setRecipientAgreementComplete(
                        student ? student.isUserAgreementComplete === true : null,
                      );
                      setFormData((current) => ({
                        ...current,
                        selectedStudentId: student?.id ?? '',
                      }));
                    }}
                  />
                )
              )}
              {!isEditMode && recipientAgreementComplete === false && (
                <Alert severity="warning">
                  This user must complete the user agreement before they can receive a certification.
                </Alert>
              )}
              <TextField select label="lab" value={formData.labId} onChange={handleChange('labId')} fullWidth required>
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
  fullWidth
  label="Training"
  value={formData.trainingId}
  onChange={handleTrainingChange}
>
  {[...trainings]
    .sort((a, b) => {
      const aSelectable =
        a.eligibleLevel !== null && !a.isAuthorized;

      const bSelectable =
        b.eligibleLevel !== null && !b.isAuthorized;

      if (aSelectable !== bSelectable) {
        return aSelectable ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    })
    .map((training) => {
      const isSelectable =
        training.eligibleLevel !== null &&
        !training.isAuthorized;

      let helperText = "";

      if (training.isAuthorized) {
        helperText = "Student has completed all levels.";
      } else if (training.eligibleLevel !== null) {
        helperText = `Eligible for Level ${training.eligibleLevel}`;
      } else {
        helperText = "Student has not met the prerequisites.";
      }

      return (
        <MenuItem
          key={training.id}
          value={training.id}
          disabled={!isSelectable}
          sx={{
            alignItems: "flex-start",
            py: 1.25,
            "&.Mui-disabled": {
              opacity: 0.7,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
            {training.isAuthorized ? (
              <VerifiedOutlinedIcon
                fontSize="small"
                color="success"
              />
            ) : isSelectable ? (
              <CheckCircle fontSize="small" color="success" />
            ) : (
              <LockOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>

          <ListItemText
            primary={training.name}
            secondary={helperText}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: isSelectable ? 600 : 400,
                },
              },
              secondary: {
                sx: {
                  whiteSpace: "normal",
                },
              },
            }}
          />
        </MenuItem>
      );
    })}
</TextField>

              <TextField
                select
                label="Level"
                value={formData.level}
                onChange={handleChange('level')}
                fullWidth
                required
                disabled={!isEditMode && !selectedTraining}
              >
                {eligibleLevels.map(([level, label]) => (
                  <MenuItem key={level} value={level}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>


              <TextField label="Notes" value={formData.notes} onChange={handleChange('notes')} fullWidth multiline minRows={4} />
              {isEditMode && (
                <TextField
                  label="Reason for change (optional)"
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  helperText="This reason is stored only in certification history, not on the certification record."
                />
              )}
            </Stack>

            {errorMessage && (
              <Typography variant="body1" color="error" sx={{ fontWeight: 'bold', mt: 2 }}>
                {errorMessage}
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loadingCertification || loadingRecipient || recipientAgreementComplete === false}
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
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default CertificationForm;
