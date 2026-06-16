import Landing from '../components/Home/Landing.js';
import Stats from '../components/Home/Stats.js';
import Certifications from '../components/Home/RecentCertifications.tsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../util/isLoggedIn';
import GradientBox from '../components/ui/GradientBox';
import { Box, Typography } from '@mui/material'
import api from '../lib/api.js';



const Home = () => {
    const [userFirstName, setUserFirstName] = useState<string | null>(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/login');
        }
        const getUserName = async () => {
        const token = localStorage.getItem('token');
        const userInfo = await api.get('/api/user/name', { headers: { Authorization: `Bearer ${token}` } });
        setUserFirstName(userInfo.data.data.firstName);
        }
        getUserName()
    }, []);

    return (
        <GradientBox>
            <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3, mt:2 } }>
                    Hello, {userFirstName}
                    </Typography>
            </Box>
        <Certifications />
        <Stats />
        <Landing />

        </GradientBox>
    )
}

export default Home; 