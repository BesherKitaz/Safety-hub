import { Stack, Typography } from '@mui/material';
import { type SectionHeaderProps } from '../commons/types';

const SectionHeader = ({ eyebrow, title, description, accent }: SectionHeaderProps) => (
  <Stack spacing={0.75}>
    <Typography
      variant="overline"
      sx={{
        color: accent,
        fontWeight: 800,
        letterSpacing: 1.8,
        lineHeight: 1,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography
      component="h2"
      sx={{
        fontSize: { xs: 22, md: 28 },
        fontWeight: 800,
        lineHeight: 1.1,
        color: 'text.primary',
      }}
    >
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {description}
      </Typography>
    )}
  </Stack>
);


export default SectionHeader;