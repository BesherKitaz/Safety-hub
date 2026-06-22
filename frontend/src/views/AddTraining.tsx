import { Typography, TextField, Paper, Box, MenuItem, Button, Stack } from '@mui/material'
import GradientBox from '../components/ui/GradientBox'
import { useState, useEffect } from 'react'
import api from '../lib/api';


enum TrainingNodeType {
  GENERAL = "General Training",
  LAB = "Lab Training",
  TOOL = "Tool Training",
}

type Lab = {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

type TrainingNodeData = {
    selectedLab: Lab | null
    type: TrainingNodeType
    toolId?: string
    parentTrainingNodeIds: string[]
    childTrainingNodeIds: string[]
}


const initialFormData = {
    selectedLab: null,
    type: TrainingNodeType.GENERAL,
    toolId: '',
    parentTrainingNodeIds: [],
    childTrainingNodeIds: [],

}

const AddTraining = () => {

    const [labs, setLabs] = useState<Lab[]|null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [formData, setFormData] = useState<TrainingNodeData>(
        initialFormData
    )

    const handleFormDataChange = (field: string) => (value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }


    useEffect(() => {
        const getLabs = async () => {
            try {
                const response = await api.get('api/labs/')
                console.log("labs", response)
                const data = response.data.data
                setLabs(data)
            } catch (error) {
                console.error("An Error Happened while fetching existing labs: ", error)
                setErrorMessage(`Something went wrong. Please try again: ${error}`)
            }
        }
        getLabs()
    }, [])
    return (
    <GradientBox sx={{ minHeight: "calc(100vh - 72px)", px: 0, py: 0 }}>
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
            Add a Training
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            Add a new certification to a user profile.
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={()=> {}}
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
              Certification details
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Select the lab, level, and optional notes.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>

                <TextField
                    select
                    label="lab"
                    value={formData.selectedLab}
                    onChange={(handleFormDataChange('lab'))}
                    fullWidth
                    required
                >
                    {labs && labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
                    {labs && labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                    {labs?.map( (lab) => (<>
                        <MenuItem value={lab.name} key={lab.id}> {lab.name} </MenuItem>
                    </>
                    ))}        
                </TextField>
                <TextField
                    select
                    label="prerequisites"
                    value={"Tosho Mosh"}
                    onChange={() => {}}
                    fullWidth
                    required
                >
                    {labs && labs.length > 0 && <MenuItem value="">Select a lab</MenuItem>}
                    {labs && labs.length === 0 && <MenuItem value="">No labs found</MenuItem>}
                    {labs?.map( (lab) => (<>
                        <MenuItem value={lab.name} key={lab.id}> {lab.name} </MenuItem>
                    </>
                    ))}        
                </TextField>
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
                onClick={()=> {}}
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
                Certify
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </GradientBox>
    )
}

export default AddTraining