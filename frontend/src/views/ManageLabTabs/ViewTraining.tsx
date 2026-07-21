import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { alpha } from '@mui/material/styles';
import axios from 'axios';

import { ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import GradientBox from '../../components/ui/GradientBox';
import api from '../../lib/api';
import DetailField from './components/DetailField';
import SectionHeader from './components/SectionHeader';
import { pageSurfaceSx } from './LabDetails';
import { safeText } from './commons/helperFunctions';

export type TrainingNodeType = 'GENERAL' | 'LAB' | 'TOOL';

export type TrainingNodeReference = {
  id: string;
  name: string;
  type: TrainingNodeType;
};

export type TrainingToolReference = {
  id: string;
  name: string;
};

export type TrainingChildEdge = {
  child: TrainingNodeReference | null;
};

export type TrainingParentEdge = {
  parent:
    | (TrainingNodeReference & {
        childEdges?: TrainingChildEdge[] | null;
      })
    | null;
};

export type TrainingNodeRelationshipResponse = {
  id: string;
  name: string;
  type: TrainingNodeType;
  labId: string;
  toolId: string | null;
  tool: TrainingToolReference | null;
  parentEdges: TrainingParentEdge[] | null;
  childEdges: TrainingChildEdge[] | null;
};

type FlowNodeData = {
  label: string;
};

type FlowNode = Node<FlowNodeData>;
type FlowEdge = Edge;

const noop = () => undefined;

const normalizeList = <T,>(value: T[] | null | undefined) => (Array.isArray(value) ? value : []);

const typeAccentMap: Record<TrainingNodeType, string> = {
  GENERAL: '#2563EB',
  LAB: '#0F766E',
  TOOL: '#D97706',
};

const heroSurfaceSx = {
  position: 'relative',
  overflow: 'hidden',
  p: { xs: 2.5, md: 3.25 },
  borderRadius: 5,
  border: '1px solid',
  borderColor: alpha('#0F766E', 0.14),
  background:
    'linear-gradient(135deg, rgba(15,118,110,0.10) 0%, rgba(255,255,255,0.97) 48%, rgba(37,99,235,0.08) 100%)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.09)',
};

const chipSx = (accent: string) => ({
  borderColor: alpha(accent, 0.2),
  bgcolor: alpha(accent, 0.08),
  color: accent,
  fontWeight: 700,
  '& .MuiChip-label': {
    px: 1.25,
  },
});

const buildFlowElements = (trainingNode: TrainingNodeRelationshipResponse) => {
  const nodes: FlowNode[] = [
    {
      id: trainingNode.id,
      position: { x: 0, y: 0 },
      data: {
        label: safeText(trainingNode.name, trainingNode.id),
      },
    },
  ];
  const edges: FlowEdge[] = [];
  const seenNodeIds = new Set<string>([trainingNode.id]);
  const seenEdgeIds = new Set<string>();

  const addNode = (node: TrainingNodeReference, position: { x: number; y: number }) => {
    if (seenNodeIds.has(node.id)) {
      return;
    }

    seenNodeIds.add(node.id);
    nodes.push({
      id: node.id,
      position,
      data: {
        label: safeText(node.name, node.id),
      },
    });
  };

  const addEdge = (source: string, target: string) => {
    const edgeId = `${source}-${target}`;

    if (seenEdgeIds.has(edgeId)) {
      return;
    }

    seenEdgeIds.add(edgeId);
    edges.push({
      id: edgeId,
      source,
      target,
    });
  };

  normalizeList(trainingNode.parentEdges).forEach((edge, index) => {
    const parentNode = edge.parent;
    if (!parentNode) {
      return;
    }

    addNode(parentNode, { x: -260 + index * 220, y: -180 });

    addEdge(parentNode.id, trainingNode.id);

    const siblingEdges = normalizeList(parentNode.childEdges);

    siblingEdges.forEach((siblingEdge, siblingIndex) => {
      const siblingNode = siblingEdge.child;

      if (!siblingNode || siblingNode.id === trainingNode.id) {
        return;
      }

      const siblingOffset = siblingIndex - Math.floor(siblingEdges.length / 2);
      addNode(siblingNode, {
        x: -260 + index * 220 + siblingOffset * 180,
        y: -20,
      });
      addEdge(parentNode.id, siblingNode.id);
    });
  });

  normalizeList(trainingNode.childEdges).forEach((edge, index) => {
    const childNode = edge.child;
    if (!childNode) {
      return;
    }

    addNode(childNode, { x: -260 + index * 220, y: 180 });
    addEdge(trainingNode.id, childNode.id);
  });

  return { nodes, edges };
};

const ViewTraining = () => {
  const navigate = useNavigate();
  const { labId, trainingId } = useParams<'labId' | 'trainingId'>();

  const [trainingData, setTrainingData] = useState<TrainingNodeRelationshipResponse | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchTrainingData = async () => {
      if (!trainingId) {
        if (active) {
          setError('Training ID is missing in the URL.');
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError(null);
        setTrainingData(null);
        setNodes([]);
        setEdges([]);
      }

      try {
        const response = await api.get(`/api/trainings/${encodeURIComponent(trainingId)}`);
        const payload = response.data?.data as TrainingNodeRelationshipResponse | null | undefined;

        if (!payload) {
          throw new Error('An unexpected error occurred: the API returned no data for the training record.');
        }

        const flowElements = buildFlowElements(payload);

        if (active) {
          setTrainingData(payload);
          setNodes(flowElements.nodes);
          setEdges(flowElements.edges);
        }
      } catch (requestError) {
        console.error('Error fetching training data:', requestError);

        let message = 'Failed to fetch training details. Please try again later.';

        if (axios.isAxiosError<{ message?: string }>(requestError)) {
          if (requestError.response?.status === 404) {
            message = 'Training record not found.';
          } else {
            message = requestError.response?.data?.message ?? requestError.message ?? message;
          }
        } else if (requestError instanceof Error) {
          message = requestError.message;
        }

        if (active) {
          setError(message);
          setTrainingData(null);
          setNodes([]);
          setEdges([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchTrainingData();

    return () => {
      active = false;
    };
  }, [trainingId]);

  const goBackPath = labId ? `/lab-management/lab/${labId}` : '/lab-management';

  if (loading) {
    return (
      <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ minHeight: '56vh', display: 'grid', placeItems: 'center', px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 640,
              width: '100%',
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#0F172A', 0.08),
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={44} />
              <Alert severity="info" sx={{ width: '100%', alignItems: 'center' }}>
                Loading training details from the current API response.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.7 }}>
                We are fetching the training object and preparing the page shell. The graph canvas is
                kept in its own section so it can stay visually separate from the metadata above.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  if (error || !trainingData) {
    return (
      <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ minHeight: '56vh', display: 'grid', placeItems: 'center', px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 720,
              width: '100%',
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#dc2626', 0.16),
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Stack spacing={2}>
              <Alert severity="error" sx={{ alignItems: 'center' }}>
                {error ?? 'Unable to load the training details.'}
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                The training page only renders what the current endpoint returns. Try again, or go
                back to the lab page if the record is unavailable.
              </Typography>

              <Box>
                <Button
                  onClick={() => navigate(goBackPath)}
                  variant="contained"
                  startIcon={<ArrowBackOutlined />}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 800,
                    boxShadow: 'none',
                  }}
                >
                  Back to lab
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </GradientBox>
    );
  }

  const parentEdges = normalizeList(trainingData.parentEdges);
  const childEdges = normalizeList(trainingData.childEdges);
  const accent = typeAccentMap[trainingData.type] ?? typeAccentMap.GENERAL;
  const trainingName = safeText(trainingData.name, trainingData.id);
  const toolLabel = trainingData.tool ? safeText(trainingData.tool.name, trainingData.tool.id) : 'No tool attached';
  const toolIdLabel = trainingData.toolId ?? 'Not provided';

  return (
    <GradientBox sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Paper elevation={0} sx={heroSurfaceSx}>
          <Box
            sx={{
              position: 'absolute',
              top: -90,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0) 70%)',
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
              background: 'radial-gradient(circle, rgba(15,118,110,0.18) 0%, rgba(15,118,110,0) 68%)',
              pointerEvents: 'none',
            }}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2.5}
            sx={{
              position: 'relative',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
            }}
          >
            <SectionHeader
              eyebrow="Training viewer"
              title={trainingName}
              description="This page is wired to the current training endpoint only. The graph surface is kept in a separate container so your React Flow work can evolve independently."
              accent={accent}
            />

            <Button
              onClick={() => navigate(goBackPath)}
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              sx={{
                flexShrink: 0,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                px: 2.25,
              }}
            >
              Back to lab
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2.5, flexWrap: 'wrap' }}>
            <Chip label={`Type: ${trainingData.type}`} variant="outlined" sx={chipSx(accent)} />
            <Chip label={`Lab ID: ${trainingData.labId}`} variant="outlined" sx={chipSx('#2563EB')} />
            <Chip label={`Parents: ${parentEdges.length}`} variant="outlined" sx={chipSx('#0F766E')} />
            <Chip label={`Children: ${childEdges.length}`} variant="outlined" sx={chipSx('#7C3AED')} />
            <Chip label={`Tool ID: ${toolIdLabel}`} variant="outlined" sx={chipSx('#D97706')} />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageSurfaceSx, overflow: 'hidden' }}>
          <Stack spacing={2.5}>
            <SectionHeader
              eyebrow="Returned payload"
              title="Training metadata"
              description="These details come directly from the fetched object, with defensive fallbacks for anything the API leaves null."
              accent={accent}
            />

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
                label="Training name"
                value={
                  <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{trainingName}</Typography>
                }
                helper="Primary label returned by the training endpoint."
              />
              <DetailField
                label="Training type"
                value={
                  <Chip
                    size="small"
                    label={trainingData.type}
                    variant="outlined"
                    sx={chipSx(accent)}
                  />
                }
                helper="Used to distinguish general, lab, and tool nodes."
              />
              <DetailField
                label="Training ID"
                value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{trainingData.id}</Typography>}
                helper="Unique identifier from the current response."
              />
              <DetailField
                label="Lab ID"
                value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{trainingData.labId}</Typography>}
                helper="Lab reference attached to the returned training record."
              />
              <DetailField
                label="Tool reference"
                value={
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{toolLabel}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tool ID: {toolIdLabel}
                    </Typography>
                  </Stack>
                }
                helper="This can be null when the node is not bound to a tool."
              />
              <DetailField
                label="Relationships"
                value={
                  <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>
                        {parentEdges.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Parent edge{parentEdges.length === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>
                        {childEdges.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Child edge{childEdges.length === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                  </Stack>
                }
                helper="These counts are derived from the parentEdges and childEdges arrays in the payload."
              />
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageSurfaceSx, overflow: 'hidden' }}>
          <Stack spacing={2.25}>
            <SectionHeader
              eyebrow="Relationship graph"
              title="Node canvas"
              description="The React Flow surface sits in its own card so the graph can be refined later without reshaping the metadata section above."
              accent="#0F766E"
            />

            {parentEdges.length === 0 && childEdges.length === 0 ? (
              <Alert severity="info" variant="outlined">
                The current payload did not include any parent or child relationships, so the canvas
                only contains the current training node.
              </Alert>
            ) : null}

            <Box
              sx={{
                width: '100%',
                height: { xs: 520, md: 640, xl: 700 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#0F172A', 0.08),
                overflow: 'hidden',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
              }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={noop}
                onEdgesChange={noop}
                onConnect={noop}
                fitView
              />
            </Box>
          </Stack>
        </Paper>
      </Box>
    </GradientBox>
  );
};

export default ViewTraining;

