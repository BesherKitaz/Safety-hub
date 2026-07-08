import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, Divider, Link, Paper, Stack, Typography, TextField, Modal } from '@mui/material';
import { EditOutlined, BlockOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { alpha } from '@mui/material/styles';
import api from '../../lib/api';

import type { LabTool, LabDetail, ToolSummary } from './commons/types';
import { safeText, resolveLabReference, formatDateTime } from './commons/helperFunctions';
import DetailField from './components/DetailField';
import SectionHeader from './components/SectionHeader';

type ToolCardProps = {
  tool: LabTool;
  currentLab: LabDetail;
};

type ToolsTabProps = {
  lab: LabDetail;
  tools: LabTool[];
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

const noop = () => {};

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


export default ToolsTab;