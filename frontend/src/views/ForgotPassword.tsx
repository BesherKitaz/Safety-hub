import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AuthForm, { type AuthFormData } from "../components/AuthForm";
import { WaitingPage } from "./EmailForm";
import api from "../lib/api";

const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.error?.message ?? "Unable to start password reset." : "Unable to start password reset.";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestToken = params.get("requestToken") ?? "";
  const email = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!requestToken) return;
    let active = true;
    const check = async () => {
      try {
        const response = await api.get("/api/user/password-reset/status", { params: { requestToken } });
        if (active && response.data.data.verified) navigate(`/reset-password?credential=${encodeURIComponent(requestToken)}`, { replace: true });
      } catch (requestError) { if (active) setError(message(requestError)); }
    };
    check();
    const interval = window.setInterval(check, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [navigate, requestToken]);
  const submit = async (data: AuthFormData) => {
    try { const response = await api.post("/api/user/password-reset/request", { email: data.email }); setParams({ requestToken: response.data.data.requestToken, email: data.email }); }
    catch (error) { throw new Error(message(error), { cause: error }); }
  };
  return requestToken ? <WaitingPage email={email} error={error} reset onRestart={() => setParams({})} /> : <AuthForm mode="forgot" onSubmit={submit} />;
}
