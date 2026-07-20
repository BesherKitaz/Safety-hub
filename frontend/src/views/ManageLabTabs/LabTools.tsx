import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Link, Paper, Stack, Typography, TextField, Modal } from '@mui/material';
import { EditOutlined, BlockOutlined, FlashOnOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import api from '../../lib/api';

import type { LabTool, LabDetail, ToolSummary } from './commons/types';
import { safeText, formatDateTime } from './commons/helperFunctions';
import DetailField from './components/DetailField';
import SectionHeader from './components/SectionHeader';

const getToolErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ error?: { message?: string }; message?: string }>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

type ToolCardProps = {
  tool: LabTool;
  currentLab: LabDetail;
  onToolChanged: () => void | Promise<void>;
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


const ToolModalForm = ({
  open,
  onClose,
  onUpdate,
  toolId,
  popData,
  mode,
  labId,
}: {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
  toolId?: string | null;
  popData?: { description?: string; name: string } | null;
  labId?: string | null;
  mode: "create" | "edit";
}) => {
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setToolName(popData?.name || "");
      setToolDescription(popData?.description || "");
      setFormError(null);
    }
  }, [open, popData]);

  const handleSubmitTool = async () => {
    const normalizedName = toolName.trim();
    const normalizedDescription = toolDescription.trim();

    if (!normalizedName) {
      setFormError('Tool name is required.');
      return;
    }

    if (mode === "edit" && !toolId) {
      setFormError('Tool ID is required for editing.');
      return;
    }

    if (mode === "create" && !labId) {
      setFormError('Lab ID is required for creating a tool.');
      return;
    }

    try {
      setFormError(null);

      if (mode === "create") {
        const response = await api.post(`/api/tools/create`, {
          labId: labId,
          name: normalizedName,
          description: normalizedDescription || undefined,
        });

        console.log("response from creating tool:", response.data);
      }

      if (mode === "edit") {
        const response = await api.put(`/api/tools/update/${toolId}`, {
          labId: labId,
          name: normalizedName,
          description: normalizedDescription || undefined,
        });

        console.log(`response from updating tool ${toolId}:`, response.data);
      }

      await onUpdate();
      onClose();
    } catch (error) {
      const fallbackMessage = mode === "create"
        ? 'Something went wrong while creating the tool.'
        : 'Something went wrong while updating the tool.';
      setFormError(getToolErrorMessage(error, fallbackMessage));
      console.error(
        mode === "create" ? "Error creating tool:" : "Error updating tool:",
        error
      );
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
        <Typography variant="h6">
          {mode === "create" ? "Create Tool" : "Edit Tool"}
        </Typography>

        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}

        <TextField
          label="Name"
          value={toolName}
          onChange={(e) => {
            setToolName(e.target.value);
            if (formError) {
              setFormError(null);
            }
          }}
          required
          fullWidth
          margin="normal"
        />

        <TextField
          label="Description"
          value={toolDescription}
          onChange={(e) => setToolDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
          helperText="Optional. Leave this blank if the tool does not need a description."
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Button sx={{ mt: 3 }} variant="contained" onClick={handleSubmitTool}>
            {mode === "create" ? "Create" : "Update"}
          </Button>

          <Button sx={{ mt: 3 }} variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
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
  popData:{ description?: string; name: string };
}) => {
  if (!toolId) {
    return (
      <Alert severity="error">
        Tool ID is required. Something went wrong.
      </Alert>
    );
  }

  return (
    <>
      {!popData && (
        <Alert severity="warning">Failed to load tool data</Alert>
      )}

      <ToolModalForm
        open={open}
        onClose={onClose}
        onUpdate={onUpdate}
        toolId={toolId}
        popData={popData}
        mode="edit"
      />
    </>
  );
};

const ToolCreateModal = ({
  open,
  onClose,
  onUpdate,
  labId,
}: {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
  labId: string;
}) => {
  return (
    <ToolModalForm
      open={open}
      onClose={onClose}
      onUpdate={onUpdate}
      mode="create"
      labId={labId}
    />
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



const ToolCard = ({ tool, currentLab, onToolChanged }: ToolCardProps) => {
  const [toolData, setToolData] = useState<LabTool>(tool);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const trainingNodeReference = resolveTrainingNodeLink(toolData);
  const isLabActive = currentLab.isActive !== false;
  const isToolActive = toolData.isActive !== false;

  useEffect(() => {
    setToolData(tool);
  }, [tool]);

  const handleEditModalOpen = () => setEditModalOpen(true);
  const handleEditModalClose = () => setEditModalOpen(false);

  const handleToolUpdated = async () => {
    await onToolChanged();
  };

  const handleDeactivate = async () => {
    try {
      setBusy(true);
      await api.patch(`/api/tools/${encodeURIComponent(toolData.id)}/deactivate`);
      setDeactivateOpen(false);
      await onToolChanged();
    } catch (error) {
      console.error('Error deactivating tool:', error);
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    try {
      setBusy(true);
      await api.patch(`/api/tools/${encodeURIComponent(toolData.id)}/activate`);
      await onToolChanged();
    } catch (error) {
      console.error('Error activating tool:', error);
    } finally {
      setBusy(false);
    }
  };

  if (!toolData?.id || !toolData.name) {
    return null;
  }

  return (
    <>
      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Deactivate tool?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ lineHeight: 1.7 }}>
            Deactivating this tool will also deactivate its associated training node. The training node will stay inactive until it is reactivated manually.
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
        <Box sx={{ height: 6, bgcolor: isToolActive ? '#2563EB' : '#6B7280' }} />

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
              label={isToolActive ? 'Active' : 'Inactive'}
              variant="outlined"
              sx={{
                flexShrink: 0,
                borderColor: isToolActive ? alpha('#2563EB', 0.2) : alpha('#6B7280', 0.2),
                bgcolor: isToolActive ? alpha('#2563EB', 0.08) : alpha('#6B7280', 0.08),
                color: isToolActive ? '#1D4ED8' : '#4B5563',
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
            {isToolActive ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={handleEditModalOpen}
                  disabled={!isLabActive}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<BlockOutlined fontSize="small" />}
                  onClick={() => setDeactivateOpen(true)}
                  disabled={!isLabActive}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                >
                  Deactivate
                </Button>
              </Stack>
            ) : (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<FlashOnOutlined fontSize="small" />}
                onClick={handleActivate}
                disabled={!isLabActive || busy}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
              >
                Activate
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>
    </>
  );
};

const ToolsTab = ({ lab, tools }: ToolsTabProps) => {
  const [toolList, setToolList] = useState<LabTool[]>(tools);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const isLabActive = lab.isActive !== false;
  const visibleToolList = showInactive ? toolList : toolList.filter((tool) => tool.isActive !== false);

  const handleCreateModalOpen = () => {
    setCreateModalOpen(true);
  };
  const handleCreateModalClose = () => setCreateModalOpen(false);

  const handleToolListUpdate = async () => {
    try {
      const response = await api.get(`/api/labs/${lab.id}/tools`);
      setToolList(response.data.data);
    } catch (error) {
      console.error('Error fetching updated tool list:', error);
    }
  };

  return (
    <>
      <ToolCreateModal
        open={createModalOpen}
        onClose={handleCreateModalClose}
        onUpdate={handleToolListUpdate}
        labId={lab.id}
      />
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

          <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => setShowInactive((current) => !current)}
              sx={{
                flexShrink: 0,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              {showInactive ? 'Hide inactive tools' : 'Show inactive tools'}
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateModalOpen}
              disabled={!isLabActive}
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
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label={`${visibleToolList.length} visible tool${visibleToolList.length === 1 ? '' : 's'}`} />
          <Chip label={`${toolList.filter((tool) => tool.isActive === false).length} inactive`} variant="outlined" />
          <Chip label={`Lab: ${safeText(lab.name, lab.id)}`} variant="outlined" />
        </Stack>

        {visibleToolList.length === 0 ? (
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
              {showInactive ? 'No tools found' : 'No active tools found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              {showInactive
                ? 'This lab does not have any tool entries in the current API response yet.'
                : 'Inactive tools are hidden by default. Use the toggle above to show them.'}
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
            {visibleToolList.map((tool) => (
              <ToolCard key={tool.id} tool={tool} currentLab={lab} onToolChanged={handleToolListUpdate} />
            ))}
          </Box>
        )}
      </Stack>
    </>
  );
};

export default ToolsTab;






