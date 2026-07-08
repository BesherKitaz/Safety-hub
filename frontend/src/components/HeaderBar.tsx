import { AppBar, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import { useContext } from "react";
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DrawerContext from "../contexts/DrawerContext";
import NavButton from "./ui/navButton";

const Navbar = ({ sx }: { sx?: React.CSSProperties }) => {
  const navigate = useNavigate();
  const drawer = useContext(DrawerContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!drawer) {
    throw new Error("DrawerContext not found");
  }

  const logout = () => {
    // Logout logic here
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#1f2937",
          borderRadius: 0,
          boxShadow: "none",
          borderBottom: "1px solid #e5e7eb",
          m: 0,
          width: "100%",
          left: 0,
          right: 0,
          top: 0,
          zIndex: (theme) => theme.zIndex.modal + 1,
          ...sx,
        }}
      >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1.5 }}>
        {isMobile && (
          <IconButton
            onClick={() => drawer.setMobileOpen((prev) => !prev)}
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          Safety Hub
        </Typography>
        <NavButton label="Certify a Student" color="" to="/certifications/add" /> 
        <NavButton label="Log out" color="" onClick={logout} />
      </Toolbar>
    </AppBar>
  );
};


export default Navbar;
