import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  CalendarMonthOutlined,
  CheckCircleRounded,
  DescriptionOutlined,
  EditOutlined,
  HistoryRounded,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';

import api from '../lib/api.js';
import GradientBox from '../components/ui/GradientBox';

type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

type LabSummary = {
  id: string;
  name: string;
};

type ToolSummary = {
  id: string;
  name: string;
};

type TrainingSummary = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  lab: LabSummary | null;
  tool: ToolSummary | null;
};

type CertificationDetail = {
  id: string;
  notes?: string | null;
  status: string;
  level: number;
  expiryDate?: string | null;
  issuedAt: string;
  trainingNode: TrainingSummary;
  issuedTo: UserSummary;
  issuedBy: UserSummary;
};

type FieldCardProps = {
  label: string;
  value: ReactNode;
  helper?: string;
};

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatName = (person: UserSummary) => `${person.firstName} ${person.lastName}`;

const getStatusStyles = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return {
        label: 'Active',
        color: '#047857',
        bg: alpha('#059669', 0.12),
        border: alpha('#059669', 0.25),
      };
    case 'REVOKED':
      return {
        label: 'Revoked',
        color: '#b91c1c',
        bg: alpha('#dc2626', 0.12),
        border: alpha('#dc2626', 0.25),
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        color: '#b45309',
        bg: alpha('#f59e0b', 0.12),
        border: alpha('#f59e0b', 0.25),
      };
    case 'DEACTIVATED':
      return {
        label: 'Deactivated',
        color: '#475569',
        bg: alpha('#64748b', 0.12),
        border: alpha('#64748b', 0.25),
      };
    default:
      return {
        label: status,
        color: '#1d4ed8',
        bg: alpha('#2563eb', 0.12),
        border: alpha('#2563eb', 0.25),
      };
  }
};

const FieldCard = ({ label, value, helper }: FieldCardProps) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 3,
      border: '1px solid',
      borderColor: alpha('#2563EB', 0.12),
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 1.15,
        color: 'text.secondary',
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: 1 }}>{value}</Box>
    {helper && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
        {helper}
      </Typography>
    )}
  </Box>
);

const SectionHeader = ({ eyebrow, title, description, accent = '#2563EB' }: SectionHeaderProps) => (
  <Stack spacing={0.75}>
    <Typography
      variant="overline"
      sx={{
        color: accent,
        fontWeight: 800,
        letterSpacing: 1.8,
        lineHeight: 1,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography component="h2" sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, lineHeight: 1.1 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {description}
      </Typography>
    )}
  </Stack>
);

const CertificationView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [certification, setCertification] = useState<CertificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertification = async () => {
      if (!id) {
        setError('Certification ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/certifications/${id}`);
        setCertification(response.data.data);
        setError(null);
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setError('Certification not found.');
        } else {
          setError('Failed to load certification details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCertification();
  }, [id]);

  if (loading) {
    return (
      <GradientBox>
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Loading certification...
          </Typography>
        </Box>
      </GradientBox>
    );
  }

  if (error || !certification) {
    return (
      <GradientBox>
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 560,
              width: '100%',
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#2563EB', 0.12),
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              {error ?? 'Certification not found.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
              The certification record could not be loaded.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/certifications')}>
              Back to certifications
            </Button>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  const statusStyle = getStatusStyles(certification.status);
  const training = certification.trainingNode;
  const hasLab = Boolean(training.lab);
  const hasTool = Boolean(training.tool);

  return (
    <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ maxWidth: 1320, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 5,
            border: '1px solid',
            borderColor: alpha('#2563EB', 0.12),
            background:
              'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0.96) 46%, rgba(15,118,110,0.10) 100%)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -40,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <Stack spacing={2.5} sx={{ position: 'relative' }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircleRounded fontSize="small" />}
                label={statusStyle.label}
                sx={{
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                  border: '1px solid',
                  borderColor: statusStyle.border,
                  fontWeight: 700,
                }}
              />
              <Chip
                icon={<WorkspacePremiumOutlined fontSize="small" />}
                label={`Level ${certification.level}`}
                variant="outlined"
              />
              <Chip icon={<CalendarMonthOutlined fontSize="small" />} label={`Issued ${formatDateTime(certification.issuedAt)}`} variant="outlined" />
            </Stack>

            <Box sx={{ maxWidth: 920 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 32, sm: 40, md: 52 },
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -1,
                  color: 'text.primary',
                }}
              >
                {training.name}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.7 }}>
                {training.description || 'This certification is attached to the training record shown below.'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" onClick={() => navigate('/certifications')}>
                Back to certifications
              </Button>
              <Button variant="outlined" size="large" startIcon={<HistoryRounded />}>
                View history
              </Button>
              <Button variant="outlined" color="error" size="large" startIcon={<EditOutlined />}>
                Revoke and edit
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <SectionHeader
                eyebrow="People"
                title="Issued to and issued by"
                description="Only the names are shown here, but each one links to the related user profile."
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                <FieldCard
                  label="Issued to"
                  value={
                    <Link component={RouterLink} to={`/profile/${certification.issuedTo.id}`} underline="hover" sx={{ fontWeight: 700 }}>
                      {formatName(certification.issuedTo)}
                    </Link>
                  }
                  helper="Recipient who received the certification."
                />
                <FieldCard
                  label="Issued by"
                  value={
                    <Link component={RouterLink} to={`/profile/${certification.issuedBy.id}`} underline="hover" sx={{ fontWeight: 700 }}>
                      {formatName(certification.issuedBy)}
                    </Link>
                  }
                  helper="Issuer recorded on the certification."
                />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <SectionHeader
                eyebrow="Training"
                title="Training details"
                description="The associated lab and tool are shown as links so they can be opened directly."
                accent="#0F766E"
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                <FieldCard
                  label="Training"
                  value={<Typography sx={{ fontWeight: 700 }}>{training.name}</Typography>}
                  helper="Training record connected to this certification."
                />
                <FieldCard
                  label="Type"
                  value={<Chip label={training.type} size="small" sx={{ fontWeight: 700 }} />}
                  helper="Type stored on the related training record."
                />
                <FieldCard
                  label="Lab"
                  value={
                    hasLab ? (
                      <Link
                        component={RouterLink}
                        to={`/lab-management/lab/add?labId=${training.lab?.id}`}
                        underline="hover"
                        sx={{ fontWeight: 700 }}
                      >
                        {training.lab?.name}
                      </Link>
                    ) : (
                      <Typography color="text.secondary">No lab assigned</Typography>
                    )
                  }
                  helper="The lab attached to the training record."
                />
                <FieldCard
                  label="Tool"
                  value={
                    hasTool ? (
                      <Link
                        component={RouterLink}
                        to={`/lab-management/training/add?toolId=${training.tool?.id}`}
                        underline="hover"
                        sx={{ fontWeight: 700 }}
                      >
                        {training.tool?.name}
                      </Link>
                    ) : (
                      <Typography color="text.secondary">No tool assigned</Typography>
                    )
                  }
                  helper="The tool attached to the training record."
                />
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <SectionHeader
                eyebrow="Certification"
                title="Status and timeline"
                description="These fields come directly from the certification record."
                accent="#7C3AED"
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                <FieldCard
                  label="Status"
                  value={
                    <Chip
                      label={statusStyle.label}
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        border: '1px solid',
                        borderColor: statusStyle.border,
                        fontWeight: 700,
                      }}
                    />
                  }
                />
                <FieldCard
                  label="Level"
                  value={<Typography sx={{ fontWeight: 800, fontSize: 24 }}>Level {certification.level}</Typography>}
                />
                <FieldCard
                  label="Issued at"
                  value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(certification.issuedAt)}</Typography>}
                />
                <FieldCard
                  label="Expiry date"
                  value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(certification.expiryDate)}</Typography>}
                  helper={certification.expiryDate ? 'When this certification stops being valid.' : 'No expiry date is set.'}
                />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <SectionHeader
                eyebrow="Notes"
                title="Certification notes"
                description="Any extra context attached to the certification record."
                accent="#D97706"
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <DescriptionOutlined sx={{ color: '#D97706', mt: 0.3 }} />
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.primary' }}>
                  {certification.notes?.trim() || 'No notes were added to this certification.'}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </GradientBox>
  );
};

export default CertificationView;


