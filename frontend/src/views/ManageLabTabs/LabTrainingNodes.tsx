import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { alpha } from '@mui/material/styles';

import type { TrainingNodeSummary, ToolSummary, TrainingsTabProps, TrainingCardProps } from './commons/types';
import { resolveLabReference, safeText } from './commons/helperFunctions';
import DetailField from './components/DetailField';

import SectionHeader from './components/SectionHeader';
import { useNavigate } from 'react-router-dom';


const noop = () => {};

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


const resolveRelatedTool = (node: TrainingNodeSummary): ToolSummary | null => {
  const toolId = node.tool?.id ?? node.toolId;
  if (!toolId) {
    return null;
  }

  return {
    id: toolId,
    name: safeText(node.tool?.name, `Tool ${toolId}`),
  };
};

const resolveRelatedTrainingNodes = (node: TrainingNodeSummary, kind: 'parents' | 'children') => {
  if (kind === 'parents') {
    return firstNonEmptyList(node.parentNodes, node.parents, node.parentTrainingNodes);
  }

  return firstNonEmptyList(node.childNodes, node.children, node.childTrainingNodes);
};

const firstNonEmptyList = <T,>(...values: Array<T[] | null | undefined>) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [] as T[];
};


const RelatedNodeList = ({ nodes }: { nodes: TrainingNodeSummary[] }) => {
  if (!nodes.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Not provided in the current API payload.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {nodes.map((node) => (
        <Chip
          key={node.id}
          label={safeText(node.name, node.id)}
          size="small"
          variant="outlined"
          sx={{
            borderColor: alpha('#0F766E', 0.2),
            bgcolor: alpha('#0F766E', 0.06),
            color: '#0F766E',
            fontWeight: 700,
          }}
        />
      ))}
    </Stack>
  );
};

const TrainingCard = ({ trainingNode, currentLab }: TrainingCardProps) => {
  const labReference = resolveLabReference(currentLab, trainingNode.lab, trainingNode.labId);
  const navigate = useNavigate();

  return (
    <Paper elevation={0} sx={trainingCardShellSx}>
      <Box sx={{ height: 6, bgcolor: '#0F766E' }} />

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
            label={safeText(trainingNode.type, 'Type not provided')}
            variant="outlined"
            sx={{
              flexShrink: 0,
              borderColor: alpha('#0F766E', 0.2),
              bgcolor: alpha('#0F766E', 0.08),
              color: '#0F766E',
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
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}> 
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => navigate(`training/${trainingNode.id}`)}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  View
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => navigate(`training/${trainingNode.id}/edit`)}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  Edit
                </Button>
              </Stack>
            </Stack>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<BlockOutlined fontSize="small" />}
              onClick={() => navigate(`training/${trainingNode.id}/deactivate`)}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
            >
              Deactivate
            </Button>
          </Stack>
        </Box>
    </Paper>
  );
};


const TrainingsTab = ({ lab, trainingNodes }: TrainingsTabProps) => {
  const navigate = useNavigate();
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
          onClick={() => navigate("/lab-management/training/add")}
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

export default TrainingsTab;