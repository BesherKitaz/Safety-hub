import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TrainingNodeSummary, LabDetail } from './commons/types';
import { resolveLabReference, safeText } from './commons/helperFunctions';
import DetailField from './commons/DetailField';
import { ToolSummary } from './commons/types';


type TrainingCardProps = {
  trainingNode: TrainingNodeSummary;
  currentLab: LabDetail;
};


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
  const relatedTool = resolveRelatedTool(trainingNode);
  const parentNodes = resolveRelatedTrainingNodes(trainingNode, 'parents');
  const childNodes = resolveRelatedTrainingNodes(trainingNode, 'children');
  

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
            helper="Description value from the current response, if available."
          />

          <DetailField
            label="Lab"
            value={
              <Stack spacing={0.35}>
                <Typography sx={{ fontWeight: 700, color: 'text.primary', wordBreak: 'break-word' }}>
                  {safeText(labReference.name, labReference.id)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Lab ID: {labReference.id}
                </Typography>
              </Stack>
            }
            helper="This uses the nested lab info when present and falls back to the current lab context."
          />

          <DetailField
            label="Related tool"
            value={
              relatedTool ? (
                <Stack spacing={0.35}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', wordBreak: 'break-word' }}>
                    {relatedTool.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tool ID: {relatedTool.id}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No related tool is included in this response.
                </Typography>
              )
            }
            helper="Training nodes can still appear even if they are not linked to a tool."
          />

          <DetailField
            label="Parent nodes"
            value={<RelatedNodeList nodes={parentNodes} />}
            helper="Any related parent nodes returned by the current endpoint."
          />

          <DetailField
            label="Child nodes"
            value={<RelatedNodeList nodes={childNodes} />}
            helper="Any related child nodes returned by the current endpoint."
          />
        </Stack>
      </Stack>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button > Edit Lab </Button>
        <Button > Deactivate Lab </Button>
      </Box>
    </Paper>
  );
};


export default TrainingCard;