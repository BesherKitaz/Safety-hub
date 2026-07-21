import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthForm, { type AuthFormData } from "../components/AuthForm";
import api from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const credential = params.get("credential") ?? "";
  const submit = async (data: AuthFormData) => {
    if (!credential) throw new Error("This password reset session is missing or invalid.");
    try { await api.post("/api/user/password-reset/complete", { credential, password: data.password }); navigate("/login?passwordReset=success", { replace: true }); }
    catch (error) { throw new Error(axios.isAxiosError(error) ? error.response?.data?.error?.message ?? "Unable to reset password." : "Unable to reset password.", { cause: error }); }
  };
  return <AuthForm mode="reset" onSubmit={submit} />;
}
