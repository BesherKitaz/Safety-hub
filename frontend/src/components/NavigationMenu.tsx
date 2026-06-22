import { AppBar, Toolbar, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom'
import NavButton from "./ui/navButton";

const Navbar = () => {

  
  const navigate = useNavigate();

  if (!localStorage.getItem("token")) {
    return (<></>)
  }

  const logout = () => {
    // Logout logic here
    localStorage.removeItem("token");
    navigate("/login");
  };

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
        <NavButton to="/certifications" label="Certifications" />
        <NavButton label="Manage members" color="" to="/manage-members" />
        <NavButton label="Manage Lab" color="" to="/manage-categories" />
        <NavButton to="/profile" label="Profile" />
        <NavButton label="Log out" color="" onClick={logout} />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;