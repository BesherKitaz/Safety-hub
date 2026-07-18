import React, { useEffect, useState } from 'react';
import AuthForm from '../components/AuthForm.tsx';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import api from '../lib/api';
import axios from 'axios';

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const EmailForm = () => {
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleEmailSubmit = async (data: { email: string }) => {
    try {
      const response = await api.post('/api/user/send-email', data);
      setToastMessage('Email sent. Please open your email inbox to continue.');
      setToastOpen(true);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiErrorResponse;
        throw new Error(apiError.error.message);
      }

      throw new Error('An unexpected error occurred');
    }
  };

  return (
    <>
      <AuthForm mode='email' onSubmit={handleEmailSubmit} />
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity='success'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmailForm;
