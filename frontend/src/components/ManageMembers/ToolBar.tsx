import { Typography, Box } from "@mui/material";
import GradientBox from "../ui/GradientBox";



const ToolBar = () => {
  return (
    <GradientBox
      sx={{
        minHeight: "calc(35vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          <Typography
          Hello, {userFirstName}
        </Typography>
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
    </GradientBox>
  );
};

export default SecondaryNavBar;
