import { Box, Typography, Paper } from "@mui/material"
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from 'react'
import api from "../../lib/api.js";
import { useNavigate, useLocation } from 'react-router-dom'

type CertificationType = {
  id: string;
  level: string;
  notes: string | null;
  issuedAt: string;
  updatedAt: string;
  lab: {
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

type CertificationProps = {
    certification: CertificationType;
    viewCertification: (certification: CertificationType) => void;
};

const levels = {
    LEVEL_1: "Level 1",
    LEVEL_2: "Level 2",
    LEVEL_3: "Level 3",
    LEVEL_4: "Level 4",
    LEVEL_5: "Level 5",
}

/* A single certification item */
function Certification({ certification, viewCertification }: CertificationProps) {

    return (

        <Paper
            key={certification.id}
            elevation={0}
            onClick={() => viewCertification(certification)}
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
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>{certification.lab.name}</Typography>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}> To: {certification.issuedTo.firstName} {certification.issuedTo.lastName}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}> {levels[certification.level as keyof typeof levels]}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}> Issued at: {new Date(certification.issuedAt).toLocaleDateString()}</Typography>

        </Paper>

    )
}

/* Most recent 5 certifications view (Part of Home page) */
export default function RecentCertifications() {
    const [recentCertifications, setRecentCertifications] = useState<CertificationType[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    const viewCertification = (certification: CertificationType) => {
        navigate(`/certifications/${certification.id}`, {
                state: { from: location.pathname } // Pass the current location as state so it can go back where it came from
        });
    };

    const addCertification = () => {
        navigate('/certifications/add',
            { state: {from: location.pathname} }
        ); // Pass the current location as state so it can go back where it came from
    };

    useEffect(() => {
        // Fetch recent certifications every 5 minutes
        const fetchRecentCertifications = async () => {
            try {
                const response = await api.get('/api/certifications/recent', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setRecentCertifications(response.data.data);
            }
            catch (error) {
                console.error("Error fetching recent certifications:", error);
            }
        };
        fetchRecentCertifications();
            const interval = setInterval(() => {
            fetchRecentCertifications();
        }, 300000);
        
        window.addEventListener("focus", fetchRecentCertifications);
        return () => clearInterval(interval);
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
                <Certification key={certification.id} certification={certification} viewCertification={viewCertification} />
                ))}
                {/* Add certification box */}
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









