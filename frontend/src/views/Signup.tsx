import React from 'react';
import AuthForm from '../components/AuthForm.tsx';





const Signup = () => {
  const handleSignup = (data: {
    name?: string;
    email: string;
    password: string;
  }) => {
    console.log("Signup:", data);
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
};

export default Signup;