import {useState, useEffect} from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import { Typography, Box, Paper, Button, Stack, Chip, Pagination, useMediaQuery, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined'
import { DataGrid  } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import GradientBox from '../components/ui/GradientBox';
import SearchBox, { MANAGEMENT_SEARCH_DEBOUNCE_MS } from '../components/ui/SearchBox';

import api from '../lib/api'



const columns: GridColDef[] = [
  { field: 'holder', headerName: 'Holder\'s Name', width: 130, flex: 0.5 },
  { field: 'issuedBy', headerName: 'Issuer\'s Name', width: 130, flex: 0.5 },
  {
    field: 'training',
    headerName: 'Training',
    minWidth: 100,
    flex: 0.5,
  },
  {
    field: 'level',
    headerName: 'Level',
    minWidth: 100,
    flex: 0.3,
  },
  {
    field: 'issuedAt',
    headerName: 'Issue Date',
    type: 'dateTime',
    minWidth: 150,
    flex: 0.7,
  },
  {
    field: 'lastUpdated',
    headerName: 'Last Modified',
    type: 'dateTime',
    minWidth: 150,
    flex: 0.7,
  },
  {
    field: 'expiryDate',
    headerName: 'Expiry Date',
    type: 'dateTime',
    minWidth: 150,
    flex: 0.7,
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 100,
    flex: 0.3,
  },
  {
    field: 'action',
    headerName: 'Action',
    minWidth: 200,
    flex: 1,

    renderCell: (params: GridRenderCellParams<CertificationRow>) => {
      if (params.row.status === "REVOKED") {
        return (
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
          <Button variant="contained" color="primary" component={RouterLink} to={`/certifications/${params.row.id}`}>
            View
          </Button>
        </Box>
        )
      }
      if (params.row.status === "ACTIVE") {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
            <Button variant="contained" color="primary" component={RouterLink} to={`/certifications/${params.row.id}`}>
              View
            </Button>
            <Button variant="contained" color="primary" component={RouterLink} to={`/certifications/${params.row.id}/history`}>
              View History
            </Button>
          </Box>
        )
      }
    }
  },
];

type CertificationRow = {
  id: string;
  holder: string;
  issuedBy: string;
  training: string;
  trainingNode: { lab: { name: string } };
  issuedTo: { id?: string; email: string };
  level: string;
  issuedAt: Date;
  expiryDate: Date | null;
  status: string;
};

type CertificationApiRow = {
  id: string;
  issuedTo: { fullName: string; email: string };
  issuedBy: { fullName: string };
  trainingNode: { name: string; lab: { name: string } };
  level: number;
  issuedAt: string;
  lastUpdated: string;
  expiryDate: string | null;
  status: string;
};

type CertificationFilters = {
  status: string;
  level: string;
  search: string;
};

const levelLabels: Record<number, string> = {
  1: 'Basic',
  2: 'Trusted',
  3: 'Authorized',
};

const Certifications = () => {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') ?? '';
    const [rows, setRows] = useState<CertificationRow[]>([]);
    const [filters, setFilters] = useState<CertificationFilters>({
      status: 'ACTIVE',
      level: '',
      search: initialSearch,
    });
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<Pick<CertificationFilters, 'status' | 'level'>>({
      status: 'ACTIVE',
      level: '',
    });
    const [durationDialogOpen, setDurationDialogOpen] = useState(false);
    const [durationDays, setDurationDays] = useState('365');
    const [durationSaving, setDurationSaving] = useState(false);
    const [durationError, setDurationError] = useState<string | null>(null);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 25,
    });
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Fetch data and total rows whenever pagination model or filters change
    useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/api/certifications/tabular', {
        params: {
          page: paginationModel.page + 1, // backend often uses 1-based pages
          pageSize: paginationModel.pageSize,
          filters: JSON.stringify({
            status: filters.status,
            level: filters.level,
            search: filters.search,
          }),
        }
      });
        const rowData: CertificationRow[] = response.data.data.map((cert: CertificationApiRow) => {
          return {
            ...cert,
            holder: cert.issuedTo.fullName,
            issuedBy: cert.issuedBy.fullName,
            issuedAt: new Date(cert.issuedAt),
            lastUpdated: new Date(cert.lastUpdated),
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
            training: cert.trainingNode.name,
            level: levelLabels[cert.level] || 'Unknown',
          };
        });
      console.log("Row Data:", rowData);
      setRows(rowData);
      setTotalRows(response.data.meta.totalRows);
      }
      fetchData();

      }, [paginationModel, filters]);



    return (
    <GradientBox>
      <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2, justifyContent: 'flex-end', width: { xs: '100%', sm: '80%' }, px: { xs: 2, sm: 4 } }}>
        {localStorage.getItem('userRole') === 'ADMIN' && (
          <Button
            variant="outlined"
            onClick={async () => {
              setDurationError(null);
              setDurationDialogOpen(true);
              try {
                const response = await api.get('/api/certifications/settings/duration');
                setDurationDays(String(response.data.data.durationDays));
              } catch {
                setDurationError('Unable to load the current certification duration.');
              }
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            Certification duration
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => {
            setDraftFilters({
              status: filters.status,
              level: filters.level,
            });
            setFilterDialogOpen(true);
          }}
          startIcon={<FilterAltOutlined />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
          }}
        >
          Filter certifications
        </Button>
        {(filters.status !== '' || filters.level !== '') && (
          <Chip
            label={`${[filters.status, filters.level].filter(Boolean).length} active filter${[filters.status, filters.level].filter(Boolean).length === 1 ? '' : 's'}`}
            onDelete={() => {
              setPaginationModel((current) => ({ ...current, page: 0 }));
              setFilters((current) => ({ ...current, status: '', level: '' }));
            }}
          />
        )}
      </Stack>
      <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, mt:1 } }>
              Certifications
              </Typography>
      </Box>
      <Box
      sx={{
          minHeight: { xs: "auto", sm: "calc(35vh - 72px)" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
      }}
      >
        <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4 } }}>
            <Box sx={{ mb: 2 }}>
            <SearchBox
                initialValue={initialSearch}
                placeholder="Search by full name, email, training, or lab"
                debounceMs={MANAGEMENT_SEARCH_DEBOUNCE_MS}
                onSearch={(value: string) => {
                  setPaginationModel((current) => ({ ...current, page: 0 }));
                  setFilters(prev => ({
                    ...prev,
                    search: value,
                  }))
                }}
            />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                Search automatically by holder or issuer name, email, training, or lab.
            </Typography>
          </Box>
        </Box>
        {isSmallScreen ? (
          <Stack spacing={1.5} sx={{ px: 2, pb: 3 }}>
            {rows.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                <Typography color="text.secondary">No certifications match the current search and filters.</Typography>
              </Paper>
            ) : rows.map((certification) => (
              <Paper key={certification.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <Stack spacing={1.25}>
                  <Box>
                    <Typography sx={{ fontWeight: 850, color: "#111827" }}>{certification.holder}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {certification.issuedTo.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>{certification.training}</Typography>
                    <Typography variant="caption" color="text.secondary">{certification.trainingNode.lab.name}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip size="small" label={certification.level} color="primary" variant="outlined" />
                    <Chip size="small" label={certification.status} />
                    <Chip size="small" label={certification.issuedAt.toLocaleDateString()} variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Issued by {certification.issuedBy}
                  </Typography>
                  <Button fullWidth variant="contained" component={RouterLink} to={`/certifications/${certification.id}`}>
                    View certification
                  </Button>
                </Stack>
              </Paper>
            ))}
            {totalRows > paginationModel.pageSize && (
              <Pagination
                count={Math.ceil(totalRows / paginationModel.pageSize)}
                page={paginationModel.page + 1}
                onChange={(_, page) => setPaginationModel((current) => ({ ...current, page: page - 1 }))}
                color="primary"
                sx={{ alignSelf: "center", pt: 1 }}
              />
            )}
          </Stack>
        ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={totalRows}
            paginationMode="server"
            paginationModel={paginationModel}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            sx={{ border: 0 }}
            onPaginationModelChange={(model: { page: number; pageSize: number }) => {setPaginationModel(model)}}
          />  
        </Paper>
        )}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Filter certifications</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                select
                label="Level"
                value={draftFilters.level}
                onChange={(event) => setDraftFilters((current) => ({ ...current, level: event.target.value }))}
                helperText="Levels are stored numerically and shown using their certification names."
              >
                <MenuItem value="">All levels</MenuItem>
                {Object.entries(levelLabels).map(([level, label]) => (
                  <MenuItem key={level} value={level}>{label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={draftFilters.status}
                onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="REVOKED">Revoked</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
                <MenuItem value="DEACTIVATED">Deactivated</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDraftFilters({ status: '', level: '' })}>Clear</Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                setPaginationModel((current) => ({ ...current, page: 0 }));
                setFilters((current) => ({ ...current, ...draftFilters }));
                setFilterDialogOpen(false);
              }}
            >
              Apply filters
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={durationDialogOpen} onClose={() => !durationSaving && setDurationDialogOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Certification duration</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
              This duration applies only to certifications issued or renewed after you save it.
              Existing expiry dates will not change.
            </Typography>
            {durationError && <Alert severity="error" sx={{ mb: 2 }}>{durationError}</Alert>}
            <TextField
              label="Duration in days"
              type="number"
              fullWidth
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
              helperText="Default: 365 days. Allowed range: 1–3650 days."
              slotProps={{ htmlInput: { min: 1, max: 3650, step: 1 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDurationDialogOpen(false)} disabled={durationSaving}>Cancel</Button>
            <Button
              variant="contained"
              disabled={durationSaving}
              onClick={async () => {
                setDurationSaving(true);
                setDurationError(null);
                try {
                  await api.put('/api/certifications/settings/duration', {
                    durationDays: Number(durationDays),
                  });
                  setDurationDialogOpen(false);
                } catch {
                  setDurationError('Unable to update the certification duration. Enter a whole number from 1 to 3650.');
                } finally {
                  setDurationSaving(false);
                }
              }}
            >
              {durationSaving ? 'Saving…' : 'Save duration'}
            </Button>
          </DialogActions>
        </Dialog>
      </GradientBox>
  );
};

export default Certifications;
