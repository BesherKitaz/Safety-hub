import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Stack, Typography } from '@mui/material';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import { alpha } from '@mui/material/styles';
import axios from 'axios';

import SectionHeader from './components/SectionHeader';
import DetailField from './components/DetailField';
import LabFormModal, { type LabFormValues } from './components/LabFormModal';

import { formatDateTime, safeText } from './commons/helperFunctions';
import type { LabInfoTabProps } from './commons/types';
import api from '../../lib/api';

export const pageSurfaceSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#0F172A', 0.08),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(10px)',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

const LabActions = ({ lab, onLabUpdated }: { lab: NonNullable<LabInfoTabProps['lab']>; onLabUpdated: () => void | Promise<void> }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = lab.isActive !== false;

  const handleEditSubmit = async (values: LabFormValues) => {
    try {
      setBusy(true);
      setError(null);
      await api.put(`/api/labs/update/${encodeURIComponent(lab.id)}`, values);
      setEditOpen(false);
      await onLabUpdated();
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError, 'Failed to update the lab.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setBusy(true);
      setError(null);
      await api.patch(`/api/labs/${encodeURIComponent(lab.id)}/deactivate`);
      setDeactivateOpen(false);
      await onLabUpdated();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to deactivate the lab.'));
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    try {
      setBusy(true);
      setError(null);
      await api.patch(`/api/labs/${encodeURIComponent(lab.id)}/activate`);
      await onLabUpdated();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to activate the lab.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <LabFormModal
        open={editOpen}
        mode="edit"
        initialValues={{
          name: lab.name ?? '',
          description: lab.description ?? '',
        }}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Deactivate lab?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ lineHeight: 1.7 }}>
            Deactivating this lab will also deactivate all associated tools and training nodes.
            They will stay inactive until they are reactivated manually.
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

      <Stack spacing={1.25} sx={{ flexWrap: 'wrap' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={() => setEditOpen(true)}
            disabled={busy || !isActive}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              px: 2.25,
              boxShadow: 'none',
            }}
          >
            Edit Lab
          </Button>
          {isActive ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockOutlined />}
              onClick={() => setDeactivateOpen(true)}
              disabled={busy}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                px: 2.25,
              }}
            >
              Deactivate Lab
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<FlashOnOutlined />}
              onClick={handleActivate}
              disabled={busy}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                px: 2.25,
                boxShadow: 'none',
              }}
            >
              Activate Lab
            </Button>
          )}
        </Stack>
      </Stack>
    </>
  );
};

const LabInfoTab = ({ lab, tools, trainingNodes, onLabUpdated }: LabInfoTabProps) => {
  const isActive = lab.isActive !== false;

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={pageSurfaceSx}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <SectionHeader
              eyebrow="Lab Info"
              title="Current lab record"
              description="Review the lab details and manage the record directly from this tab."
              accent="#7C3AED"
            />

            <LabActions lab={lab} onLabUpdated={onLabUpdated} />
          </Stack>

          {!isActive && (
            <Alert severity="warning" sx={{ alignItems: 'center' }}>
              This lab is inactive. Activate it before making changes.
            </Alert>
          )}

          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            {safeText(lab.description, 'No description provided for this lab.')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            <DetailField
              label="Status"
              value={
                <Typography sx={{ fontWeight: 800, color: isActive ? 'success.main' : 'text.secondary' }}>
                  {isActive ? 'Active' : 'Inactive'}
                </Typography>
              }
              helper="Whether this lab is currently available for changes."
            />
            <DetailField
              label="Lab ID"
              value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{lab.id}</Typography>}
              helper="Unique identifier from the existing lab detail response."
            />
            <DetailField
              label="Lab name"
              value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{safeText(lab.name, lab.id)}</Typography>}
              helper="Name value returned by the existing API call."
            />
            <DetailField
              label="Description"
              value={
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {safeText(lab.description, 'No description provided.')}
                </Typography>
              }
              helper="Displayed directly from the current API payload."
            />
            <DetailField
              label="Created at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(lab.createdAt)}</Typography>}
              helper="Creation timestamp from the response."
            />
            <DetailField
              label="Updated at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(lab.updatedAt)}</Typography>}
              helper="Most recent update timestamp from the response."
            />
            <DetailField
              label="Tools"
              value={<Typography sx={{ fontWeight: 800, fontSize: 28 }}>{tools.length}</Typography>}
              helper="Tools already attached to this lab in the current response."
            />
            <DetailField
              label="Training nodes"
              value={<Typography sx={{ fontWeight: 800, fontSize: 28 }}>{trainingNodes.length}</Typography>}
              helper="Training nodes already attached to this lab in the current response."
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default LabInfoTab;

