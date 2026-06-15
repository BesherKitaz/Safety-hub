import { Box, Paper, Typography } from "@mui/material";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { useState, useEffect } from 'react'
import api from '../../lib/api.ts'






export default function Stats() {
    const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCertifications: 0,
    totalMentors: 0,
    certificationsThisMonth: 0,
    });


    const stats = [
        {
        label: "Total Number of Students",
        value: statsData.totalStudents,
        icon: PeopleOutlineIcon,
        accent: "#2563eb",
        background: "#eff6ff",
        },
        {
        label: "Total Number of Mentors",
        value: statsData.totalMentors,
        icon: PeopleOutlineIcon,
        accent: "#0f766e",
        background: "#ecfeff",
        },
        {
        label: "Total Number of Certificates",
        value: statsData.totalCertifications,
        icon: WorkspacePremiumIcon,
        accent: "#b45309",
        background: "#fff7ed",
        },
        {
        label: "Certificates Issued This Month",
        value: statsData.certificationsThisMonth,
        icon: EventAvailableIcon,
        accent: "#7c3aed",
        background: "#f5f3ff",
        },
    ];




    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                });
                setStatsData(response.data.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }

        fetchStats();
    }, [])



  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: 2,
        mx: "auto",
        maxWidth: 1200,
      }}
    >
      {stats.map(({ label, value, icon: Icon, accent, background }) => (
        <Paper
          key={label}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                 flexShrink: 0,
                backgroundColor: background,
                color: accent,
              }}
            >
              <Icon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 1.5 }}
              >
                {label}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "#111827", lineHeight: 1.1 }}
              >
                {value > 0 ? value : 0}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
