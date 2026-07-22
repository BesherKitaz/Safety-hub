import { useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import type { TrainingsTabProps, TrainingNodeSummary } from './commons/types';
import { safeText } from './commons/helperFunctions';
import DetailField from './components/DetailField';
import SectionHeader from './components/SectionHeader';
import api from '../../lib/api';
import { currentResourcePermissions } from '../../util/resourcePermissions';

const trainingCardShellSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#0F766E', 0.14),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.07)',
  transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: alpha('#0F766E', 0.28),
    boxShadow: '0 22px 44px rgba(15, 23, 42, 0.10)',
  },
};

type TrainingCardProps = {
  trainingNode: TrainingNodeSummary;
  currentLab: TrainingsTabProps['lab'];
  onTrainingChanged: () => void | Promise<void>;
};

const TrainingCard = ({ trainingNode, currentLab, onTrainingChanged }: TrainingCardProps) => {
  const permissions = currentResourcePermissions();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const isLabActive = currentLab.isActive !== false;
  const isTrainingActive = trainingNode.isActive !== false;

  const handleDeactivate = async () => {
    try {
      setBusy(true);
      await api.patch(`/api/trainings/${encodeURIComponent(trainingNode.id)}/deactivate`);
      setDeactivateOpen(false);
      await onTrainingChanged();
    } catch (error) {
      console.error('Error deactivating training:', error);
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    try {
      setBusy(true);
      await api.patch(`/api/trainings/${encodeURIComponent(trainingNode.id)}/activate`);
      await onTrainingChanged();
    } catch (error) {
      console.error('Error activating training:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Deactivate training node?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ lineHeight: 1.7 }}>
            Deactivating this training node will also deactivate all of its children. Any associated tool will stay active.
            Children will remain inactive until they are reactivated manually.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeactivateOpen(false)} disabled={busy} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleDeactivate} variant="contained" color="error" disabled={busy} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={0} sx={trainingCardShellSx}>
        <Box sx={{ height: 6, bgcolor: isTrainingActive ? '#0F766E' : '#6B7280' }} />

        <Stack spacing={2.25} sx={{ p: 2.5, flexGrow: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.15, color: '#111827' }}>
                {safeText(trainingNode.name, `Training node ${trainingNode.id}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                Training node ID: {trainingNode.id}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={isTrainingActive ? 'Active' : 'Inactive'}
              variant="outlined"
              sx={{
                flexShrink: 0,
                borderColor: isTrainingActive ? alpha('#0F766E', 0.2) : alpha('#6B7280', 0.2),
                bgcolor: isTrainingActive ? alpha('#0F766E', 0.08) : alpha('#6B7280', 0.08),
                color: isTrainingActive ? '#0F766E' : '#4B5563',
                fontWeight: 700,
              }}
            />
          </Stack>

          <Stack spacing={1.25}>
            <DetailField
              label="Description"
              value={
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {safeText(trainingNode.description, 'No description provided.')}
                </Typography>
              }
            />
            <DetailField
              label="Associated tool"
              value={
                trainingNode.tool ? (
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {safeText(trainingNode.tool.name, trainingNode.tool.id)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tool attached.
                  </Typography>
                )
              }
            />
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            useFlexGap
            sx={{ flexWrap: 'wrap', justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            {isTrainingActive ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => navigate(`training/${trainingNode.id}`)}
                  disabled={!isLabActive}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  View
                </Button>
                {permissions.canManageTrainingNodes && <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => navigate(`training/${trainingNode.id}/edit`)}
                  disabled={!isLabActive}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  Edit
                </Button>}
                {permissions.canManageTrainingNodes && <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<BlockOutlined fontSize="small" />}
                  onClick={() => setDeactivateOpen(true)}
                  disabled={!isLabActive}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  Deactivate
                </Button>}
              </Stack>
            ) : (
              permissions.canManageTrainingNodes ? <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<FlashOnOutlined fontSize="small" />}
                onClick={handleActivate}
                disabled={!isLabActive || busy}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
              >
                Activate
              </Button> : null
            )}
          </Stack>
        </Box>
      </Paper>
    </>
  );
};

const TrainingsTab = ({ lab, trainingNodes }: TrainingsTabProps) => {
  const permissions = currentResourcePermissions();
  const navigate = useNavigate();
  const [trainingList, setTrainingList] = useState<TrainingNodeSummary[]>(trainingNodes);
  const [showInactive, setShowInactive] = useState(false);
  const isLabActive = lab.isActive !== false;
  const visibleTrainingNodes = showInactive ? trainingList : trainingList.filter((trainingNode) => trainingNode.isActive !== false);

  const handleTrainingListUpdate = async () => {
    try {
      const response = await api.get(`/api/labs/${lab.id}/trainingNodes`);
      setTrainingList(response.data.data);
    } catch (error) {
      console.error('Error fetching updated training list:', error);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        <SectionHeader
          eyebrow="Trainings"
          title="Lab training nodes"
          description="Training cards are adapted to the node shape already returned by the current endpoint, with optional fields rendered only when present."
          accent="#0F766E"
        />

        <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {permissions.canManageTrainingNodes && <Button
            variant="outlined"
            onClick={() => setShowInactive((current) => !current)}
            sx={{
              flexShrink: 0,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
            }}
          >
            {showInactive ? 'Hide inactive trainings' : 'Show inactive trainings'}
          </Button>}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/lab-management/training/add')}
            disabled={!isLabActive}
            sx={{
              flexShrink: 0,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              px: 2.25,
              boxShadow: 'none',
            }}
          >
            Add Training
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip label={`${visibleTrainingNodes.length} visible training node${visibleTrainingNodes.length === 1 ? '' : 's'}`} />
        <Chip label={`${trainingList.filter((trainingNode) => trainingNode.isActive === false).length} inactive`} variant="outlined" />
        <Chip label={`Lab: ${safeText(lab.name, lab.id)}`} variant="outlined" />
      </Stack>

      {visibleTrainingNodes.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 4,
            border: '1px dashed',
            borderColor: alpha('#0F172A', 0.18),
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.96)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {showInactive ? 'No training nodes found' : 'No active training nodes found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {showInactive
              ? 'The current lab detail response does not contain any training nodes yet.'
              : 'Inactive training nodes are hidden by default. Use the toggle above to show them.'}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {visibleTrainingNodes.map((trainingNode) => (
            <TrainingCard
              key={trainingNode.id}
              trainingNode={trainingNode}
              currentLab={lab}
              onTrainingChanged={handleTrainingListUpdate}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
};

export default TrainingsTab;
