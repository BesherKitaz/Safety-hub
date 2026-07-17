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

const Signup = () => {

  const navigate = useNavigate()

  useEffect(() => {
      if (localStorage.getItem("token")) {
        navigate("/", { replace: true });
      }
  }, [navigate]);


// Handle the signup form submission, including password strength validation
// Throw an error if the password is too weak
  const handleSignup = async (data: {
    name?: string;
    email: string;
    password: string;
  }) => {

    const { password } = data;
    const passwordChecker = new ZxcvbnFactory(options);
    const result = passwordChecker.check(password);
    const resultDetails = {
      valid: password.length >= 12 && result.score >= 3,
      score: result.score, // 0–4
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions,
    }

    if (result.score < 3 && resultDetails.valid) {
      throw new Error(`Password is too weak: try ${resultDetails.suggestions.join(' ')}`);
      return;
    }
    if (!resultDetails.valid) {
      throw new Error(`Password is too weak: try ${resultDetails.suggestions.join(' ')}`);
    }

    // Proceed with signup logic, e.g., send data to backend API
    try {
      await api.post("/api/user/signup", data);
      navigate("/login", { replace: true });

    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const apiError = error.response?.data?.error;
        console.log(apiError)
        throw new Error(
          apiError?.message ?? "Unable to create your account.",
          { cause: error }
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("An unexpected error occurred", {
        cause: error,
      });
    }

  };

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
};

export default Signup;