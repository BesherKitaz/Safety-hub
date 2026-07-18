import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm, { type AuthFormData } from '../components/AuthForm.tsx';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as commonPackage from '@zxcvbn-ts/language-common';
import api from '../lib/api';
import axios from 'axios';

const options = {
  dictionary: {
    ...commonPackage.dictionary,
  },
  graphs: commonPackage.adjacencyGraphs,
};

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

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }

    if (!verifiedEmail) {
      navigate('/email', { replace: true });
    }
  }, [navigate, verifiedEmail]);

  const handleSignup = async (data: AuthFormData) => {
    const password = data.password;
    const passwordChecker = new ZxcvbnFactory(options);
    const result = passwordChecker.check(password);
    const resultDetails = {
      valid: password.length >= 12 && result.score >= 3,
      score: result.score,
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions,
    };

    if (!resultDetails.valid) {
      throw new Error(`Password is too weak: try ${resultDetails.suggestions.join(' ')}`);
    }

    try {
      await api.post('/api/user/signup', {
        ...data,
        email: verifiedEmail,
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
