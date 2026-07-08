
// Main React and React Router imports
import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

// main imports (not components or React)
import axios from 'axios';

// Main MUI imports
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import ScienceOutlined from '@mui/icons-material/ScienceOutlined';

// Costum components and imports
import api from '../lib/api';
import GradientBox from '../components/ui/GradientBox';

// Types and helpers and commons
import type { LabDetail, LabTool, TrainingNodeSummary } from './ManageLabTabs/commons/types';
import { formatDateTime, safeText } from './ManageLabTabs/commons/helperFunctions';

// Tabs
import ToolsTab from './ManageLabTabs/LabTools';
import TrainingsTab from './ManageLabTabs/LabTrainingNodes';
import LabInfoTab from './ManageLabTabs/LabDetails';

// Styles from the LabDetails Tab
import { pageSurfaceSx } from './ManageLabTabs/LabDetails';

const heroSurfaceSx = {
  position: 'relative',
  overflow: 'hidden',
  p: { xs: 2.5, md: 3.5 },
  borderRadius: 5,
  border: '1px solid',
  borderColor: alpha('#2563EB', 0.12),
  background:
    'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0.96) 46%, rgba(15,118,110,0.10) 100%)',
  boxShadow: '0 28px 70px rgba(15, 23, 42, 0.10)',
};


const normalizeList = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

type TabPanelProps = {
  children: ReactNode;
  value: number;
  index: number;
  idPrefix: string;
};

const TabPanel = ({ children, value, index, idPrefix }: TabPanelProps) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`${idPrefix}-tabpanel-${index}`}
    aria-labelledby={`${idPrefix}-tab-${index}`}
    sx={{ pt: 3 }}
  >
    {value === index ? children : null}
  </Box>
);



const LabManagement = () => {
  const { labId } = useParams<{ labId: string }>();
  const [labData, setLabData] = useState<LabDetail | null>(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchLabData = async () => {
      if (!labId) {
        if (active) {
          setError('Lab ID is missing in the URL.');
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError(null);
      }

      try {
        const labDetails = await api.get(`/api/labs/${encodeURIComponent(labId)}`);
        const labTools = await api.get(`/api/labs/${encodeURIComponent(labId)}/tools`);
        const labTrainings = await api.get(`/api/labs/${encodeURIComponent(labId)}/trainingNodes`);


        const labDetailsPayload = labDetails.data?.data as LabDetail | null | undefined;

        if (!labDetailsPayload) {
          throw new Error("Lab details were not returned by the API.");
        }

        const labToolsPayload = labTools.data?.data as LabTool[] | null | undefined;
        const labTrainingsPayload = labTrainings.data?.data as TrainingNodeSummary[] | null | undefined;

        const payload: LabDetail = {
          ...labDetailsPayload,
          tools: labToolsPayload ?? [],
          trainingNodes: labTrainingsPayload ?? [],
        };

        if (active) {
          setLabData(payload);
        }
      } catch (requestError) {
        console.error('Error fetching lab data:', requestError);

        let message = 'Failed to fetch lab data. Please try again later.';

        if (axios.isAxiosError<{ message?: string }>(requestError)) {
          if (requestError.response?.status === 404) {
            message = 'Lab not found.';
          } else {
            message = requestError.response?.data?.message ?? requestError.message ?? message;
          }
        } else if (requestError instanceof Error) {
          message = requestError.message;
        }

        if (active) {
          setError(message);
          setLabData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLabData();

    return () => {
      active = false;
    };
  }, [labId]);

  const tools = normalizeList(labData?.tools);
  const trainingNodes = normalizeList(labData?.trainingNodes);

  if (loading) {
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
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <CircularProgress size={42} />
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 2 }}>
              Loading lab details...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              Fetching the current lab payload and building the management tabs.
            </Typography>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  if (error || !labData) {
    return (
      <GradientBox>
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 620,
              width: '100%',
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#dc2626', 0.18),
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Alert severity="error" sx={{ alignItems: 'center' }}>
              {error ?? 'Unable to load lab details.'}
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              The lab detail page only renders what the existing endpoint returns. Try again or go back
              to the lab list if the record is unavailable.
            </Typography>

            <Button
              component={RouterLink}
              to="/lab-management"
              variant="contained"
              sx={{
                mt: 3,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                boxShadow: 'none',
              }}
            >
              Back to Labs
            </Button>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  const labSummary = safeText(labData.name, labData.id);

  return (
    <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ maxWidth: 1440, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper elevation={0} sx={heroSurfaceSx}>
          <Box
            sx={{
              position: 'absolute',
              top: -90,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -100,
              left: -80,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(15,118,110,0.16) 0%, rgba(15,118,110,0) 68%)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)' },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <Stack spacing={2.25}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#2563EB',
                    backgroundColor: alpha('#2563EB', 0.12),
                    boxShadow: '0 12px 24px rgba(37, 99, 235, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  <ScienceOutlined />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 800,
                      letterSpacing: 2,
                      lineHeight: 1,
                    }}
                  >
                    Lab management
                  </Typography>
                  <Typography
                    component="h1"
                    sx={{
                      mt: 0.75,
                      fontSize: { xs: 34, sm: 42, md: 54 },
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: -1,
                      color: 'text.primary',
                      wordBreak: 'break-word',
                    }}
                  >
                    {labSummary}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 1,
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      maxWidth: 780,
                    }}
                  >
                    The page below keeps to the current API payload only. Tools and training nodes are
                    rendered as cards, and the tab actions are UI-only placeholders for now.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label={`Lab ID: ${labData.id}`}
                  variant="outlined"
                  sx={{
                    borderColor: alpha('#2563EB', 0.2),
                    bgcolor: alpha('#FFFFFF', 0.72),
                  }}
                />
                <Chip
                  label={`${tools.length} tool${tools.length === 1 ? '' : 's'}`}
                  variant="outlined"
                  sx={{
                    borderColor: alpha('#0F766E', 0.2),
                    bgcolor: alpha('#FFFFFF', 0.72),
                  }}
                />
                <Chip
                  label={`${trainingNodes.length} training node${trainingNodes.length === 1 ? '' : 's'}`}
                  variant="outlined"
                  sx={{
                    borderColor: alpha('#7C3AED', 0.2),
                    bgcolor: alpha('#FFFFFF', 0.72),
                  }}
                />
                <Chip
                  label={`Updated ${formatDateTime(labData.updatedAt)}`}
                  variant="outlined"
                  sx={{
                    borderColor: alpha('#D97706', 0.2),
                    bgcolor: alpha('#FFFFFF', 0.72),
                  }}
                />
              </Stack>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                background: 'rgba(255,255,255,0.76)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 1.2 }}>
                  Quick snapshot
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
                      {formatDateTime(labData.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
                      {formatDateTime(labData.updatedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tools
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }}>
                      {tools.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Trainings
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }}>
                      {trainingNodes.length}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...pageSurfaceSx, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            aria-label="Lab management tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: { xs: 1, md: 1.5 },
              pt: 1,
              borderBottom: '1px solid',
              borderColor: alpha('#0F172A', 0.08),
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 800,
                minHeight: 52,
                px: 2.25,
              },
            }}
          >
            <Tab label="Lab Info" id="lab-management-tab-0" aria-controls="lab-management-tabpanel-0" />
            <Tab label="Tools" id="lab-management-tab-1" aria-controls="lab-management-tabpanel-1" />
            <Tab label="Trainings" id="lab-management-tab-2" aria-controls="lab-management-tabpanel-2" />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <TabPanel value={tab} index={0} idPrefix="lab-management">
              <LabInfoTab lab={labData} tools={tools} trainingNodes={trainingNodes} />
            </TabPanel>

            <TabPanel value={tab} index={1} idPrefix="lab-management">
              <ToolsTab lab={labData} tools={tools} />
            </TabPanel>

            <TabPanel value={tab} index={2} idPrefix="lab-management">
              <TrainingsTab lab={labData} trainingNodes={trainingNodes} />
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
  );
};




export default LabManagement;

