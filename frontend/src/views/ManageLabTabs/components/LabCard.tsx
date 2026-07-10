import { alpha } from '@mui/material/styles';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { formatDateTime, safeText } from '../commons/helperFunctions';
import type { LabDetail } from '../commons/types';

type LabCardProps = {
  lab: LabDetail;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void | Promise<void>;
  actionColor?: 'primary' | 'error' | 'success' | 'inherit';
};

const labCardShellSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#0F172A', 0.10),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.07)',
  transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: alpha('#2563EB', 0.24),
    boxShadow: '0 22px 44px rgba(15, 23, 42, 0.10)',
  },
};

const LabCard = ({ lab, actionLabel, actionHref, onAction, actionColor = 'primary' }: LabCardProps) => {
  const isActive = lab.isActive !== false;

  return (
    <Paper elevation={0} sx={labCardShellSx}>
      <Box sx={{ height: 6, bgcolor: isActive ? 'primary.main' : 'text.disabled' }} />

      <Stack spacing={2.25} sx={{ p: 2.5, flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.15, color: '#111827' }}>
              {safeText(lab.name, lab.id)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
              Lab ID: {lab.id}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={isActive ? 'Active' : 'Inactive'}
            variant="outlined"
            sx={{
              flexShrink: 0,
              borderColor: isActive ? alpha('#0F766E', 0.20) : alpha('#6B7280', 0.22),
              bgcolor: isActive ? alpha('#0F766E', 0.08) : alpha('#6B7280', 0.08),
              color: isActive ? '#0F766E' : '#4B5563',
              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {safeText(lab.description, 'No description provided.')}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Updated
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.25 }}>
            {formatDateTime(lab.updatedAt)}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: alpha('#0F172A', 0.08),
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: alpha('#F8FAFC', 0.8),
        }}
      >
        {actionHref ? (
          <Button
            component={RouterLink}
            to={actionHref}
            variant="contained"
            color={actionColor}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 999,
              boxShadow: 'none',
            }}
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            onClick={onAction}
            variant="contained"
            color={actionColor}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 999,
              boxShadow: 'none',
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export type { LabCardProps };
export default LabCard;

