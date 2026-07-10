import React, {useState, useEffect} from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { Typography, Box, Paper, Button } from '@mui/material'
import { DataGrid  } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import GradientBox from '../components/ui/GradientBox';
import SearchBox from '../components/ui/SearchBox';

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
    field: 'action',
    headerName: 'Action',
    minWidth: 200,
    flex: 1.5,

    renderCell: (params: any) => (
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', gap: 2, height: '100%', }}>
        <Button variant="contained" color="primary" component={RouterLink} to={`/user/${params.row.id}`}>
          View Profile
        </Button>
        <Button variant="contained" color="primary">
          Edit
        </Button>
      </Box>

    ),
  },
 
];


const Users = () => {
    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 25,
    });


    useEffect(() => {
    const getTotalRows = async () => {
      try {
          const response = await api.get('/api/user/tabular/total-rows');
          console.log("Total rows:", response.data.data);
          setTotalRows(response.data.data);
        } catch (error) {
          console.error("Error fetching total rows:", error);
        }
      }


    const fetchData = async () => {
      const response = await api.get('/api/user/tabular', {
        params: {
          page: paginationModel.page + 1, // backend often uses 1-based pages
          pageSize: paginationModel.pageSize,
          }
        });
        console.log("Fetched data:", response.data.data);
      const rowData = response.data.data.map((user: any) => {
        return {
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
          email: `${user.email}`,
          isUserAgreementComplete: user.isUserAgreementComplete ? 'Yes' : 'No',
          userAgreementSource: user.userAgreementSource || 'N/A',
          id: user.id,
        };
      });
      setRows(rowData);
      }

      fetchData();
      getTotalRows();

      }, [paginationModel])



    return (
    <GradientBox>
      <Box sx={{ display: "flex", justifyContent: "flex-end", maxWidth: 1640, gap: 4, px: { xs: 2, sm: 4 }, mx: "auto", mt: 2, mb: 2 }}>
        <Button variant="contained" color="primary" component={RouterLink} to="/user/create"> 
          Create New User
        </Button>
        <Button variant="contained" color="primary" component={RouterLink} to="/user/create"> 
          Send User Agreement
        </Button>
      </Box>
      <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, mt:1 } }>
              Manage Users
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
                Quick Search for Users. Search by user email or Lab
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

export default Users;

