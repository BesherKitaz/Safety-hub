import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  Modal,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';

import api from '../lib/api';
import GradientBox from '../components/ui/GradientBox';

type LabSummary = {
  id: string;
  name?: string | null;
  description?: string | null;
};

type ToolSummary = {
  id: string;
  name?: string | null;
};

type TrainingNodeSummary = {
  id: string;
  name?: string | null;
  type?: string | null;
  description?: string | null;
  lab?: LabSummary | null;
  labId?: string | null;
  tool?: ToolSummary | null;
  toolId?: string | null;
  parentNodes?: TrainingNodeSummary[] | null;
  childNodes?: TrainingNodeSummary[] | null;
  parents?: TrainingNodeSummary[] | null;
  children?: TrainingNodeSummary[] | null;
  parentTrainingNodes?: TrainingNodeSummary[] | null;
  childTrainingNodes?: TrainingNodeSummary[] | null;
};

type LabTool = {
  id: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lab?: LabSummary | null;
  labId?: string | null;
  trainingNode?: ToolSummary | null;
  trainingNodeId?: string | null;
};

type LabDetail = {
  id: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tools?: LabTool[] | null;
  trainingNodes?: TrainingNodeSummary[] | null;
};



const ToolEditModal = ({
  open,
  onClose,
  onUpdate,
  toolId,
  popData,
}: {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
  toolId: string;
  popData?: { description: string; name: string };
}) => {
  const [toolName, setToolName] = useState(popData?.name || "");
  const [toolDescription, setToolDescription] = useState(
    popData?.description || ""
  );

  const handleUpdateTool = async () => {
    try {
      const response = await api.put(`/api/tools/update/${toolId}`, {
        name: toolName,
        description: toolDescription,
      });

      console.log(`response from updating tool ${toolId}:`, response.data);

      await onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating tool:", error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6">Edit Tool</Typography>

        <TextField
          label="Name"
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Description"
          value={toolDescription}
          onChange={(e) => setToolDescription(e.target.value)}
          fullWidth
          margin="normal"
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Button sx={{ mt: 3 }} variant="contained" onClick={handleUpdateTool}>
            Update
          </Button>
          <Button sx={{ mt: 3 }} variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};


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

const detailFieldSx = {
  p: 2,
  borderRadius: 3,
  border: '1px solid',
  borderColor: alpha('#2563EB', 0.1),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
};

const toolCardShellSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#2563EB', 0.14),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.07)',
  transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: alpha('#2563EB', 0.28),
    boxShadow: '0 22px 44px rgba(15, 23, 42, 0.10)',
  },
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

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const safeText = (value?: string | null, fallback = 'Not provided') => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const normalizeList = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

const firstNonEmptyList = <T,>(...values: Array<T[] | null | undefined>) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [] as T[];
};

const resolveLabReference = (
  currentLab: LabDetail,
  relatedLab?: LabSummary | null,
  relatedLabId?: string | null,
): LabSummary => {
  const referenceId = relatedLab?.id ?? relatedLabId ?? currentLab.id;

  return {
    id: referenceId,
    name: safeText(relatedLab?.name ?? currentLab.name, referenceId),
    description: relatedLab?.description ?? currentLab.description ?? null,
  };
};

const resolveTrainingNodeLink = (tool: LabTool): ToolSummary | null => {
  const trainingNodeId = tool.trainingNode?.id ?? tool.trainingNodeId;
  if (!trainingNodeId) {
    return null;
  }

  return {
    id: trainingNodeId,
    name: safeText(tool.trainingNode?.name, `Training node ${trainingNodeId}`),
  };
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

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  accent: string;
};

const SectionHeader = ({ eyebrow, title, description, accent }: SectionHeaderProps) => (
  <Stack spacing={0.75}>
    <Typography
      variant="overline"
      sx={{
        color: accent,
        fontWeight: 800,
        letterSpacing: 1.8,
        lineHeight: 1,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography
      component="h2"
      sx={{
        fontSize: { xs: 22, md: 28 },
        fontWeight: 800,
        lineHeight: 1.1,
        color: 'text.primary',
      }}
    >
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {description}
      </Typography>
    )}
  </Stack>
);

type DetailFieldProps = {
  label: string;
  value: ReactNode;
  helper?: string;
};

const DetailField = ({ label, value, helper }: DetailFieldProps) => (
  <Box sx={detailFieldSx}>
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 1.15,
        color: 'text.secondary',
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: 1 }}>{value}</Box>
    {helper && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
        {helper}
      </Typography>
    )}
  </Box>
);

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
type ToolCardProps = {
  tool: LabTool;
  currentLab: LabDetail;
};

const ToolCard = ({ tool, currentLab }: ToolCardProps) => {
  const [toolData, setToolData] = useState<LabTool>(tool);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const labReference = resolveLabReference(currentLab, toolData.lab, toolData.labId);
  const trainingNodeReference = resolveTrainingNodeLink(toolData);

  const handleEditModalOpen = () => setEditModalOpen(true);
  const handleEditModalClose = () => setEditModalOpen(false);

  const fetchToolData = async () => {
    try {
      const response = await api.get(`/api/tools/updated/${toolData.id}`);
      setToolData({
        ...toolData,
        name: response.data.data.name,
        description: response.data.data.description,
      });
    } catch (error) {
      console.error("Error fetching updated tool data:", error);
    }
  };

  const handleToolUpdated = async () => {
    await fetchToolData();
  };

  if (!toolData?.id || !toolData.name || !toolData.description) {
    return null;
  }

  return (
    <>
      <ToolEditModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        onUpdate={handleToolUpdated}
        toolId={toolData.id}
        popData={{
          name: toolData.name,
          description: toolData.description,
        }}
      />      
      <Paper elevation={0} sx={toolCardShellSx}>
        <Box sx={{ height: 6, bgcolor: '#2563EB' }} />

        <Stack spacing={2.25} sx={{ p: 2.5, flexGrow: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.15, color: '#111827' }}>
                {safeText(toolData.name, `Tool ${toolData.id}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                Tool ID: {toolData.id}
              </Typography>
            </Box>

            <Chip
              size="small"
              label="Tool"
              variant="outlined"
              sx={{
                flexShrink: 0,
                borderColor: alpha('#2563EB', 0.2),
                bgcolor: alpha('#2563EB', 0.08),
                color: '#1D4ED8',
                fontWeight: 700,
              }}
            />
          </Stack>

          <Stack spacing={1.25}>
            <DetailField
              label="Description"
              value={
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {safeText(toolData.description, 'No description provided.')}
                </Typography>
              }
              helper="Description value from the existing lab detail response."
            />

            <DetailField
              label="Related training node"
              value={
                trainingNodeReference ? (
                  <Stack spacing={0.35}>
                    <Link
                      component={RouterLink}
                      to={`/training-nodes/${trainingNodeReference.id}`}
                      underline="hover"
                      sx={{ fontWeight: 700 }}
                    >
                      {trainingNodeReference.name}
                    </Link>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Training node ID: {trainingNodeReference.id}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    This tool doesn't require any training
                  </Typography>
                )
              }
            />

            <DetailField
              label="Created at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(toolData.createdAt)}</Typography>}
            />

            <DetailField
              label="Updated at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(toolData.updatedAt)}</Typography>}
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
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditOutlined fontSize="small" />}
                onClick={handleEditModalOpen}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
              >
                Edit
              </Button>
            </Stack>

            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<BlockOutlined fontSize="small" />}
              onClick={noop}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
            >
              Deactivate
            </Button>
          </Stack>
        </Box>
      </Paper>
    </>
  );
};

type TrainingCardProps = {
  trainingNode: TrainingNodeSummary;
  currentLab: LabDetail;
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
        <PlaceholderActions destructiveLabel="Deactivate" />
      </Box>
    </Paper>
  );
};

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
type ToolsTabProps = {
  lab: LabDetail;
  tools: LabTool[];
};

const ToolsTab = ({ lab, tools }: ToolsTabProps) => {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        <SectionHeader
          eyebrow="Tools"
          title="Lab tools"
          description="Each card is rendered from the tool objects already included in the lab detail response."
          accent="#2563EB"
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
          Add Tool
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip label={`${tools.length} tool${tools.length === 1 ? '' : 's'}`} />
        <Chip label={`Lab: ${safeText(lab.name, lab.id)}`} variant="outlined" />
      </Stack>

      {tools.length === 0 ? (
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
            No tools found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            This lab does not have any tool entries in the current API response yet.
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
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} currentLab={lab} />
          ))}
        </Box>
      )}
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

