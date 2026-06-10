import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GradientBox from "./ui/GradientBox.js";
import SearchBox from "./ui/SearchBox.jsx";

const Landing = () => {
  return (
    <GradientBox
      sx={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Welcome to Safety Hub
        </Typography>
        <Box sx={{ mb: 3 }}>
          <SearchBox
            onSearch={(value: string) => {
              console.log("Search submitted:", value);
            }}
          />
        </Box>
        <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          Your one-stop solution for all your safety needs. Explore our comprehensive
          resources, tools, and services designed to keep you safe in any situation.
        </Typography>
      </Box>
    </GradientBox>
  );
};

export default Landing;
