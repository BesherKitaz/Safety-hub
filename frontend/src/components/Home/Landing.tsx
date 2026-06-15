import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GradientBox from "../ui/GradientBox.js";
import SearchBox from "../ui/SearchBox.js";
import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const Landing = () => {
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  useEffect(() => {
    const getUserName = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return Promise.resolve(null);
      }
      const userInfo = await api.get('/api/user/name', { headers: { Authorization: `Bearer ${token}` } });
      setUserFirstName(userInfo.data.data.firstName);
    };

    getUserName()

  }, []);
  return (
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
  );
};

export default Landing;
