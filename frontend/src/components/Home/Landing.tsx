import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink } from "react-router-dom";

type DashboardAction = {
  label: string;
  description: string;
  to: string;
  icon: typeof AddCircleOutlineIcon;
  roles: string[];
};

const actions: DashboardAction[] = [
  {
    label: "Issue certification",
    description: "Record a student’s completed training and level.",
    to: "/certifications/add",
    icon: AddCircleOutlineIcon,
    roles: ["ADMIN", "STAFF", "MENTOR", "SUPERVISOR"],
  },
  {
    label: "Browse certifications",
    description: "Find active records and review certification history.",
    to: "/certifications",
    icon: WorkspacePremiumOutlinedIcon,
    roles: ["ADMIN", "STAFF", "MENTOR", "SUPERVISOR"],
  },
  {
    label: "Manage members",
    description: "View profiles, create users, and check agreements.",
    to: "/users",
    icon: GroupOutlinedIcon,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Manage labs",
    description: "Maintain labs, tools, and training pathways.",
    to: "/lab-management",
    icon: ScienceOutlinedIcon,
    roles: ["ADMIN", "STAFF", "MENTOR", "SUPERVISOR"],
  },
];

const Landing = () => {
  const role = localStorage.getItem("userRole") ?? "";
  const visibleActions = actions.filter((action) => action.roles.includes(role));

  return (
    <Box component="section" aria-labelledby="quick-actions-heading">
      <Stack direction="row" sx={{ mb: 2, alignItems: "end", justifyContent: "space-between" }}>
        <Box>
          <Typography id="quick-actions-heading" variant="h5" sx={{ fontWeight: 900, color: "#111827" }}>
            Quick actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Jump straight into your most common tasks.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {visibleActions.map(({ label, description, to, icon: Icon }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{ p: 2.5, border: "1px solid #dbe4ee", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.94)" }}
          >
            <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#eaf3ff", color: "primary.main", mb: 2 }}>
              <Icon />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: "#111827" }}>{label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, minHeight: 42, lineHeight: 1.5 }}>{description}</Typography>
            <Button component={RouterLink} to={to} endIcon={<ArrowForwardIcon />} sx={{ mt: 1.5, px: 0, textTransform: "none", fontWeight: 800 }}>
              Open
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default Landing;
