import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Icon imports
import HomeIcon from '@mui/icons-material/Home';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import GroupIcon from '@mui/icons-material/Group';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';

import { useNavigate } from 'react-router-dom'
import { useContext, useState } from "react";
import DrawerContext from "../contexts/DrawerContext";


const navItems = [
  { id: 'home', label: 'Home', to: '/', icon: <HomeIcon /> },
  { id: 'certifications', label: 'Certifications', to: '/certifications', icon: <WorkspacePremiumIcon /> },
  { id: 'manage-members', label: 'Manage Members', to: '/users', icon: <GroupIcon /> },
  { id: 'manage-labs', label: 'Manage Labs', to: '/lab-management', icon: <ScienceIcon /> },
  { id: 'profile', label: 'Profile', to: '/user', icon: <PersonIcon /> },
  { id: 'logout', label: 'Log Out', to: '/login', icon: <LogoutIcon /> },
];


type ListItemLinkProps = {
  to: string;
  primary: string;
  icon?: React.ReactElement;
  expanded?: boolean;
  onClick?: () => void;
  onSelect: (to: string) => void;
};


const ListItemLink = ({ to, primary, icon, expanded, onClick, onSelect }: ListItemLinkProps) => {
  return (
    <ListItemButton
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          onSelect(to);
        }
      }}
      sx={{
        minHeight: 48,
        justifyContent: expanded ? 'initial' : 'center',
        px: 2.5,
      }}
    >
      {icon && (
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: expanded ? 3 : 'auto',
            justifyContent: 'center',
            '& .MuiSvgIcon-root': {
              fontSize: '3rem',
              color: 'primary.main',
            },
          }}
        >
          {icon}
        </ListItemIcon>
      )}
      <ListItemText
        primary={primary}
        sx={{
          opacity: expanded ? 1 : 0,
          whiteSpace: 'nowrap',
        }}
      />
    </ListItemButton>
  );
};


const NavigationSidePanelComponent = () => {
  const [hovered, setHovered] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const expanded = isMobile || hovered;
  const drawerWidth = expanded ? 360 : 72;
  const headerHeight = 'var(--app-header-height, 64px)';
  const appScale = 'var(--app-scale, 1)';
  const desktopHeight = `calc((100dvh / ${appScale}) - ${headerHeight})`;
  const mobileHeight = `calc(100dvh / ${appScale})`;
  const mobileWidth = '100vw';

  const navigate = useNavigate();
  const drawer = useContext(DrawerContext);

  if (!drawer) throw new Error("DrawerContext not found");

  const { mobileOpen, setMobileOpen } = drawer;

  if (!localStorage.getItem("token")) {
    return <></>;
  }

  const handleSelect = (to: string) => {
    navigate(to);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={() => setMobileOpen(false)}
      ModalProps={{ keepMounted: true }}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      sx={{
        width: 0,
        flexShrink: 0,
        zIndex: isMobile ? (theme) => theme.zIndex.modal + 2 : 0,
        '& .MuiDrawer-paper': {
          position: 'fixed',
          left: 0,
          top: isMobile ? 0 : headerHeight,
          width: isMobile ? mobileWidth : drawerWidth,
          height: isMobile ? mobileHeight : desktopHeight,
          overflowX: 'hidden',
          overflowY: 'auto',
          boxSizing: 'border-box',
          borderRadius: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        },
      }}
    >
      {isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            BIDC Safety Hub
          </Typography>
          <IconButton
            onClick={() => setMobileOpen(false)}
            aria-label="close drawer"
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      <List>
        {navItems.map(({ id, label, to, icon }) => {

            if (id === "home") {
            const userRole = localStorage.getItem("userRole");
            if (userRole !== "ADMIN" && userRole !== "STAFF" && userRole !== "SUPERVISOR") {
              return null; // Skip rendering this item for non-admin users
            }
          }


          if (id === "manage-labs") {
            const userRole = localStorage.getItem("userRole");
            if (userRole !== "ADMIN" && userRole !== "STAFF" && userRole !== "MENTOR" && userRole !== "SUPERVISOR") {
              return null; // Skip rendering this item for non-admin users
            }
          }

          if (id === "manage-members") {
            const userRole = localStorage.getItem("userRole");
            if (userRole !== "ADMIN" && userRole !== "STAFF") {
              return null; // Skip rendering this item for non-admin users
            }
          }

          if (id === "certifications") {
            const userRole = localStorage.getItem("userRole");
            if (userRole !== "ADMIN" && userRole !== "STAFF" && userRole !== "MENTOR" && userRole !== "SUPERVISOR") {
              return null; // Skip rendering this item for non-admin users
            }
          }

          if (id === "logout") {
            return (
              <ListItemLink
                to={to}
                key={to}
                icon={icon}
                primary={label}
                expanded={expanded}
                onClick={() => {
                  if (id === "logout") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("userId");
                    window.location.reload();
                  }
                }}
                onSelect={handleSelect}
              />
            )
          }
          
          return (
            <ListItemLink
              to={to}
              key={to}
              icon={icon}
              primary={label}
              expanded={expanded}
              onSelect={handleSelect}
            />
          )
        })}
      </List>
    </Drawer>
  );
};


export default NavigationSidePanelComponent;
