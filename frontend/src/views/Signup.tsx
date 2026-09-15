import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm, { type AuthFormData } from '../components/AuthForm.tsx';
import api from '../lib/api';
import axios from 'axios';

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const Signup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }

  }, [navigate]);

  const handleSignup = async (data: AuthFormData) => {
    try {
      const response = await api.post('/api/user/signup', { name: data.name });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userId', response.data.id);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const apiError = error.response?.data?.error;
        throw new Error(apiError?.message ?? 'Unable to create your account.', { cause: error });
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred', { cause: error });
    }
  };

  return <AuthForm mode='signup' onSubmit={handleSignup} />;
};

export default Signup;
