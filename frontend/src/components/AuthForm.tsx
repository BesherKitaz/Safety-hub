// src/components/AuthForm.tsx
import React, { useEffect, useRef, useState } from "react";

// MUI Imports
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  FormHelperText,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

// Helpers (navigation and password strenght check)
import { Link } from "react-router-dom";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as commonPackage from "@zxcvbn-ts/language-common";


const options = {
  dictionary: {
    ...commonPackage.dictionary,
  },
  graphs: commonPackage.adjacencyGraphs,
};


export type AuthFormData = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

type AuthFormProps = {
  mode: "login" | "signup" | "email";
  onSubmit: (data: AuthFormData) => void;
  signupEmail?: string;
};



const AuthForm = ({ mode, onSubmit, signupEmail }: AuthFormProps) => {
  const [ passwordHelper, setPasswordHelper ] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailCooldownActive, setIsEmailCooldownActive] = useState(false);
  const cooldownTimeoutRef = useRef<number | null>(null);
  const isSignup = mode === "signup";

  const [formData, setFormData] = useState<AuthFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignup) {
      setFormData((current) => ({
        ...current,
        email: signupEmail ?? "",
      }));
    }
  }, [isSignup, signupEmail]);

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current !== null) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (field: keyof AuthFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = event.target.value;
    if (confirmPassword !== formData.password) {
      setPasswordHelper('Passwords must match!');
    } else {
      setPasswordHelper('');
    }
    setFormData({
      ...formData,
      confirmPassword,
    });
  };

  const handlePasswordSignupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const password = event.target.value;
    if (password !== formData.confirmPassword) {
      setPasswordHelper('Passwords must match!');
    } else {
      setPasswordHelper('');
    }
    setFormData({
      ...formData,
      password,
    });
    const passwordChecker = new ZxcvbnFactory(options);
    const result = passwordChecker.check(password);
    const resultDetails = {
      valid: (password.length >= 12 && result.score >= 3),
      score: result.score, // 0–4
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions,
    }
    if (!resultDetails.valid) {
      setPasswordHelper(`Password is too weak`);
    } else {
      setPasswordHelper('');
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'email' && isEmailCooldownActive) {
      return;
    }

    if (isSignup && formData.password !== formData.confirmPassword) {
      setPasswordHelper('Passwords must match!');
      return;
    }

    if (mode === 'email') {
      setIsEmailCooldownActive(true);
      if (cooldownTimeoutRef.current !== null) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
      cooldownTimeoutRef.current = window.setTimeout(() => {
        setIsEmailCooldownActive(false);
        cooldownTimeoutRef.current = null;
      }, 5000);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPasswordSlotProps = (
    isVisible: boolean,
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => ({
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => setIsVisible((previous) => !previous)}
            onMouseDown={(event) => event.preventDefault()}
            edge="end"
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  });
  

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: (theme) => theme.zIndex.snackbar,
            minWidth: 360,
            maxWidth: 700,
            boxShadow: 6,
          }}
        >
          {error}
        </Alert>
    )}


      <Box
        sx={{
          minHeight: "calc(100dvh / var(--app-scale, 1))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          px: 2,
        }}
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={3}
          sx={{ width: "100%", maxWidth: { xs: "100%", sm: 600 }, p: 4 }}
        >
          <Stack spacing={3}>
              <Typography variant="h4" component="h1" sx={{ textAlign: "center" }}>
                  {isSignup ? "Create Account" : "Log In"}
              </Typography>
          {isSignup && (
            <>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                fullWidth
                required
              />

              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                fullWidth
                required
              />

              <TextField
                label="Verified Email"
                value={signupEmail ?? ""}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
                helperText="This email was verified and cannot be changed."
              />
            </>
          )}
          {!isSignup && (
            <TextField
              label="Purdue Email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              fullWidth
              required
            />
          )}
          {mode !== "email" && (
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={isSignup ? handlePasswordSignupChange : handleChange("password")}
                fullWidth
                required
                onCopy={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                slotProps={createPasswordSlotProps(showPassword, setShowPassword)}
              />
          )}
            {isSignup && (
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword ?? ""}
                onChange={handleConfirmPasswordChange}
                fullWidth 
                required
                onCopy={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                slotProps={createPasswordSlotProps(showConfirmPassword, setShowConfirmPassword)}
              />
            )}
            {isSignup && passwordHelper && (
              <Typography color="error">
                {passwordHelper}
              </Typography>
            )}
            {isSignup && (
              <FormHelperText>
                Please enter your name and password to create an account.
              </FormHelperText>
            )}
            {(mode === "email") && (
              <FormHelperText>
                Please enter your email to begin.
              </FormHelperText>
            )}
            {(!isSignup && mode !== "email") && (
              <FormHelperText>
                Please enter your email and password to log in.
              </FormHelperText>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting || (mode === 'email' && isEmailCooldownActive)}
            >
              {
                mode === "email" ? "Verify Email" : (isSignup ? "Sign Up" : "Log In")
              }
            </Button>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              {isSignup ? "By signing up, you agree to our terms and conditions." : "Forgot your password?"}
            </Typography>
              {isSignup ? (
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  Already have an account? <Link to="/login">Log in</Link>.
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  Don't have an account? <Link to="/email">Create one</Link>.
                </Typography>
              )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthForm;

