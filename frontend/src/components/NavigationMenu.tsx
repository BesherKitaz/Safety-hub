import { AppBar, Toolbar, Typography } from "@mui/material";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';


// Icon imports
import HomeIcon from '@mui/icons-material/Home';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import GroupIcon from '@mui/icons-material/Group';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';


import { useNavigate } from 'react-router-dom'
import { useState } from "react";


const navItems = [
  {
    label: 'Home',
    to: '/',
    icon: <HomeIcon />,
  },
  {
    label: 'Certifications',
    to: '/certifications',
    icon: <WorkspacePremiumIcon />,
  },
  {
    label: 'Manage Members',
    to: '/manage-members',
    icon: <GroupIcon />,
  },
  {
    label: 'Manage Labs',
    to: '/manage-labs',
    icon: <ScienceIcon />,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: <PersonIcon />,
  },
  {
    label: 'Log Out',
    to: '/login',
    icon: <LogoutIcon />,
  },
];


type ListItemLinkProps = {
  to: string;
  primary: string;
  icon?: React.ReactElement;
  expanded?: boolean;
};

const ListItemLink = ({ to, primary, icon, expanded }: ListItemLinkProps) => {
  const navigate = useNavigate();

  return (
    <ListItemButton 
      onClick={() => navigate(to)}
      sx={{
        minHeight: 48,
        justifyContent: expanded ? 'initial' : 'center',
        px: 2.5,
      }}
      >
      {icon && <ListItemIcon
        sx={{
          minWidth: 0,
          mr: expanded ? 3 : 'auto',
          justifyContent: 'center',
          '& .MuiSvgIcon-root': {
            fontSize: '3rem',
            color: "primary.main",
          }
        }}
      >
        {icon}
      </ListItemIcon>}
      <ListItemText primary={primary} 
      sx={{
          opacity: expanded ? 1 : 0,
          whiteSpace: 'nowrap',
        }}
      />
    </ListItemButton>
  );
};


const NavigationSidePanelComponent = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const expanded = isMobile || hovered;
  const drawerWidth = expanded ? 360 : 72;

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
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={() => setMobileOpen(false)}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        },
      }}
    >

      <List>
        {navItems.map(({ label, to, icon }) => (
          <ListItemLink
            to={to}
            key={to}
            icon={icon}
            primary={label}
            expanded={expanded}
          />
        ))}
      </List>
    </Drawer>
  );
};

export default NavigationSidePanelComponent;