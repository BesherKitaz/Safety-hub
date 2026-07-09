import { Typography, TextField, Paper, Box, MenuItem, Button, Stack, Collapse, Autocomplete } from '@mui/material'
import GradientBox from '../components/ui/GradientBox'
import React, { useState, useEffect } from 'react'

import { useNavigate, useLocation, useParams } from 'react-router-dom';

import api from '../lib/api';
import axios from 'axios';



enum TrainingNodeType {
  GENERAL = "General Training",
  LAB = "Lab Training",
  TOOL = "Tool Training",
}

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
  parentEdges: {
    parent: {
      id: string;
      name: string;
      type: string;
      childEdges: {
        child: {
          id: string;
          name: string;
          type: string;
        };
      }[];
    };
  }[];

  childEdges: {
    child: {
      id: string;
      name: string;
      type: string;
    };
  }[];
};

type FetchedTrainingNodeData = {
  labId: string;
  name: string;
  description?: string;
  type: TrainingNodeType;
  toolId?: string;
} & TrainingRelations


const initialFormData = {
    selectedLabId: '',
    type: TrainingNodeType.GENERAL,
    toolId: '',
    parentTrainingNodeIds: [],
    childTrainingNodeIds: [],
    name: '',
    description: ''
}

type TrainingNodeOption = {
  id: string;
  name: string;
  type: TrainingNodeType;
  labId: string;
};


type LocationState = {
  from?: string;
};

const normalizeFetchedTrainingNodeData = (data: FetchedTrainingNodeData): TrainingNodeData => {
  const childTrainingNodeIds: string[] = []
  const parentTrainingNodeIds: string[] = []

  data.childEdges.forEach(edge => {
    if (!childTrainingNodeIds.includes(edge.child.id)) {
      childTrainingNodeIds.push(edge.child.id);
    }
  });
  data.parentEdges.forEach(edge => {
    if (!parentTrainingNodeIds.includes(edge.parent.id)) {
      parentTrainingNodeIds.push(edge.parent.id);
    }
  });

  const normalizedData = {
    name: data.name,
    description: data.description,
    selectedLabId: data.labId,
    type: data.type,
    toolId: data.toolId,
    parentTrainingNodeIds: parentTrainingNodeIds,
    childTrainingNodeIds: childTrainingNodeIds,
  }
  return normalizedData;
} 


const TrainingForm = ({ mode }: { mode: 'create' | 'edit' }) => {
    const [labs, setLabs] = useState<Lab[]|null>(null)
    const [tools, setTools] = useState<Tool[]|null>(null)
    const [trainingNodes, setTrainingNodes] = useState<TrainingNodeOption[]>([]);
    const [errorMessage, setErrorMessage] = useState('')
    const [formData, setFormData] = useState<TrainingNodeData>(
        initialFormData
    )

      const { trainingId } = useParams<{ trainingId: string }>();

      const navigate = useNavigate();
      const location = useLocation();


      const from = (location.state as LocationState | null)?.from ?? "/lab-management";

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
                setLabs(data)
            } catch (error) {
                console.error("An Error Happened while fetching existing labs: ", error)
                setErrorMessage(`Something went wrong. Please try again: ${error}`)
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
              setTools(data)
        } catch (error) {
            console.error("An Error Happened while fetching existing tools: ", error)
            setErrorMessage(`Something went wrong. Please try again: ${error}`)
        }
      } 
      if (formData.type === "TOOL" as TrainingNodeType) {
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
              setTrainingNodes(data)
        } catch (error) {
            console.error("An Error Happened while fetching existing training nodes: ", error)
            setErrorMessage(`Something went wrong. Please try again: ${error}`)
        }
      } 
      if (formData.selectedLabId) {
        getTrainingNodes();
      }
    }, [formData.selectedLabId])

    const goBack = () => {
      navigate(from);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.selectedLabId) return;
    if (!formData.type) return;
    if (!formData.name) return;

    // Send the certification data to the backend
    const sendData = async () => {
      // Get the users data into the rest of the form data together
      const submitData = {
        labId: formData.selectedLabId,
        type: formData.type,
        toolId: formData.toolId,
        name: formData.name,
        description: formData.description,
        parentTrainingNodeIds: formData.parentTrainingNodeIds,
        childTrainingNodeIds: formData.childTrainingNodeIds,
      }
      console.log("submitData:", submitData);
      try {
        const response =await api.post("/api/trainings/add", submitData);
        console.log(response.data.error);
        console.log(response.data.message);
      } catch (error) {
        console.error("Error adding certification:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            setErrorMessage(error.response.data?.message ?? "Conflict error.");
          } else {
            setErrorMessage(
              error.response?.data?.message ?? error.message
            );
          }
        } 
      }
    }
    await sendData();
  }

    const parentOptions = trainingNodes.filter(
      (node) => !formData.childTrainingNodeIds.includes(node.id)
    );

    const childOptions = trainingNodes.filter(
      (node) => !formData.parentTrainingNodeIds.includes(node.id)
    );

    useEffect(() => {
      if (mode !== 'edit' || !trainingId) return;

      const fetchTraining = async () => {
        try {
          const response = await api.get(`/api/trainings/${trainingId}`);
          const normalizedData = normalizeFetchedTrainingNodeData(response.data.data);
          setFormData(prev => ({
            ...prev,
            selectedLabId: normalizedData.selectedLabId,
          }));
          setFormData(prev => ({
            ...prev,
            name: normalizedData.name,
            description: normalizedData.description,
            type: normalizedData.type,
            toolId: normalizedData.toolId,
          }));
        } catch (error) {
          console.error("Error fetching training:", error);
        }
      };

      fetchTraining();
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
                    {Object.entries(TrainingNodeType).map(([key, value]) => (
                        <MenuItem value={key} key={key}> {value} </MenuItem>
                    ))}        
                </TextField>
                <Collapse in={formData.type === "TOOL" as TrainingNodeType} timeout={300} unmountOnExit>
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
                    value={trainingNodes.filter(node =>
                      formData.parentTrainingNodeIds.includes(node.id)
                    )}
                    onChange={(_, value) => {
                      setFormData(prev => ({
                        ...prev,
                        parentTrainingNodeIds: value.map(node => node.id),
                      }));
                    }}
                    renderInput={(params) => (
                    <TextField {...params} label="Parent Training Nodes/Tools (What is this training part of?)" />
                    )}
                  />
                  <Autocomplete<TrainingNodeOption, true>
                    multiple
                    options={childOptions}
                    getOptionLabel={(option) => option.name}
                    value={trainingNodes.filter(node =>
                      formData.childTrainingNodeIds.includes(node.id)
                    )}
                    onChange={(_, value) => {
                      setFormData(prev => ({
                        ...prev,
                        childTrainingNodeIds: value.map(node => node.id),
                      }));
                    }}
                    renderInput={(params) => (
                    <TextField {...params} label="Child Training Nodes/Tools (What is part of this training?)" />
                    )}
                  />
            </Stack>
              {errorMessage && (
                <Typography variant="body1" color="error" sx= {{ fontWeight: "bold" }}>
                  {errorMessage}
                </Typography>
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
                Create Training
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
    )
}

export default TrainingForm
