import { useEffect, useState, useMemo, type ReactNode } from 'react';
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
  ArrowBackRounded,
  CalendarMonthOutlined,
  HistoryRounded,
  PersonOutlineRounded,
  VisibilityOutlined,
} from '@mui/icons-material';

import api from '../lib/api';
import GradientBox from '../components/ui/GradientBox';

type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
} | null;

type LabSummary = {
  id: string;
  name: string;
} | null;

type ToolSummary = {
  id: string;
  name: string;
} | null;

type TrainingSummary = {
  id: string;
  name: string;
  type: string;
  lab: LabSummary;
  tool: ToolSummary;
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

type CertificationSnapshot = {
  id: string;
  trainingNodeId: string;
  notes: string | null;
  status: string;
  level: number;
  expiryDate: string | null;
  issuedAt: string;
  issuedTo: UserSummary;
  issuedBy: UserSummary;
  trainingNode: TrainingSummary | null;
};

type HistoryRecord = {
  id: string;
  certificationId: string;
  action: string;
  levelBefore: number;
  statusBefore: string;
  expiryDateBefore: string | null;
  notesBefore: string | null;
  trainingNodeIdBefore: string;
  levelAfter: number;
  statusAfter: string;
  expiryDateAfter: string | null;
  notesAfter: string | null;
  trainingNodeIdAfter: string;
  reason: string | null;
  changedAt: string;
  changedBy: UserSummary;
  trainingNodeBefore: TrainingSummary | null;
  trainingNodeAfter: TrainingSummary | null;
  certificationSnapshot: CertificationSnapshot;
};

type HistoryListResponse = {
  certification: CertificationDetail;
  historyRecords: HistoryRecord[];
};

type HistoryDetailResponse = {
  certification: CertificationDetail;
  history: HistoryRecord;
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

const formatPerson = (person?: UserSummary) => {
  if (!person) {
    return 'Unknown user';
  }

  return `${person.firstName} ${person.lastName}`.trim();
};

const formatAction = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATED':
      return 'Created';
    case 'UPDATED':
      return 'Updated';
    case 'REVOKED':
      return 'Revoked';
    case 'REACTIVATED':
      return 'Unrevoked';
    case 'EXPIRED':
      return 'Expired';
    case 'DEACTIVATED':
      return 'Deactivated';
    default:
      return action;
  }
};

const formatStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'Active';
    case 'REVOKED':
      return 'Revoked';
    case 'EXPIRED':
      return 'Expired';
    case 'DEACTIVATED':
      return 'Deactivated';
    default:
      return status;
  }
};

const getActionStyles = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATED':
      return { color: '#047857', bg: alpha('#059669', 0.12), border: alpha('#059669', 0.24) };
    case 'UPDATED':
      return { color: '#1d4ed8', bg: alpha('#2563eb', 0.12), border: alpha('#2563eb', 0.24) };
    case 'REVOKED':
      return { color: '#b91c1c', bg: alpha('#dc2626', 0.12), border: alpha('#dc2626', 0.24) };
    case 'REACTIVATED':
      return { color: '#0f766e', bg: alpha('#14b8a6', 0.12), border: alpha('#14b8a6', 0.24) };
    case 'EXPIRED':
      return { color: '#b45309', bg: alpha('#f59e0b', 0.12), border: alpha('#f59e0b', 0.24) };
    case 'DEACTIVATED':
      return { color: '#475569', bg: alpha('#64748b', 0.12), border: alpha('#64748b', 0.24) };
    default:
      return { color: '#1f2937', bg: alpha('#6b7280', 0.12), border: alpha('#6b7280', 0.24) };
  }
};

const FieldCard = ({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 3,
      border: '1px solid',
      borderColor: alpha('#2563EB', 0.12),
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
    }}
  >
    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.15, color: 'text.secondary', fontWeight: 700 }}>
      {label}
    </Typography>
    <Box sx={{ mt: 1 }}>{value}</Box>
    {helper && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>{helper}</Typography>}
  </Box>
);

const SnapshotPanel = ({
  title,
  eyebrow,
  certification,
  emptyMessage,
}: {
  title: string;
  eyebrow: string;
  certification: CertificationSnapshot | null;
  emptyMessage?: string;
}) => {
  if (!certification) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha('#0F172A', 0.08), background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)' }}>
        <Typography variant="overline" sx={{ color: '#2563EB', fontWeight: 800, letterSpacing: 1.8 }}>{eyebrow}</Typography>
        <Typography variant="h6" sx={{ mt: 1, fontWeight: 800 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>{emptyMessage ?? 'Not available.'}</Typography>
      </Paper>
    );
  }

  const training = certification.trainingNode;

  return (
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
      <Typography variant="overline" sx={{ color: '#2563EB', fontWeight: 800, letterSpacing: 1.8 }}>{eyebrow}</Typography>
      <Typography component="h2" sx={{ mt: 0.75, fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{title}</Typography>
      <Divider sx={{ my: 2.25 }} />
      <Stack spacing={1.5}>
        <FieldCard label="Status" value={<Typography sx={{ fontWeight: 700 }}>{formatStatus(certification.status)}</Typography>} />
        <FieldCard label="Level" value={<Typography sx={{ fontWeight: 700 }}>Level {certification.level}</Typography>} />
        <FieldCard label="Issued at" value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(certification.issuedAt)}</Typography>} />
        <FieldCard label="Expiry date" value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(certification.expiryDate)}</Typography>} />
        <FieldCard label="Notes" value={<Typography sx={{ fontWeight: 700 }}>{certification.notes || 'No notes provided'}</Typography>} />
        <FieldCard label="Training" value={training ? <Typography sx={{ fontWeight: 700 }}>{training.name}</Typography> : <Typography color="text.secondary">No training captured</Typography>} />
        <FieldCard label="Lab" value={training?.lab ? <Typography sx={{ fontWeight: 700 }}>{training.lab.name}</Typography> : <Typography color="text.secondary">No lab captured</Typography>} />
        <FieldCard label="Tool" value={training?.tool ? <Typography sx={{ fontWeight: 700 }}>{training.tool.name}</Typography> : <Typography color="text.secondary">No tool captured</Typography>} />
        <FieldCard label="Issued to" value={<Typography sx={{ fontWeight: 700 }}>{formatPerson(certification.issuedTo)}</Typography>} />
        <FieldCard label="Issued by" value={<Typography sx={{ fontWeight: 700 }}>{formatPerson(certification.issuedBy)}</Typography>} />
      </Stack>
    </Paper>
  );
};

const CertificationHistory = () => {
  const { id, historyId } = useParams<{ id: string; historyId?: string }>();
  const navigate = useNavigate();

  const [certification, setCertification] = useState<CertificationDetail | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyRecord, setHistoryRecord] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDetailView = Boolean(historyId);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) {
        setError('Certification ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (historyId) {
          const response = await api.get<{ data: HistoryDetailResponse }>(`/api/certifications/${id}/history/${historyId}`);
          setCertification(response.data.data.certification);
          setHistoryRecord(response.data.data.history);
          setHistoryRecords([]);
        } else {
          const response = await api.get<{ data: HistoryListResponse }>(`/api/certifications/${id}/history`);
          setCertification(response.data.data.certification);
          setHistoryRecords(response.data.data.historyRecords);
          setHistoryRecord(null);
        }
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setError('History record not found.');
        } else {
          setError('Failed to load certification history.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, historyId]);

  const activeHistoryRecord = useMemo(() => historyRecord ?? historyRecords[0] ?? null, [historyRecord, historyRecords]);

  if (loading) {
    return (
      <GradientBox>
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">Loading certification history...</Typography>
        </Box>
      </GradientBox>
    );
  }

  if (error || !certification) {
    return (
      <GradientBox>
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', px: 2 }}>
          <Paper elevation={0} sx={{ maxWidth: 560, width: '100%', p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha('#2563EB', 0.12), textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{error ?? 'History not found.'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
              The certification history could not be loaded.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/certifications')}>Back to certifications</Button>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  const orderedHistory = [...historyRecords].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  const selectedHistory = historyRecord ?? orderedHistory[0] ?? null;
  const currentTraining = certification.trainingNode;

  return (
    <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ maxWidth: 1320, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 5,
            border: '1px solid',
            borderColor: alpha('#2563EB', 0.12),
            background: 'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0.96) 46%, rgba(15,118,110,0.10) 100%)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip icon={<HistoryRounded fontSize="small" />} label="Certification history" sx={{ fontWeight: 700 }} />
              <Chip icon={<CalendarMonthOutlined fontSize="small" />} label={`Issued ${formatDateTime(certification.issuedAt)}`} variant="outlined" />
              {selectedHistory && <Chip icon={<VisibilityOutlined fontSize="small" />} label={`${formatAction(selectedHistory.action)} ${formatDateTime(selectedHistory.changedAt)}`} variant="outlined" />}
            </Stack>

            <Box sx={{ maxWidth: 920 }}>
              <Typography component="h1" sx={{ fontSize: { xs: 32, sm: 40, md: 52 }, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
                {isDetailView ? 'Historical certification details' : 'Certification history'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.7 }}>
                {isDetailView
                  ? 'This view shows the certification as it was recorded after the selected change.'
                  : 'Each entry shows who changed the certification, when it happened, and the recorded snapshot after that action.'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" startIcon={<ArrowBackRounded />} onClick={() => navigate(`/certifications/${id}`)}>
                Back to certification
              </Button>
              {isDetailView ? (
                <Button variant="outlined" size="large" startIcon={<ArrowBackRounded />} onClick={() => navigate(`/certifications/${id}/history`)}>
                  Back to history
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        {!isDetailView && orderedHistory.length === 0 ? (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha('#0F172A', 0.08), background: 'rgba(255,255,255,0.96)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>No history entries yet</Typography>
            <Typography variant="body2" color="text.secondary">This certification has not recorded any history changes yet.</Typography>
          </Paper>
        ) : null}

        {isDetailView && selectedHistory ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 4, border: '1px solid', borderColor: alpha('#0F172A', 0.08), background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)' }}>
                <Typography variant="overline" sx={{ color: '#2563EB', fontWeight: 800, letterSpacing: 1.8 }}>Change details</Typography>
                <Typography component="h2" sx={{ mt: 0.75, fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
                  {formatAction(selectedHistory.action)} on {formatDateTime(selectedHistory.changedAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                  {formatPerson(selectedHistory.changedBy)} recorded this change.
                </Typography>
                <Divider sx={{ my: 2.25 }} />
                <Stack spacing={1.5}>
                  <FieldCard label="Reason" value={<Typography sx={{ fontWeight: 700 }}>{selectedHistory.reason || 'No reason provided'}</Typography>} />
                  <FieldCard label="Action" value={<Chip label={formatAction(selectedHistory.action)} sx={{ fontWeight: 700 }} />} />
                  <FieldCard
                    label="Updated by"
                    value={selectedHistory.changedBy ? <Link component={RouterLink} to={`/user/${selectedHistory.changedBy.id}`} underline="hover" sx={{ fontWeight: 700 }}>{formatPerson(selectedHistory.changedBy)}</Link> : <Typography color="text.secondary">Unknown user</Typography>}
                  />
                </Stack>
              </Paper>

              <SnapshotPanel
                eyebrow="Before this change"
                title="Certification data before this action"
                certification={selectedHistory.action === 'CREATED' ? null : {
                  id: selectedHistory.certificationId,
                  trainingNodeId: selectedHistory.trainingNodeIdBefore,
                  notes: selectedHistory.notesBefore,
                  status: selectedHistory.statusBefore,
                  level: selectedHistory.levelBefore,
                  expiryDate: selectedHistory.expiryDateBefore,
                  issuedAt: certification.issuedAt,
                  issuedTo: certification.issuedTo,
                  issuedBy: certification.issuedBy,
                  trainingNode: selectedHistory.trainingNodeBefore,
                }}
                emptyMessage="This certification did not exist before this action."
              />
            </Stack>

            <Stack spacing={3}>
              <SnapshotPanel
                eyebrow="After this change"
                title="Certification data after this action"
                certification={selectedHistory.certificationSnapshot}
              />

              <Paper elevation={0} sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 4, border: '1px solid', borderColor: alpha('#0F172A', 0.08), background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)' }}>
                <Typography variant="overline" sx={{ color: '#7C3AED', fontWeight: 800, letterSpacing: 1.8 }}>Current record</Typography>
                <Typography component="h2" sx={{ mt: 0.75, fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>Certification that exists now</Typography>
                <Divider sx={{ my: 2.25 }} />
                <Stack spacing={1.5}>
                  <FieldCard label="Current status" value={<Typography sx={{ fontWeight: 700 }}>{formatStatus(certification.status)}</Typography>} />
                  <FieldCard label="Current level" value={<Typography sx={{ fontWeight: 700 }}>Level {certification.level}</Typography>} />
                  <FieldCard label="Current training" value={<Typography sx={{ fontWeight: 700 }}>{currentTraining.name}</Typography>} />
                  <FieldCard label="Issued to" value={<Typography sx={{ fontWeight: 700 }}>{formatPerson(certification.issuedTo)}</Typography>} />
                  <FieldCard label="Issued by" value={<Typography sx={{ fontWeight: 700 }}>{formatPerson(certification.issuedBy)}</Typography>} />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2.25}>
            {orderedHistory.map((record) => (
              <Paper
                key={record.id}
                elevation={0}
                onClick={() => navigate(`/certifications/${id}/history/${record.id}`)}
                sx={{
                  p: { xs: 2.25, md: 2.75 },
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: alpha('#0F172A', 0.08),
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.12)' },
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip label={formatAction(record.action)} sx={{ ...getActionStyles(record.action), fontWeight: 700, border: '1px solid', borderColor: getActionStyles(record.action).border }} />
                    <Chip icon={<PersonOutlineRounded fontSize="small" />} label={formatPerson(record.changedBy)} variant="outlined" />
                    <Chip icon={<CalendarMonthOutlined fontSize="small" />} label={formatDateTime(record.changedAt)} variant="outlined" />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatAction(record.action)} by {formatPerson(record.changedBy)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{record.reason || 'No reason was provided for this change.'}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </GradientBox>
  );
};

export default CertificationHistory;

