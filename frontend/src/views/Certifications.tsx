import React, {useState, useEffect} from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { Typography, Box, Paper, Button } from '@mui/material'
import { DataGrid  } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import GradientBox from '../components/ui/GradientBox';
import SearchBox from '../components/ui/SearchBox';

import api from '../lib/api'



const columns: GridColDef[] = [
  { field: 'holder', headerName: 'Holder\'s Name', width: 130 },
  { field: 'issuedBy', headerName: 'Issuer\'s Name', width: 130 },
  {
    field: 'issuedAt',
    headerName: 'Issue Date',
    type: 'dateTime',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'lastUpdated',
    headerName: 'Last Modified',
    type: 'dateTime',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'expiryDate',
    headerName: 'Expiry Date',
    type: 'dateTime',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 100,
    flex: 0.5,
  },
  {
    field: 'action',
    headerName: 'Action',
    minWidth: 200,
    flex: 1.5,

    renderCell: (params: any) => (
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
        <Button variant="contained" color="primary" component={RouterLink} to={`/certifications/${params.row.id}`}>
          View
        </Button>
        <Button variant="contained" color="primary">
          Edit
        </Button>
        <Button variant="contained" sx={{ backgroundColor: 'red', '&:hover': { backgroundColor: 'darkred' } }}>
          Revoke
        </Button>
      </Box>

    ),
  },
 
];


const Certifications = () => {
    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 25,
    });


    useEffect(() => {
    const getTotalRows = async () => {
      try {
          const response = await api.get('/api/certifications/tabular/total-rows');
          console.log("Total rows:", response.data.data);
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
          }
        });

        const rowData = response.data.data.map((cert: any) => {
          return {
            ...cert,
            holder: `${cert.issuedTo.firstName} ${cert.issuedTo.lastName}`,
            issuedBy: `${cert.issuedBy.firstName} ${cert.issuedBy.lastName}`,
            issuedAt: new Date(cert.issuedAt),
            lastUpdated: new Date(cert.lastUpdated),
            expiryDate: new Date(cert.expiryDate),
          };
        });
      setRows(rowData);
      }

      fetchData();
      getTotalRows();

      }, [paginationModel])



    return (
    <GradientBox>

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
                onSearch={(value: string) => {
                console.log("Search submitted:", value);
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

