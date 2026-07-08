import { Stack, Button, Paper, Box, Typography } from '@mui/material';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { alpha } from '@mui/material/styles';

import SectionHeader from './components/SectionHeader';
import DetailField from './components/DetailField';

import { formatDateTime, safeText } from './commons/helperFunctions';
import type { LabInfoTabProps } from './commons/types';


export const pageSurfaceSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  border: '1px solid',
  borderColor: alpha('#0F172A', 0.08),
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(10px)',
};


const noop = () => {};

const LabActions = () => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
    <Button
      variant="contained"
      startIcon={<EditOutlined />}
      onClick={noop}
      sx={{
        borderRadius: 999,
        textTransform: 'none',
        fontWeight: 800,
        px: 2.25,
        boxShadow: 'none',
      }}
    >
      Edit Lab
    </Button>
    <Button
      variant="outlined"
      color="error"
      startIcon={<BlockOutlined />}
      onClick={noop}
      sx={{
        borderRadius: 999,
        textTransform: 'none',
        fontWeight: 800,
        px: 2.25,
      }}
    >
      Deactivate Lab
    </Button>
  </Stack>
);


const LabInfoTab = ({ lab, tools, trainingNodes }: LabInfoTabProps) => {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={pageSurfaceSx}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <SectionHeader
              eyebrow="Lab Info"
              title="Current lab record"
              description="Review the lab details that are already returned by the API, with a few UI-only management actions layered on top."
              accent="#7C3AED"
            />

            <LabActions />
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            {safeText(lab.description, 'No description provided for this lab.')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            <DetailField
              label="Lab ID"
              value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{lab.id}</Typography>}
              helper="Unique identifier from the existing lab detail response."
            />
            <DetailField
              label="Lab name"
              value={<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{safeText(lab.name, lab.id)}</Typography>}
              helper="Name value returned by the existing API call."
            />
            <DetailField
              label="Description"
              value={
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {safeText(lab.description, 'No description provided.')}
                </Typography>
              }
              helper="Displayed directly from the current API payload."
            />
            <DetailField
              label="Created at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(lab.createdAt)}</Typography>}
              helper="Creation timestamp from the response."
            />
            <DetailField
              label="Updated at"
              value={<Typography sx={{ fontWeight: 700 }}>{formatDateTime(lab.updatedAt)}</Typography>}
              helper="Most recent update timestamp from the response."
            />
            <DetailField
              label="Tools"
              value={<Typography sx={{ fontWeight: 800, fontSize: 28 }}>{tools.length}</Typography>}
              helper="Tools already attached to this lab in the current response."
            />
            <DetailField
              label="Training nodes"
              value={<Typography sx={{ fontWeight: 800, fontSize: 28 }}>{trainingNodes.length}</Typography>}
              helper="Training nodes already attached to this lab in the current response."
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};



export default LabInfoTab;