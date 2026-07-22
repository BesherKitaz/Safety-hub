import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthForm, { type AuthFormData } from "../components/AuthForm";
import api from "../lib/api";

type LoginResponse = { token: string; role: string; id: string };

export default function Login() {
  const navigate = useNavigate();
  useEffect(() => { 
    if (localStorage.getItem("token")) {
      window.location.reload();
      navigate("/", { replace: true });
    }
  }, [navigate]);
  const login = async (data: AuthFormData) => {
    try {
      const response = await api.post<LoginResponse>("/api/user/login", { email: data.email, password: data.password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userRole", response.data.role);
      localStorage.setItem("userId", response.data.id);
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      throw new Error(axios.isAxiosError(error) ? error.response?.data?.error?.message ?? "Unable to log in." : "Unable to log in.", { cause: error });
    }
  };
  return <AuthForm mode="login" onSubmit={login} />;
}
