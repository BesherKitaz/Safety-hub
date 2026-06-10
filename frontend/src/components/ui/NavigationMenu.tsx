import { AppBar, Toolbar, Typography } from "@mui/material";
import NavButton from "./navButton";

const Navbar = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        color: "#1f2937",
        borderRadius: 0,
        boxShadow: "none",
        borderBottom: "1px solid #e5e7eb",
        m: 0,
        width: "100%",
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1.5 }}>
        <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          Safety Hub
        </Typography>
        <NavButton to="/" label="Home" />
        <NavButton to="/profile" label="Profile" />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;