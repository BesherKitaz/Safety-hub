import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import NavigationMenuComponent from "./components/HeaderBar";
import NavigationSidePanelComponent from "./components/NavigationSideDrawer";

export default function Layout() {
  return (
    <Box sx={{ minHeight: "100vh", width: "100%", position: "relative", overflowX: "hidden" }}>
      <NavigationMenuComponent />
      <Toolbar />
      <NavigationSidePanelComponent />
      <Box
        component="main"
        sx={{
          minWidth: 0,
          width: "100%",
          pl: { xs: 0, sm: "72px" },
          display: "flex",
          flexDirection: "column",
          minHeight: "calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
