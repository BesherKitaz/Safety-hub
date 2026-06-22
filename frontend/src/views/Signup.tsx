import React, { useEffect } from 'react';
import AuthForm from '../components/AuthForm.tsx';
import { useNavigate } from 'react-router-dom'




const Signup = () => {

  const navigate = useNavigate()

  useEffect(() => {
      if (localStorage.getItem("token")) {
        navigate("/", { replace: true });
      }
  }, [navigate]);


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