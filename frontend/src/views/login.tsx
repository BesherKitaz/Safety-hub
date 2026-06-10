
import React from 'react';
import AuthForm from '../components/AuthForm.tsx';




const Login = () => {
  const handleLogin = (data: {
    email: string;
    password: string;
    name?: string;
  }) => {
    console.log("Login:", data);
  };

  return <AuthForm mode="login" onSubmit={handleLogin} />;
};

export default Login;