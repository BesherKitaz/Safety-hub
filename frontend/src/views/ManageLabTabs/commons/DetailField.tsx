import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';


type DetailFieldProps = {
  label: string;
  value: ReactNode;
  helper?: string;
};

const detailFieldSx = {
  p: 2,
  borderRadius: 3,
  border: '1px solid',
  borderColor: alpha('#2563EB', 0.1),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
};


const DetailField = ({ label, value, helper }: DetailFieldProps) => (
  <Box sx={detailFieldSx}>
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 1.15,
        color: 'text.secondary',
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: 1 }}>{value}</Box>
    {helper && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
        {helper}
      </Typography>
    )}
  </Box>
);


export default DetailField;