import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type NavButtonProps = {
  to?: string;
  label: string;
  color?: string;
  onClick?: () => void;
};

const NavButton = ({ to, label, onClick, color="#1d4ed8" }: NavButtonProps) => {
    let buttonColor = color === "#1d4ed8" ? "#2563eb" : color;
    let textColor = color === "#1d4ed8" ? "#ffffff" : "#ffffff";
    if (to) {
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
      )
    }
    else {
    return (
      <Button
        onClick={onClick}
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
      )
    }
};

export default NavButton;
