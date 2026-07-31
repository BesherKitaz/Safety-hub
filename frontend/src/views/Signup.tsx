import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm, { type AuthFormData } from '../components/AuthForm.tsx';
import api from '../lib/api';
import axios from 'axios';
import { BYPASS_EMAIL_VERIFICATION } from '../util/emailPolicy';

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const Signup = () => {
  // Signup normally requires the preceding email credential unless verification is explicitly bypassed.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verifiedEmail = searchParams.get('email')?.trim() ?? '';
  const verificationToken = searchParams.get('requestToken')?.trim() || searchParams.get('linkToken')?.trim() || '';

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }

    if (!verifiedEmail || (!BYPASS_EMAIL_VERIFICATION && !verificationToken)) {
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
