import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import GradientBox from '../components/ui/GradientBox';
import api from '../lib/api';
import LabCard from './ManageLabTabs/components/LabCard';
import type { LabDetail } from './ManageLabTabs/commons/types';

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? 'Failed to load deactivated labs.';
  }

  if (error instanceof Error) return error.message;

  return 'Failed to load deactivated labs.';
};

const normalizeLabs = (payload: unknown): LabDetail[] => {
  if (Array.isArray(payload)) return payload as LabDetail[];

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as LabDetail[];
  }

  return [];
};

const DeactivatedLabs = () => {
  const [labs, setLabs] = useState<LabDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/labs/deactivated');
        const labList = normalizeLabs(response.data);
        if (mounted) setLabs(labList);
      } catch (requestError) {
        console.error('Error fetching deactivated labs:', requestError);
        if (mounted) {
          setError(getErrorMessage(requestError));
          setLabs([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLabs();

    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  const handleActivate = async (labId: string) => {
    try {
      await api.patch(`/api/labs/${encodeURIComponent(labId)}/activate`);
      setReloadToken((current) => current + 1);
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError));
    }
  };

  return (
    <GradientBox sx={{ minHeight: 'calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))', px: 0, py: 0 }}>
      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4 }}>
          <Box>
            <Typography component="h1" sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 900, letterSpacing: -1.1, lineHeight: 1, color: '#111827' }}>
              Deactivated Labs
            </Typography>
            <Typography variant="body1" sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.7, maxWidth: 720 }}>
              These labs are inactive. Activate a lab before making changes.
            </Typography>
          </Box>

          <Button component={RouterLink} to="/lab-management" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>
            Back to Labs
          </Button>
        </Stack>

        {error && (
          <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: alpha('#dc2626', 0.25), background: alpha('#fee2e2', 0.72) }}>
            <Alert severity="error" sx={{ alignItems: 'center' }}>{error}</Alert>
          </Paper>
        )}

        {loading ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: alpha('#0F172A', 0.08), textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.96)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Loading deactivated labs...</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Pulling the inactive labs from the database.</Typography>
          </Paper>
        ) : labs.length === 0 ? (
          <Paper elevation={0} sx={{ p: 5, borderRadius: 2, border: '1px dashed', borderColor: alpha('#0F172A', 0.18), textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.96)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>No deactivated labs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Everything is currently active.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2.5, md: 4 } }}>
            {labs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                actionLabel="Activate"
                actionColor="success"
                onAction={() => handleActivate(lab.id)}
              />
            ))}
          </Box>
        )}
      </Box>
    </GradientBox>
  );
};

export default DeactivatedLabs;
