
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router'
import AuthForm from '../components/AuthForm.tsx';

import api from "../lib/api";

import type { AuthFormData } from '../components/AuthForm.tsx'

type LoginResponse = {
  token: string;
  role: string;
  id: string;
};

const Login = () => {
  const navigate = useNavigate();

  if (localStorage.getItem('token')) {
    navigate('/')
  }


  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  
  const handleLogin = async (data: AuthFormData) => {
  
    try{ 
      const response = await  api.post<LoginResponse>('/api/user/login', data);
      console.log("Login response:", response.data);
      const token = response.data.token;
      const userRole = response.data.role; 
      const userId = response.data.id;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", userId);

      window.location.reload();
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };


  return <AuthForm mode="login" onSubmit={handleLogin} />;
};

export default Login;