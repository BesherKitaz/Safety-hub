import {useState, useEffect} from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { Typography, Box, Paper, Button, Stack, Chip, Pagination, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DataGrid  } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import GradientBox from '../components/ui/GradientBox';
import SearchBox, { MANAGEMENT_SEARCH_DEBOUNCE_MS } from '../components/ui/SearchBox';
import AgreementLinkManager from '../components/AgreementLinkManager';

import api from '../lib/api'



const columns: GridColDef[] = [
  {
    field: 'fullName',
    headerName: 'Full Name',
    width: 150,
    flex: 1,
  },
  {
    field: 'email',
    headerName: 'Email Address',
    width: 200,
    flex: 1,
  },
  {
    field: 'role',
    headerName: 'Role',
    width: 150,
    flex: 1,
  },
  {
    field: 'isUserAgreementComplete',
    headerName: 'User Agreement Complete',
    width: 200,
    flex: 1,
  },
  {
    field: 'userAgreementSource',
    headerName: 'User Agreement Source',
    width: 200,
    flex: 1,
  },
  {
    field: 'isActive',
    headerName: 'Active',
    width: 150,
    flex: 1,
  },
  {
    field: 'action',
    headerName: 'Action',
    minWidth: 200,
    flex: 1.5,

    renderCell: (params: any) => (
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
        <Button variant="contained" color="primary" component={RouterLink} to={`/user/${params.row.id}`}>
          View Profile
        </Button>
      </Box>

    ),
  },
 
];

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isUserAgreementComplete: string;
  userAgreementSource: string;
  isActive: string;
};

const Users = () => {
    const [rows, setRows] = useState<UserRow[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 25,
    });
    const [filters, setFilters] = useState({
      search: '',
    });
    const [agreementManagerOpen, setAgreementManagerOpen] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isDirectoryOnlyRole = ['MENTOR', 'SUPERVISOR'].includes(localStorage.getItem('userRole') ?? '');


    useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/api/user/tabular', {
        params: {
          page: paginationModel.page + 1, // backend often uses 1-based pages
          pageSize: paginationModel.pageSize,
          search: filters.search,
          }
        });
        console.log("Fetched data:", response.data.data);
      const rowData: UserRow[] = response.data.data.map((user: any) => {
        return {
          ...user,
          fullName: user.fullName,
          email: `${user.email}`,
          isUserAgreementComplete: user.isUserAgreementComplete ? 'Yes' : 'No',
          userAgreementSource: user.userAgreementSource || 'N/A',
          id: user.id,
          isActive: user.isActive ? 'Yes' : 'No',
        };
      });
      setRows(rowData);
      setTotalRows(response.data.meta.totalRows);
      }

      fetchData();

      }, [paginationModel, filters])



    return (
    <GradientBox>
      <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2, justifyContent: 'flex-end', width: '80%',  px: { xs: 2, sm: 4 } }}>
          {localStorage.getItem("userRole") === "ADMIN" && (
            <Button 
              variant="outlined" 
              onClick={() => setAgreementManagerOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              Manage agreement links
            </Button>
          )}
      </Stack>
      <Box sx={{ px: { xs: 2, sm: 4 }, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, mt:1 } }>
            {isDirectoryOnlyRole ? 'Member Directory' : 'Manage Users'}
          </Typography>
        </Box>
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
              placeholder="Search by full name or email"
              debounceMs={MANAGEMENT_SEARCH_DEBOUNCE_MS}
              onSearch={(value: string) => {
                                setPaginationModel((current) => ({ ...current, page: 0 }));
                                setFilters(prev => ({
                                  ...prev,
                                  search: value,
                                }));
                              }}
            />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                Search automatically by a member’s full name or email address.
            </Typography>
          </Box>
        </Box>
        {isSmallScreen ? (
          <Stack spacing={1.5} sx={{ px: 2, pb: 3 }}>
            {rows.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                <Typography color="text.secondary">No members match this search.</Typography>
              </Paper>
            ) : rows.map((user) => (
              <Paper key={user.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <Stack spacing={1.25}>
                  <Box>
                    <Typography sx={{ fontWeight: 850, color: "#111827" }}>{user.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{user.email}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip size="small" label={user.role} />
                    <Chip
                      size="small"
                      color={user.isUserAgreementComplete === "Yes" ? "success" : "default"}
                      label={user.isUserAgreementComplete === "Yes" ? "Agreement complete" : "Agreement pending"}
                    />
                  </Stack>
                  <Button fullWidth variant="contained" component={RouterLink} to={`/user/${user.id}`}>
                    View profile
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
        <AgreementLinkManager open={agreementManagerOpen} onClose={() => setAgreementManagerOpen(false)} />
      </GradientBox>
  );
};

export default Users;

