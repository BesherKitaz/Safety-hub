import React, {useState, useEffect} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Typography, Box, Paper } from '@mui/material'

import GradientBox from '../components/ui/GradientBox';
import SearchBox from '../components/ui/SearchBox';

const Certifications = () => {




  return (
   <GradientBox>

        <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3, mt:2 } }>
                Certifications
                </Typography>
        </Box>
        <Box
        sx={{
            minHeight: "calc(35vh - 72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
        }}
        >
        <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4 } }}>
            <Box sx={{ mb: 2 }}>
            <SearchBox
                onSearch={(value: string) => {
                console.log("Search submitted:", value);
                }}
            />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                Quick Search for Certifications. Search by student email or Lab
            </Typography>
        </Box>
        </Box>
        </GradientBox>
  );
};

export default Certifications;