import React, {useState, useEffect} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Typography, Box, Paper, DataGrid } from '@mui/material'

import GradientBox from '../components/ui/GradientBox';
import SearchBox from '../components/ui/SearchBox';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}


interface Data {
  id: number;
  calories: number;
  carbs: number;
  fat: number;
  name: string;
  protein: number;
}
interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Dessert (100g serving)',
  },
  {
    id: 'calories',
    numeric: true,
    disablePadding: false,
    label: 'Calories',
  },
  {
    id: 'fat',
    numeric: true,
    disablePadding: false,
    label: 'Fat (g)',
  },
  {
    id: 'carbs',
    numeric: true,
    disablePadding: false,
    label: 'Carbs (g)',
  },
  {
    id: 'protein',
    numeric: true,
    disablePadding: false,
    label: 'Protein (g)',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } =
    props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };




  return (
   <GradientBox>

        <Box sx={{ maxWidth: 720, px: { xs: 2, sm: 4, }, mx: "auto", textAlign: "center" }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3, mt:2 } }>
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
        <Paper  sx={{ height: 400, width: '100%' }}>
            <DataGrid />

        </Paper>
        </GradientBox>
  );
};

export default Certifications;