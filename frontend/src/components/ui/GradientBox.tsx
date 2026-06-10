import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { BoxProps } from "@mui/material/Box";


type GradientBoxProps = BoxProps & {
  children: ReactNode;
  toTop?: boolean;
};

const GradientBox = ({ children, sx, toTop, ...props}: GradientBoxProps) => {
  return (
    <Box
      {...props}
      sx={[
        {
          background: toTop
            ? "linear-gradient(to top, #EDF3F9, #F8F9FB)"
            : "linear-gradient(to bottom, #EDF3F9, #F8F9FB)",
          p: 2.5,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
};

export default GradientBox;
