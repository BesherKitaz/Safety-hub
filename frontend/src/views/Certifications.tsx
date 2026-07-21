import React, {useState, useEffect} from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import { Typography, Box, Paper, Button, Stack } from '@mui/material'
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined'
import { DataGrid  } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import GradientBox from '../components/ui/GradientBox';
import SearchBox from '../components/ui/SearchBox';

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

    renderCell: (params: any) => {
      if (params.row.status === "REVOKED") {
        return (
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
          <Button variant="contained" color="primary" component={RouterLink} to={`/certifications/${params.row.id}`}>
            View
          </Button>
          <Button variant="contained" sx={{ backgroundColor: 'green', '&:hover': { backgroundColor: 'darkred' } }}>
            Unrevoke
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


const Certifications = () => {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') ?? '';
    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({
      holder: '', // not currently used
      issuedBy: '',  // not currently used
      issuedAt: '', // not currently used
      status: true,  // used; true for viewing active certifications, false for viewing revoked certifications
      search: initialSearch,  // Value from search bar
    });
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 25,
    });

    // Fetch data and total rows whenever pagination model or filters change
    useEffect(() => {
    const getTotalRows = async () => {
      try {
          const response = await api.get('/api/certifications/tabular/total-rows');
          setTotalRows(response.data.data);
        } catch (error) {
          console.error("Error fetching total rows:", error);
        }
      }


    const fetchData = async () => {
      const response = await api.get('/api/certifications/tabular', {
        params: {
          page: paginationModel.page + 1, // backend often uses 1-based pages
          pageSize: paginationModel.pageSize,
          filters: JSON.stringify({
            holder: filters.holder,
            issuedBy: filters.issuedBy,
            issuedAt: filters.issuedAt,
            status: filters.status,
            search: filters.search,
          }),
        }
      });
        const rowData = response.data.data.map((cert: any) => {
          const levelMapper = {
            1: 'Beginner',
            2: 'Intermediate',
            3: 'Advanced',
          }
          return {
            ...cert,
            holder: `${cert.issuedTo.firstName} ${cert.issuedTo.lastName}`,
            issuedBy: `${cert.issuedBy.firstName} ${cert.issuedBy.lastName}`,
            issuedAt: new Date(cert.issuedAt),
            lastUpdated: new Date(cert.lastUpdated),
            expiryDate: new Date(cert.expiryDate),
            training: cert.trainingNode.name,
            level: levelMapper[cert.level] || 'Unknown',
          };
        });
      console.log("Row Data:", rowData);
      setRows(rowData);
      }
      fetchData();
      getTotalRows();

      }, [paginationModel, filters]);



    return (
    <GradientBox>
      <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2, justifyContent: 'flex-end', width: '80%',  px: { xs: 2, sm: 4 } }}>
        <Button
          variant="outlined"
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              status: !prev.status,
            }))
          }}
          startIcon={<FilterAltOffOutlined />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
          }}
        >
          {filters.status ? 'View Revoked Certifications' : 'View Active Certifications'}
        </Button>
      </Stack>
      <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, mt:1 } }>
              Certifications
              </Typography>
      </Box>
      <Box
      sx={{
          minHeight: "calc(35vh - 72px)",
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
                onSearch={(value: string) => {
                  setFilters(prev => ({
                    ...prev,
                    search: value,
                  }))
                }}
            />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                Quick Search for Certifications. Search by student email or Lab
            </Typography>
          </Box>
        </Box>
        <Paper  sx={{ height: 600, width: '100%' }}>
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
      </GradientBox>
  );
};

export default Certifications;
