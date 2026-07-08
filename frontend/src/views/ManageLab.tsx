import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import axios from 'axios';

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
import AddIcon from '@mui/icons-material/Add';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';

import api from '../lib/api';
import GradientBox from '../components/ui/GradientBox';

import type { LabTool, LabDetail, TrainingNodeSummary } from './ManageLabTabs/commons/types';
import { formatDateTime, safeText } from './ManageLabTabs/commons/helperFunctions';

import SectionHeader from './ManageLabTabs/SectionHeader';
import DetailField from './ManageLabTabs/commons/DetailField';

import ToolsTab from './ManageLabTabs/LabTools';
import TrainingCard from './ManageLabTabs/LabTrainingNodes';



const noop = () => undefined;

const pageSurfaceSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#0F172A', 0.08),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(10px)',
};

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



const LabActions = () => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
    <Button
      variant="contained"
      startIcon={<EditOutlined />}
      onClick={noop}
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
    <Button
      variant="outlined"
      color="error"
      startIcon={<BlockOutlined />}
      onClick={noop}
      sx={{
        borderRadius: 999,
        textTransform: 'none',
        fontWeight: 800,
        px: 2.25,
      }}
    >
      Deactivate Lab
    </Button>
  </Stack>
);


type LabInfoTabProps = {
  lab: LabDetail;
  tools: LabTool[];
  trainingNodes: TrainingNodeSummary[];
};

const LabInfoTab = ({ lab, tools, trainingNodes }: LabInfoTabProps) => {
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
              description="Review the lab details that are already returned by the API, with a few UI-only management actions layered on top."
              accent="#7C3AED"
            />

            <LabActions />
          </Stack>

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



type TrainingsTabProps = {
  lab: LabDetail;
  trainingNodes: TrainingNodeSummary[];
};

const TrainingsTab = ({ lab, trainingNodes }: TrainingsTabProps) => {
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={noop}
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

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip label={`${trainingNodes.length} training node${trainingNodes.length === 1 ? '' : 's'}`} />
        <Chip label={`Lab: ${safeText(lab.name, lab.id)}`} variant="outlined" />
      </Stack>

      {trainingNodes.length === 0 ? (
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
            No training nodes found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            The current lab detail response does not contain any training nodes yet.
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
          {trainingNodes.map((trainingNode) => (
            <TrainingCard key={trainingNode.id} trainingNode={trainingNode} currentLab={lab} />
          ))}
        </Box>
      )}
    </Stack>
  );
};

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
        const response = await api.get(`/api/labs/${encodeURIComponent(labId)}`);
        const payload = response.data?.data as LabDetail | null | undefined;

        if (!payload) {
          throw new Error('Lab details were not returned by the API.');
        }

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

