import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const verifiedEmail = searchParams.get('email')?.trim() ?? '';
  const verificationToken = searchParams.get('requestToken')?.trim() || searchParams.get('linkToken')?.trim() || '';

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }

    if (!verifiedEmail || !verificationToken) {
      navigate('/email', { replace: true });
    }
  }, [navigate, verifiedEmail, verificationToken]);

  const handleSignup = async (data: AuthFormData) => {
    try {
      await api.post('/api/user/signup', {
        ...data,
        email: verifiedEmail,
        verificationToken,
      });
      navigate('/login', { replace: true });
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

  return <AuthForm mode='signup' onSubmit={handleSignup} signupEmail={verifiedEmail} />;
};

export default Signup;
