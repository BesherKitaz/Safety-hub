import React from 'react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import api from '../lib/api'

import { Box, Button, Paper, Alert, CircularProgress, Typography } from '@mui/material'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Link as RouterLink } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add';






const LabManagement = () => {
    const params = useParams<{ labId: string }>();
    const { labId } = params;
    const [labData, setLabData] = useState<any>(null);
    const [tab, setTab] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    
    useEffect(() => {
        const fetchLabData = async () => {
            if (!labId) {
                setError("Lab ID is missing in the URL.");
                setLoading(false);
                return;
            }   

            try {
                const response = await api.get(`/api/labs/${encodeURIComponent(labId)}`);
                console.log("Lab data fetched successfully:", response.data.data);
                setLabData(response.data.data);
            } catch (error) {
                setError("Failed to fetch lab data. Please try again later.");
                console.error("Error fetching lab data:", error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchLabData()
    }, [labId])


    if (loading) {
        return (
            <CircularProgress 
                style={{ display: 'block', margin: '0 auto', marginTop: '40px' }}
            />
        )
    }

    if (error) {
        return (<Alert severity="error">{error}</Alert>)
    }

    return (
    <>
        {loading && <CircularProgress />}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
            <>
                <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                    <Tab label="Lab Info" />
                    <Tab label="Tools" />
                    <Tab label="Trainings" />
                </Tabs>

                {tab === 0 && (
                    <Typography variant="h6" component="div" sx={{ p: 2 }}>
                        Lab Info
                    </Typography>
                )}

                {tab === 1 && (
                    <Typography variant="h6" component="div" sx={{ p: 2 }}>
                        Tools
                    </Typography>
                )}

                {tab === 2 && (
                    <Typography variant="h6" component="div" sx={{ p: 2 }}>
                        Trainings
                    </Typography>
                )}
            </>
        )}
    </>
    )
}


export default LabManagement