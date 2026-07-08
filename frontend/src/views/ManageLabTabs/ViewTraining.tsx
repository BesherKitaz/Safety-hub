import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Stack } from '@mui/material';

import api from '../../lib/api';

import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

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

const noop = () => {};

const ViewTraining = () => {
    const { trainingId } = useParams();
    const [trainingData, setTrainingData] = useState<TrainingNodeRelationshipResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);



    useEffect(() => {
        const fetchTrainingData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/trainings/${trainingId}`);
                console.log('Training data fetched:', response.data.data);
                const trainingNode = response.data.data
                setNodes([{ id: trainingNode.id, position: { x: 0, y: 0 }, data: { label: trainingNode.name } }]);
                trainingNode.parentEdges.forEach((parentEdge: TrainingParentEdge, index: number) => {
                    const parentNode = parentEdge.parent;
                    setNodes(prevNodes => [...prevNodes, { id: parentNode.id, position: { x: 10 + (index * 100), y: -100 }, data: { label: parentNode.name } }]);
                    setEdges(prevEdges => [...prevEdges, { id: `${parentNode.id}-${trainingNode.id}`, source: parentNode.id, target: trainingNode.id }]);
                });
                trainingNode.childEdges.forEach((childEdge: TrainingChildEdge, index: number) => {
                    const childNode = childEdge.child;
                    setNodes(prevNodes => [...prevNodes, { id: childNode.id, position: { x: 10 + (index * 200), y: 100 }, data: { label: childNode.name } }]);
                    setEdges(prevEdges => [...prevEdges, { id: `${trainingNode.id}-${childNode.id}`, source: trainingNode.id, target: childNode.id }]);
                });
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
        <Stack spacing={2} sx={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }} >
        <Box style={{ width: '70vw', height: '70vh', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
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
    );
}


export default ViewTraining;