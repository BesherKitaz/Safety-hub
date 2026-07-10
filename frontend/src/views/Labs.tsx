import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';

import GradientBox from '../components/ui/GradientBox';
import api from '../lib/api';
import LabCard from './ManageLabTabs/components/LabCard';
import LabFormModal, { type LabFormValues } from './ManageLabTabs/components/LabFormModal';
import type { LabDetail } from './ManageLabTabs/commons/types';

const formatCount = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`;

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? 'Failed to load labs.';
  }

  if (error instanceof Error) return error.message;

  return 'Failed to load labs.';
};

const normalizeLabs = (payload: unknown): LabDetail[] => {
  if (Array.isArray(payload)) return payload as LabDetail[];

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as LabDetail[];
  }

  return [];
};

const Labs = () => {
  const [labs, setLabs] = useState<LabDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const visibleLabs = labs.filter((lab) => lab.isActive !== false);

  useEffect(() => {
    let mounted = true;

    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/labs/');
        const labList = normalizeLabs(response.data);

        if (mounted) setLabs(labList);
      } catch (requestError) {
        console.error('Error fetching labs:', requestError);

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

  const handleCreateSubmit = async (values: LabFormValues) => {
    try {
      await api.post('/api/labs/create', values);
      setCreateModalOpen(false);
      setReloadToken((current) => current + 1);
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError));
    }
  };

  return (
    <GradientBox
      sx={{
        minHeight: 'calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))',
        px: 0,
        py: 0,
      }}
    >
      <LabFormModal
        open={createModalOpen}
        mode="create"
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            mb: 5,
            pb: 4,
            borderBottom: '1px solid',
            borderColor: alpha('#0F172A', 0.12),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 36, md: 52 },
                  fontWeight: 900,
                  letterSpacing: -1.2,
                  lineHeight: 1,
                  color: '#111827',
                }}
              >
                Labs
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mt: 1.5,
                  maxWidth: 620,
                  color: 'text.secondary',
                  lineHeight: 1.7,
                }}
              >
                Manage makerspace labs, tools, trainings, and activation state.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/lab-management/deactivated"
                startIcon={<FilterAltOffOutlined />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                Deactivated Labs
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 800,
                  boxShadow: 'none',
                }}
              >
                Create Lab
              </Button>
            </Stack>
          </Stack>

          <Typography variant="body2" sx={{ mt: 1.5, color: 'primary.main', fontWeight: 800 }}>
            {loading ? 'Loading labs...' : formatCount(visibleLabs.length, 'active lab')}
          </Typography>
        </Box>

        {error && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha('#dc2626', 0.25),
              background: alpha('#fee2e2', 0.72),
            }}
          >
            <Alert severity="error" sx={{ alignItems: 'center' }}>
              {error}
            </Alert>
          </Paper>
        )}

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha('#0F172A', 0.08),
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Loading labs...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pulling the current lab list from the database.
            </Typography>
          </Paper>
        ) : visibleLabs.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: alpha('#0F172A', 0.18),
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              No labs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
              Create your first lab to start adding tools and trainings.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 800,
                boxShadow: 'none',
              }}
            >
              Create Lab
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2.5, md: 4 },
            }}
          >
            {visibleLabs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                actionLabel="Manage"
                actionHref={`/lab-management/lab/${encodeURIComponent(lab.id)}`}
              />
            ))}
          </Box>
        )}
      </Box>
    </GradientBox>
  );
};

export default Labs;


