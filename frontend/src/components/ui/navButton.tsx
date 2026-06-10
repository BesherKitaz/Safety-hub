import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type NavButtonProps = {
  to: string;
  label: string;
  color?: string;
};

const NavButton = ({ to, label, color="#1d4ed8" }: NavButtonProps) => {
    let buttonColor = color === "#1d4ed8" ? "#2563eb" : color;
    let textColor = color === "#1d4ed8" ? "#ffffff" : "#ffffff";
  return (
    <Button
      component={RouterLink}
      to={to}
      variant="contained"
      sx={{
        backgroundColor: buttonColor,
        color: textColor,
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 999,
        px: 2,
        boxShadow: "none",
        "&:hover": {
          backgroundColor: color,
          boxShadow: "none",
        },
      }}
    >
      {label}
    </Button>
  );
};

export default NavButton;
