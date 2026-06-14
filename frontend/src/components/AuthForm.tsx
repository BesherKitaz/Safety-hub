// src/components/AuthForm.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

export type AuthFormData = {
  name?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  mode: "login" | "signup";
  onSubmit: (data: AuthFormData) => void;
};

const AuthForm = ({ mode, onSubmit }: AuthFormProps) => {
  const isSignup = mode === "signup";

  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (field: keyof AuthFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{ width: "100%", maxWidth: 420, p: 4 }}
      >
        <Stack spacing={3}>
            <Typography variant="h4" component="h1" sx={{ textAlign: "center" }}>
                {isSignup ? "Create Account" : "Log In"}
            </Typography>

          {isSignup && (
            <TextField
              label="Name"
              value={formData.name}
              onChange={handleChange("name")}
              fullWidth
              required
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            fullWidth
            required
          />

          <TextField
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            fullWidth
            required
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            {isSignup ? "Sign Up" : "Log In"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AuthForm;
