import { Typography, TextField, Paper, Box, MenuItem, Button, Stack, Collapse, Autocomplete, Alert, Chip } from '@mui/material'
import GradientBox from '../../components/ui/GradientBox'
import React, { useState, useEffect } from 'react'

import { useNavigate, useLocation, useParams } from 'react-router-dom';

import api from '../../lib/api';
import axios from 'axios';



const TrainingNodeTypeLabels = {
  GENERAL: "General",
  TOOL: "Tool",
} as const;

type TrainingNodeType = keyof typeof TrainingNodeTypeLabels;

type Lab = {
    id: string;
    name: string;
}

type Tool = {
  id: string;
  name: string;

}
type TrainingNodeData = {
    selectedLabId: string
    type: TrainingNodeType
    toolId?: string
    parentTrainingNodeIds: string[]
    childTrainingNodeIds: string[]
    name: string
    description?: string
}

type TrainingRelations = {
  parentEdges?: {
    parent?: {
      id: string;
      name: string;
      type: string;
      childEdges?: {
        child?: {
          id: string;
          name: string;
          type: string;
        } | null;
      }[] | null;
    } | null;
  }[] | null;

  childEdges?: {
    child?: {
      id: string;
      name: string;
      type: string;
    } | null;
  }[] | null;
};

type FetchedTrainingNodeData = {
  labId: string;
  name: string;
  description?: string | null;
  type: TrainingNodeType;
  toolId?: string | null;
} & TrainingRelations


const initialFormData: TrainingNodeData = {
  selectedLabId: '',
  type: 'GENERAL',
  toolId: '',
  parentTrainingNodeIds: [],
  childTrainingNodeIds: [],
  name: '',
  description: '',
};

type TrainingNodeOption = {
  id: string;
  name: string;
  type: TrainingNodeType;
  labId: string;
  isActive?: boolean;
  childEdges?: {
    childId: string;
  }[];
};

type CycleDetails = {
  parentId: string;
  childId: string;
  existingPath: string[];
};

// Search the proposed prerequisite graph so the form can explain invalid cycles.
const findDirectedPath = (
  nodes: TrainingNodeOption[],
  startId: string,
  targetId: string,
  currentTrainingId?: string,
): string[] | null => {
  const adjacency = new Map<string, string[]>();

  nodes.forEach((node) => {
    node.childEdges?.forEach(({ childId }) => {
      if (
        node.id === currentTrainingId ||
        childId === currentTrainingId
      ) {
        return;
      }
      adjacency.set(node.id, [...(adjacency.get(node.id) ?? []), childId]);
    });
  });

  const queue: string[][] = [[startId]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1]!;
    if (currentId === targetId) return path;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    (adjacency.get(currentId) ?? []).forEach((childId) => {
      if (!visited.has(childId)) queue.push([...path, childId]);
    });
  }

  return null;
};

// Add pending form edges to the graph and report the cycle they would create.
const findProposedCycle = (
  nodes: TrainingNodeOption[],
  parentIds: string[],
  childIds: string[],
  currentTrainingId?: string,
): CycleDetails | null => {
  for (const parentId of parentIds) {
    for (const childId of childIds) {
      const existingPath = findDirectedPath(
        nodes,
        childId,
        parentId,
        currentTrainingId,
      );
      if (existingPath) return { parentId, childId, existingPath };
    }
  }
  return null;
};


type LocationState = {
  from?: string;
  labId?: string;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  } | string;
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseError = error.response?.data?.error;
    const apiMessage =
      typeof responseError === 'object' && responseError !== null
        ? responseError.message
        : responseError;

    return apiMessage ?? error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

// Convert the API's nullable relationship shape into controlled form values.
const normalizeFetchedTrainingNodeData = (data: FetchedTrainingNodeData): TrainingNodeData => {
  const childTrainingNodeIds: string[] = [];
  const parentTrainingNodeIds: string[] = [];
  const childEdges = data.childEdges ?? [];
  const parentEdges = data.parentEdges ?? [];

  childEdges.forEach((edge) => {
    const childId = edge?.child?.id;
    if (childId && !childTrainingNodeIds.includes(childId)) {
      childTrainingNodeIds.push(childId);
    }
  });
  parentEdges.forEach((edge) => {
    const parentId = edge?.parent?.id;
    if (parentId && !parentTrainingNodeIds.includes(parentId)) {
      parentTrainingNodeIds.push(parentId);
    }
  });

  const normalizedData = {
    name: data.name ?? '',
    description: data.description ?? '',
    selectedLabId: data.labId ?? '',
    type: data.type,
    toolId: data.toolId ?? '',
    parentTrainingNodeIds: parentTrainingNodeIds,
    childTrainingNodeIds: childTrainingNodeIds,
  }
  return normalizedData;
} 


// Coordinate node metadata, tool requirements, and graph relationships.
const TrainingForm = ({ mode }: { mode: 'create' | 'edit' }) => {
    const [labs, setLabs] = useState<Lab[]>([])
    const [tools, setTools] = useState<Tool[]>([])
    const [trainingNodes, setTrainingNodes] = useState<TrainingNodeOption[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<TrainingNodeData>(
        initialFormData
    )

      const { labId, trainingId } = useParams<{ labId: string; trainingId: string }>();

      const navigate = useNavigate();
      const location = useLocation();


      const locationState = location.state as LocationState | null;

    const handleFormDataChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value,
        }))
    }


    useEffect(() => {
        const getLabs = async () => {
            try {
                const response = await api.get('api/labs/listings')
                const data = response.data.data
                setLabs(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("An Error Happened while fetching existing labs: ", error)
                setErrorMessage(getErrorMessage(error, 'Something went wrong while loading labs.'))
            }
        }
        getLabs()
    }, [])

    useEffect(() => {
      const getTools = async () => {
        try {
              const response = await api.get('api/tools/listings', {
                params: {
                  labId: formData.selectedLabId,
                }
              })
              const data = response.data.data
              setTools(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("An Error Happened while fetching existing tools: ", error)
            setErrorMessage(getErrorMessage(error, 'Something went wrong while loading tools.'))
        }
      } 
      if (formData.type === 'TOOL') {
        getTools()          
      }
      
    }, [formData.selectedLabId, formData.type])

    useEffect(() => {
      const getTrainingNodes = async () => {
        try {
              const response = await api.get('api/trainings/listings', {
                params: {
                  labId: formData.selectedLabId,
                }
              })
              const data = response.data.data
              setTrainingNodes(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("An Error Happened while fetching existing training nodes: ", error)
            setErrorMessage(getErrorMessage(error, 'Something went wrong while loading training nodes.'))
        }
      } 
      if (formData.selectedLabId) {
        getTrainingNodes();
      }
    }, [formData.selectedLabId])

    const goBack = () => {
      const returnLabId = formData.selectedLabId || labId || locationState?.labId;
      navigate(
        returnLabId
          ? `/lab-management/lab/${encodeURIComponent(returnLabId)}?tab=trainings`
          : '/lab-management',
      );
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!formData.selectedLabId) {
      setErrorMessage('Please select a lab before saving the training.');
      return;
    }
    if (!formData.type) {
      setErrorMessage('Please select a training type.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Training name is required.');
      return;
    }
    if (mode === 'edit' && !trainingId) {
      setErrorMessage('Training ID is missing from the edit route.');
      return;
    }
    if (selectedCycle) {
      setErrorMessage(`${formatCycle(selectedCycle)} This would make the training indirectly depend on itself.`);
      return;
    }

    const submitData = {
      labId: formData.selectedLabId,
      type: formData.type,
      toolId: formData.toolId,
      name: formData.name,
      description: formData.description,
      parentTrainingNodeIds: formData.parentTrainingNodeIds,
      childTrainingNodeIds: formData.childTrainingNodeIds,
    }

    try {
      setIsSubmitting(true);
      if (mode === 'edit') {
        await api.put(`/api/trainings/update/${encodeURIComponent(trainingId as string)}`, submitData);
      } else {
        await api.post('/api/trainings/add', submitData);
      }

      goBack();
    } catch (error) {
      console.error(mode === 'edit' ? 'Error updating training:' : 'Error adding training:', error);
      setErrorMessage(
        getErrorMessage(
          error,
          mode === 'edit'
            ? 'Something went wrong while updating the training.'
            : 'Something went wrong while creating the training.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

    const selectableTrainingNodes = trainingNodes.filter(
      (node) => node.id !== trainingId && node.isActive !== false
    );

    const parentOptions = selectableTrainingNodes.filter(
      (node) => !formData.childTrainingNodeIds.includes(node.id)
    );

    const childOptions = selectableTrainingNodes.filter(
      (node) => !formData.parentTrainingNodeIds.includes(node.id)
    );

    const nodeName = (id: string) =>
      trainingNodes.find((node) => node.id === id)?.name ?? id;
    const currentNodeName = formData.name.trim() || 'This training';
    const formatCycle = (cycle: CycleDetails) => {
      const path = [
        nodeName(cycle.parentId),
        currentNodeName,
        ...cycle.existingPath.map(nodeName),
      ].join(' → ');
      return `Cycle: ${path}.`;
    };
    const selectedCycle = findProposedCycle(
      trainingNodes,
      formData.parentTrainingNodeIds,
      formData.childTrainingNodeIds,
      trainingId,
    );
    const parentCycle = (candidateId: string) =>
      findProposedCycle(
        trainingNodes,
        [...formData.parentTrainingNodeIds, candidateId],
        formData.childTrainingNodeIds,
        trainingId,
      );
    const childCycle = (candidateId: string) =>
      findProposedCycle(
        trainingNodes,
        formData.parentTrainingNodeIds,
        [...formData.childTrainingNodeIds, candidateId],
        trainingId,
      );

    useEffect(() => {
      if (mode !== 'edit' || !trainingId) return;

      let active = true;

      const fetchTraining = async () => {
        try {
          const response = await api.get(`/api/trainings/${encodeURIComponent(trainingId)}`);
          const normalizedData = normalizeFetchedTrainingNodeData(response.data.data);

          if (!active) {
            return;
          }

          setFormData(normalizedData);
        } catch (error) {
          console.error("Error fetching training:", error);
          if (active) {
            setErrorMessage(
              getErrorMessage(error, 'Something went wrong while loading the training.')
            );
          }
        }
      };

      fetchTraining();

      return () => {
        active = false;
      };
    }, [mode, trainingId]);


    return (
    <GradientBox sx={{ minHeight: "calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))", px: 0, py: 0 }}>
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 3, color: "text.secondary" }}
          >
            Trainings
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              lineHeight: 1.1,
            }}
          >
            {mode === 'edit' ? 'Edit Training' : 'Add a Training'}
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            Add a new training to a user profile.
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={3}
          sx={{
            width: "100%",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2.5, md: 3 },
              borderBottom: "1px solid #e5e7eb",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
              Training details
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Select the lab, training type, and associated tool (if applicable) for the new training.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>

                <TextField
                    select
                    label="lab"
                    value={formData.selectedLabId}
                    onChange={(handleFormDataChange('selectedLabId'))}
                    fullWidth
                    required
                    disabled={mode === 'edit'}
                >
                    {labs && labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
                    {labs && labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                    {labs?.map( (lab) => (
                        <MenuItem value={lab.id} key={lab.id}> {lab.name} </MenuItem>
                    ))}        
                </TextField>
                <TextField
                    select
                    label="Training Type"
                    value={formData.type}
                    onChange={(handleFormDataChange('type'))}
                    fullWidth
                    required
                >
                    {Object.entries(TrainingNodeTypeLabels).map(([key, value]) => (
                        <MenuItem value={key} key={key}> {value} </MenuItem>
                    ))}        
                </TextField>
                <Collapse in={formData.type === 'TOOL'} timeout={300} unmountOnExit>
                  <TextField
                      select
                      label="Associated Tool"
                      value={formData.toolId}
                      onChange={(handleFormDataChange('toolId'))}
                      fullWidth
                      required
                  >
                      {tools && tools.length > 0 && <MenuItem value="">Select a tool</MenuItem>}
                      {tools && tools.length === 0 && <MenuItem value="">No tools found</MenuItem>}
                      {tools?.map((tool) => (
                          <MenuItem value={tool.id} key={tool.id}> {tool.name} </MenuItem>
                      ))}        
                    </TextField>
                  </Collapse>
                  <TextField
                      label="Training Name"
                      value={formData.name}
                      onChange={(handleFormDataChange('name'))}
                      fullWidth
                      required
                  >
                  </TextField>
                  <TextField
                    label="Training Description"
                    value={formData.description}
                    onChange={(handleFormDataChange('description'))}
                    fullWidth
                  ></TextField>
                  <Autocomplete<TrainingNodeOption, true>
                    multiple
                    options={parentOptions}
                    getOptionLabel={(option) => option.name}
                    getOptionDisabled={(option) => Boolean(parentCycle(option.id))}
                    value={trainingNodes.filter(node =>
                      formData.parentTrainingNodeIds.includes(node.id)
                    )}
                    onChange={(_, value) => {
                      setFormData(prev => ({
                        ...prev,
                        parentTrainingNodeIds: value.map(node => node.id),
                      }));
                    }}
                    renderOption={(props, option) => {
                      const cycle = parentCycle(option.id);
                      const { key, ...optionProps } = props;
                      return (
                        <Box component="li" key={key} {...optionProps}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            {cycle && (
                              <Typography variant="caption" color="error.main">
                                {formatCycle(cycle)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Parents — point into this training"
                      helperText="Direction: Parent → this training"
                    />
                    )}
                  />
                  <Autocomplete<TrainingNodeOption, true>
                    multiple
                    options={childOptions}
                    getOptionLabel={(option) => option.name}
                    getOptionDisabled={(option) => Boolean(childCycle(option.id))}
                    value={trainingNodes.filter(node =>
                      formData.childTrainingNodeIds.includes(node.id)
                    )}
                    onChange={(_, value) => {
                      setFormData(prev => ({
                        ...prev,
                        childTrainingNodeIds: value.map(node => node.id),
                      }));
                    }}
                    renderOption={(props, option) => {
                      const cycle = childCycle(option.id);
                      const { key, ...optionProps } = props;
                      return (
                        <Box component="li" key={key} {...optionProps}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            {cycle && (
                              <Typography variant="caption" color="error.main">
                                {formatCycle(cycle)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Children — this training points into them"
                      helperText="Direction: This training → Child"
                    />
                    )}
                  />
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: selectedCycle ? "error.light" : "divider",
                      bgcolor: selectedCycle ? "error.50" : "grey.50",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Relationship preview
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Arrows show the saved parent-to-child direction.
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                      {formData.parentTrainingNodeIds.map((id) => (
                        <Stack key={`parent-${id}`} direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                          <Chip size="small" label={nodeName(id)} />
                          <Typography aria-hidden="true">→</Typography>
                          <Chip size="small" color="primary" label={currentNodeName} />
                        </Stack>
                      ))}
                      {formData.childTrainingNodeIds.map((id) => (
                        <Stack key={`child-${id}`} direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                          <Chip size="small" color="primary" label={currentNodeName} />
                          <Typography aria-hidden="true">→</Typography>
                          <Chip size="small" label={nodeName(id)} />
                        </Stack>
                      ))}
                      {formData.parentTrainingNodeIds.length === 0 &&
                        formData.childTrainingNodeIds.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Select a parent or child to preview the relationship.
                          </Typography>
                        )}
                    </Stack>
                  </Box>
                  {selectedCycle && (
                    <Alert severity="error">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCycle(selectedCycle)}
                      </Typography>
                      <Typography variant="body2">
                        This is not allowed because it would make this training indirectly depend on itself.
                      </Typography>
                    </Alert>
                  )}
            </Stack>
              {errorMessage && (
                <Alert
                  severity="error"
                  onClose={() => setErrorMessage(null)}
                  sx={{ alignItems: "center", mt: 2 }}
                >
                  {errorMessage}
                </Alert>
              )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                type="button"
                variant="contained"
                onClick={goBack}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: "#dc2626",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#b91c1c",
                    boxShadow: "none",
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || Boolean(selectedCycle)}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.2,
                  backgroundColor: "#2563eb",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#1d4ed8",
                    boxShadow: "none",
                  },
                }}
              >
                {isSubmitting
                  ? (mode === 'edit' ? 'Updating Training…' : 'Adding Training…')
                  : (mode === 'edit' ? 'Update Training' : 'Add Training')}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
    )
}

export default TrainingForm
