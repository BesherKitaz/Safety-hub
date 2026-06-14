import { Box, Typography, Paper } from "@mui/material"
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from 'react'
import api from "../../lib/api.js";

type CertificationType = {
  id: string;
  level: string;
  notes: string | null;
  issuedAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  issuedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  issuedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const levels = {
    LEVEL_1: "Level 1",
    LEVEL_2: "Level 2",
    LEVEL_3: "Level 3",
    LEVEL_4: "Level 4",
    LEVEL_5: "Level 5",
}

type RecentCertificationsProps = {
    onAddClick?: () => void;
};

function Certification({ certification }: { certification: CertificationType }) {

    const viewCertification = () => {
        // Implement the logic to view the certification
    };


    return (

        <Paper
            key={certification.id}
            elevation={0}
            onClick={viewCertification}
            sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            textAlign: "center",
            padding: 2,
            cursor: "pointer",
            p: 3,
            "&:hover": {
                borderColor: "#93c5fd",
                boxShadow: "0 10px 24px rgba(37, 99, 235, 0.08)",
                transform: "translateY(-1px)",
            },
            "&:focus-visible": {
                outline: "2px solid #2563eb",
                outlineOffset: 2,
            },

            }}
        >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>{certification.category.name}</Typography>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}> To: {certification.issuedTo.firstName} {certification.issuedTo.lastName}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}> {levels[certification.level as keyof typeof levels]}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}> Issued at: {new Date(certification.issuedAt).toLocaleDateString()}</Typography>

        </Paper>

    )
}


export default function RecentCertifications({ onAddClick }: RecentCertificationsProps) {
    const [recentCertifications, setRecentCertifications] = useState<CertificationType[]>([]);


    const addCertification = () => {
        // Implement the logic to add a new certification
    };

    useEffect(() => {
        const fetchRecentCertifications = async () => {
            try {
                const response = await api.get('/api/certifications/recent', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setRecentCertifications(response.data);
            }
            catch (error) {
                console.error("Error fetching recent certifications:", error);
            }
        };
        fetchRecentCertifications();
    }, []);

    return (    
        <Box sx={{ mx: "auto", width: "100%", mb: 6 }}>
            <Typography
                variant="h4"
                sx={{
                maxWidth: 1200,
                mx: "auto",
                mb: 4,
                }}
            >
                Recent Certifications
            </Typography>

            <Box
                sx={{
                maxWidth: 1400, 
                mx: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 2,
                width: "100%",
                }}
            >
                {recentCertifications.map((certification) => (
                <Certification key={certification.id} certification={certification} />
                ))}
            <Paper
                component="button"
                type="button"
                elevation={0}
                onClick={addCertification}
                aria-label="Add certification"
                sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                overflow: "hidden",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                width: "100%",
                padding: 0,
                appearance: "none",
                transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
                "&:hover": {
                    borderColor: "#93c5fd",
                    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.08)",
                    transform: "translateY(-1px)",
                },
                "&:focus-visible": {
                    outline: "2px solid #2563eb",
                    outlineOffset: 2,
                },
                }}
            >
                <AddIcon sx={{ fontSize: 40, color: "#2563eb" }} />
                <Typography variant="body2" sx={{ mb: 1 }} >Add Certification</Typography>
            </Paper>
            </Box>
        </Box>
    );
}









