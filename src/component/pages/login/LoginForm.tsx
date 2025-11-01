"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    useTheme,
    Paper,
    Container,
    Avatar,
    CircularProgress,
    Fade
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import { useToast } from "@/context/smith/ToastContext";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";

const LoginForm: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const { addToast } = useToast();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // ✅ Hardcoded credentials
    const VALID_USERNAME = "admin";
    const VALID_PASSWORD = "admin@123";

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated ) {
            router.push("/");
        }
    }, [isAuthenticated,  router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLocalError(null);

        if (!identifier.trim() || !password.trim()) {
            setLocalError("Please fill in all fields");
            addToast({
                type: 'error',
                title: 'Missing Information',
                message: 'Please enter both username and password'
            });
            setIsLoggingIn(false);
            return;
        }

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (identifier === VALID_USERNAME && password === VALID_PASSWORD) {
                login(identifier);

                addToast({
                    type: 'success',
                    title: 'Welcome Back!',
                    message: 'Successfully logged in to your account'
                });

                // Redirect to main page
                setTimeout(() => {
                    router.push("/");
                }, 500);
            } else {
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            setLocalError("Invalid username or password");
            addToast({
                type: 'error',
                title: 'Authentication Failed',
                message: 'Please check your username and password'
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Don't render if already authenticated or loading auth state
    if (isAuthenticated ) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
            }}
        >
            <Container component="main" maxWidth="sm">
                <Fade in={true} timeout={800}>
                    <Paper
                        elevation={24}
                        sx={{
                            padding: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        {/* Header Section */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                mb: 1,
                                width: '100%',
                            }}
                        >
                            <Avatar
                                sx={{
                                    m: 1,
                                    bgcolor: 'primary.main',
                                    width: 60,
                                    height: 60,
                                    mb: 1,
                                }}
                            >
                                <LockOutlined sx={{ fontSize: 30 }} />
                            </Avatar>
                            <Typography
                                component="h1"
                                variant="h4"
                                fontWeight="bold"
                                color="primary"
                                gutterBottom
                            >
                                Welcome Back
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                textAlign="center"
                            >
                                Sign in to access your account
                            </Typography>
                        </Box>

                        {/* Login Form */}
                        <Box
                            component="form"
                            onSubmit={handleLogin}
                            onKeyPress={handleKeyPress}
                            sx={{
                                width: '100%',
                                mt: 1,
                            }}
                        >
                            {/* Error Message */}
                            {localError && (
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        mb: 3,
                                        backgroundColor: 'error.light',
                                        border: '1px solid',
                                        borderColor: 'error.main',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="error.main"
                                        textAlign="center"
                                        fontWeight="medium"
                                    >
                                        {localError}
                                    </Typography>
                                </Paper>
                            )}

                            {/* Username Field */}
                            <TextField
                                fullWidth
                                label="Username"
                                variant="outlined"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                autoComplete="username"
                              
                                disabled={isLoggingIn}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    },
                                }}
                            />

                            {/* Password Field */}
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                               
                                disabled={isLoggingIn}
                                InputProps={{
                                    endAdornment: (
                                        <Button
                                            onClick={togglePasswordVisibility}
                                            sx={{
                                                minWidth: 'auto',
                                                padding: '4px',
                                                color: 'text.secondary',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    color: 'primary.main',
                                                },
                                            }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </Button>
                                    ),
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    },
                                }}
                            />

                            {/* Login Button */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isLoggingIn}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    boxShadow: 4,
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                {isLoggingIn ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={20} color="inherit" />
                                        Signing In...
                                    </Box>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>

                            {/* Demo Credentials Hint */}
                            {/* <Box
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    backgroundColor: 'grey.50',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    textAlign="center"
                                >
                                    <strong>Demo Credentials:</strong>
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    textAlign="center"
                                >
                                    Username: <strong>{VALID_USERNAME}</strong>
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    textAlign="center"
                                >
                                    Password: <strong>{VALID_PASSWORD}</strong>
                                </Typography>
                            </Box> */}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Secure access to your workspace
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default LoginForm;