import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import axios from 'axios';

type VerifyState = 'loading' | 'success' | 'error';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification token is missing.');
      return;
    }

    let isMounted = true;
    let redirectTimer: ReturnType<typeof window.setTimeout> | undefined;

    const verify = async () => {
      try {
        const response = await api.get('/api/user/verify-email', {
          params: { token },
        });

        if (!isMounted) {
          return;
        }

        setState('success');
        const verifiedEmail = response.data?.data?.email ?? '';
        setMessage(response.data?.message ?? 'Email verified successfully. Redirecting to signup...');

        redirectTimer = window.setTimeout(() => {
          navigate(`/signup?email=${encodeURIComponent(verifiedEmail)}`, { replace: true });
        }, 1000);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (axios.isAxiosError(error)) {
          const apiMessage = error.response?.data?.error?.message;
          setMessage(apiMessage ?? 'We could not verify this email.');
        } else {
          setMessage('We could not verify this email.');
        }

        setState('error');
      }
    };

    verify();

    return () => {
      isMounted = false;
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [navigate, token]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 560, p: 4 }} elevation={3}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center' }}>
            Email Verification
          </Typography>

          {state === 'loading' && (
            <Alert severity="info">Verifying your email address now.</Alert>
          )}

          {state === 'success' && (
            <Alert severity="success">{message}</Alert>
          )}

          {state === 'error' && (
            <Alert severity="error">{message}</Alert>
          )}

          <Stack spacing={2}>
            <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth>
              Return to login
            </Button>
            <Button component={RouterLink} to="/email" variant="outlined" size="large" fullWidth>
              Start over
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default VerifyEmail;
