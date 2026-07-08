import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

import api from '../../lib/api';



export type TrainingNodeType = "GENERAL" | "LAB" | "TOOL";

export type TrainingNodeReference = {
  id: string;
  name: string;
  type: TrainingNodeType;
};

export type TrainingToolReference = {
  id: string;
  name: string;
};

export type TrainingParentEdge = {
  parent: TrainingNodeReference & {
    childEdges: {
      child: TrainingNodeReference;
    }[];
  };
};

export type TrainingChildEdge = {
  child: TrainingNodeReference;
};

export type TrainingNodeRelationshipResponse = {
  id: string;
  name: string;
  type: TrainingNodeType;
  labId: string;
  toolId: string | null;
  tool: TrainingToolReference | null;
  parentEdges: TrainingParentEdge[];
  childEdges: TrainingChildEdge[];
};

const ViewTraining = () => {
    const { trainingId } = useParams();
    const [trainingData, setTrainingData] = useState<TrainingNodeRelationshipResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrainingData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/trainings/${trainingId}`);
                setTrainingData(response.data.data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("An unexpected error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTrainingData();
    }, [trainingId]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">Error: {error}</Alert>;
    if (!trainingData) return <Alert severity="warning">No training data found.</Alert>;

    return (
        <Box sx={{ p: 3 }}  >
            <Typography variant="h4" gutterBottom>
                Training Details
            </Typography>
            <Typography variant="body1">
                {trainingData.name}
            </Typography>
        </Box>
    );
}


export default ViewTraining;