import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import GradientBox from '../components/ui/GradientBox';
import api from '../lib/api';

type Department = { id: string; name: string; collegeId: string; isActive: boolean };
type College = { id: string; name: string; isActive: boolean; departments: Department[] };
type StatItem = { id: string; name: string; count: number };
type DepartmentStat = StatItem & { collegeId: string; collegeName: string };
type AcademicStats = {
  totalUsers: number;
  affiliatedUsers: number;
  totalAffiliations: number;
  totalCollegeAffiliations: number;
  colleges: StatItem[];
  departments: DepartmentStat[];
};

const colors = ['#1559a6', '#2e7d32', '#ed6c02', '#7b1fa2', '#0288d1', '#c62828', '#6d4c41', '#455a64'];

// Render compact affiliation shares without introducing a charting dependency.
const FundingPie = ({ items, total }: { items: { name: string; count: number }[]; total: number }) => {
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.count / total) * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'center' }}>
      <Box
        role="img"
        aria-label="Department affiliation distribution pie chart"
        sx={{
          width: { xs: 220, sm: 280 },
          aspectRatio: '1',
          borderRadius: '50%',
          background: total ? `conic-gradient(${segments.join(',')})` : '#e5e7eb',
          boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.08)',
          flexShrink: 0,
        }}
      />
      <Stack spacing={1.25} sx={{ width: '100%' }}>
        {items.map((item, index) => {
          const percentage = total ? (item.count / total) * 100 : 0;
          return (
            <Box key={item.name}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.75, bgcolor: colors[index % colors.length], flexShrink: 0 }} />
                  <Typography variant="body2" noWrap>{item.name}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {item.count} ({percentage.toFixed(1)}%)
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={percentage} sx={{ mt: 0.5, height: 5, borderRadius: 4 }} />
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
};

// Manage the academic directory and review its usage in one administrator screen.
const AcademicAffiliations = () => {
  const [tab, setTab] = useState(0);
  const [colleges, setColleges] = useState<College[]>([]);
  const [stats, setStats] = useState<AcademicStats | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'college' | 'department' | null>(null);
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');

  const refresh = async () => {
    try {
      const [managementResponse, statsResponse] = await Promise.all([
        api.get('/api/academics/manage'),
        api.get('/api/academics/stats'),
      ]);
      setColleges(managementResponse.data.data);
      setStats(statsResponse.data.data);
      setError('');
    } catch {
      setError('Academic affiliation data could not be loaded.');
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/api/academics/manage'),
      api.get('/api/academics/stats'),
    ])
      .then(([managementResponse, statsResponse]) => {
        if (!active) return;
        setColleges(managementResponse.data.data);
        setStats(statsResponse.data.data);
      })
      .catch(() => {
        if (active) setError('Academic affiliation data could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  const chartItems = useMemo(() => {
    if (!stats || stats.totalAffiliations === 0) return [];
    const visible: { name: string; count: number }[] = [];
    let smallCount = 0;
    stats.departments
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .forEach((item) => {
        if ((item.count / stats.totalAffiliations) * 100 < 3) smallCount += item.count;
        else visible.push({ name: item.name, count: item.count });
      });
    if (smallCount) visible.push({ name: 'Smaller department shares', count: smallCount });
    return visible;
  }, [stats]);

  const saveEntry = async () => {
    if (!name.trim() || (dialog === 'department' && !collegeId)) return;
    try {
      if (dialog === 'college') await api.post('/api/academics/colleges', { name });
      else await api.post(`/api/academics/colleges/${collegeId}/departments`, { name });
      setDialog(null);
      setName('');
      setCollegeId('');
      await refresh();
    } catch {
      setError('That entry could not be saved. Check for an existing name and try again.');
    }
  };

  const toggle = async (kind: 'colleges' | 'departments', id: string, isActive: boolean) => {
    try {
      await api.put(`/api/academics/${kind}/${id}`, { isActive: !isActive });
      await refresh();
    } catch {
      setError('The selected entry could not be updated.');
    }
  };

  return (
    <GradientBox>
      <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 3 }}>Administration</Typography>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>Colleges and departments</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Maintain signup choices and review academic affiliation data used for funding.
        </Typography>
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_event: SyntheticEvent, value: number) => setTab(value)} variant="scrollable">
            <Tab label="Manage directory" />
            <Tab label="Funding statistics" />
          </Tabs>
          <Divider />

          {tab === 0 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, justifyContent: 'flex-end' }}>
                <Button startIcon={<AddOutlined />} variant="outlined" onClick={() => setDialog('college')}>Add college or school</Button>
                <Button startIcon={<AddOutlined />} variant="contained" disabled={!colleges.length} onClick={() => setDialog('department')}>Add department</Button>
              </Stack>
              <Stack spacing={2}>
                {colleges.length === 0 && <Alert severity="info">Add the first college or school to enable signup selections.</Alert>}
                {colleges.map((college) => (
                  <Card key={college.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>{college.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{college.departments.length} departments</Typography>
                        </Box>
                        <Button color={college.isActive ? 'warning' : 'success'} onClick={() => toggle('colleges', college.id, college.isActive)}>
                          {college.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Stack>
                      <Stack direction="row" useFlexGap sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                        {college.departments.map((department) => (
                          <Chip
                            key={department.id}
                            label={department.name}
                            variant={department.isActive ? 'filled' : 'outlined'}
                            color={department.isActive ? 'primary' : 'default'}
                            onDelete={() => toggle('departments', department.id, department.isActive)}
                            deleteIcon={<Typography variant="caption">{department.isActive ? 'Off' : 'On'}</Typography>}
                          />
                        ))}
                        {!college.departments.length && <Typography variant="body2" color="text.secondary">No departments yet.</Typography>}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                {[
                  ['Users represented', stats?.affiliatedUsers ?? 0],
                  ['Total users', stats?.totalUsers ?? 0],
                  ['Academic affiliations', stats?.totalAffiliations ?? 0],
                ].map(([label, value]) => (
                  <Card key={String(label)} variant="outlined" sx={{ flex: 1 }}>
                    <CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" sx={{ fontWeight: 900 }}>{value}</Typography></CardContent>
                  </Card>
                ))}
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Department distribution</Typography>
              <FundingPie items={chartItems} total={stats?.totalAffiliations ?? 0} />
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>College and school totals</Typography>
              <Stack spacing={1}>
                {(stats?.colleges ?? []).sort((a, b) => b.count - a.count).map((college) => {
                  const percentage = stats?.totalCollegeAffiliations ? (college.count / stats.totalCollegeAffiliations) * 100 : 0;
                  return (
                    <Paper key={college.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 700 }}>{college.name}</Typography>
                        <Typography>{college.count} · {percentage.toFixed(1)}%</Typography>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Department percentages use department selections as the denominator. College totals count each user once per college, even when they selected multiple departments in that college.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog === 'college' ? 'Add college or school' : 'Add department'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialog === 'department' && (
              <TextField select label="College or school" value={collegeId} onChange={(event) => setCollegeId(event.target.value)} required>
                {colleges.filter((college) => college.isActive).map((college) => <MenuItem key={college.id} value={college.id}>{college.name}</MenuItem>)}
              </TextField>
            )}
            <TextField autoFocus label={dialog === 'college' ? 'College or school name' : 'Department name'} value={name} onChange={(event) => setName(event.target.value)} required />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEntry}>Save</Button>
        </DialogActions>
      </Dialog>
    </GradientBox>
  );
};

export default AcademicAffiliations;
