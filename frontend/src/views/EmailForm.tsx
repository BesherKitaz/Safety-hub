import React, { useEffect } from 'react';
import AuthForm from '../components/AuthForm.tsx';
import { useNavigate } from 'react-router-dom'
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as commonPackage from "@zxcvbn-ts/language-common";
import api from '../lib/api'
import axios from "axios"; // for Api Error handling


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

const EmailForm = () => {

  const navigate = useNavigate()

  useEffect(() => {
      if (localStorage.getItem("token")) {
        navigate("/", { replace: true });
      }
  }, [navigate]);


// Handle the signup form submission, including password strength validation
// Throw an error if the password is too weak
  const handleEmailSubmit = async (data: {
    email: string;
  }) => {
    try {
      const response = await api.post('/api/user/send-email', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiErrorResponse;
        throw new Error(apiError.error.message);
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  };

  return <AuthForm mode="email" onSubmit={handleEmailSubmit} />;
};

export default EmailForm;