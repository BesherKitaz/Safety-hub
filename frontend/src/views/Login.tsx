
import React from 'react';
import { useNavigate } from 'react-router'
import AuthForm from '../components/AuthForm.tsx';

import api from "../lib/api";

import type { AuthFormData } from '../components/AuthForm.tsx'

type LoginResponse = {
  token: string;
};

const Login = () => {

  const navigate = useNavigate();

  const handleLogin = async (data: AuthFormData) => {
  
    try{ 
      const response = await  api.post<LoginResponse>('/api/user/login', data);
      console.log("Login response:", response.data);
      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate('/');
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return <AuthForm mode="login" onSubmit={handleLogin} />;
};

export default Login;