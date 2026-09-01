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
    Fade,
    NativeSelect,
    Autocomplete
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import { useToast } from "@/context/smith/ToastContext";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";

const LoginForm: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();

    const projectTypeList = [{label:"Smith",value:"SMITH"} , {label:"Gift Voucher",value:"GV"}]

    const projectHomePath = (project?: string) =>
        project === "GV" ? "/GiftVoucher" : "/";


    const { login, isAuthenticated, isLoading, allDetails } = useAuth();

    console.log(allDetails,'allDetails')
    const { addToast } = useToast();

    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [projectType ,setProjectType ] =useState<string>("SMITH");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) router.push(projectHomePath(allDetails?.projectName));
    }, [isAuthenticated, allDetails, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!userName || !password ) {
            setLocalError("Please fill in all fields");
            addToast({
                type: "error",
                title: "Missing Information",
                message: "Please enter both username and password",
            });
            return;
        }

        if(!projectType) {
            setLocalError("Please Select ProjectType");
            return;
        }

        setIsLoggingIn(true);

        try {
            await login(userName, password ,projectType);

            addToast({
                type: "success",
                title: "Welcome Back!",
                message: "Successfully logged in to your account",
            });

            router.push(projectHomePath(projectType));
        } catch (error: any) {
            setLocalError(error.message || "Invalid username or password");
            addToast({
                type: "error",
                title: "Authentication Failed",
                message: error.message || "Please check your credentials",
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 2,
            }}
        >
            <Container component="main" maxWidth="sm">
                <Fade in={true} timeout={800}>
                    <Paper
                        elevation={24}
                        sx={{
                            padding: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            borderRadius: 3,
                            background: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                    >
                        <Avatar
                            sx={{
                                m: 1,
                                bgcolor: "primary.main",
                                width: 60,
                                height: 60,
                                mb: 1,
                            }}
                        >
                            <LockOutlined sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                            Welcome Back
                        </Typography>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                            Sign in to access your account
                        </Typography>

                        <Box component="form" onSubmit={handleLogin} sx={{ width: "100%", mt: 2 }}>
                            {localError && (
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        mb: 3,
                                        backgroundColor: "error.light",
                                        border: "1px solid",
                                        borderColor: "error.main",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography color="white" textAlign="center">
                                        {localError}
                                    </Typography>
                                </Paper>
                            )}
                            <Autocomplete
                                disablePortal
                                options={projectTypeList}
                                className=""
                                getOptionLabel={(option) => option.label}
                                value={
                                    projectTypeList.find(
                                        (option) => option.value === projectType
                                    ) || null
                                }
                                onChange={(event, newValue) => {
                                    setProjectType(newValue?.value || "SMITH");
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="ProjectType" sx={{ mb: 2 }} />
                                )}
                                size="small"
                              
                            />

                            <TextField
                                fullWidth
                                label="Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                disabled={isLoggingIn}
                                sx={{ mb: 2 }}
                                size="small"
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoggingIn}
                                InputProps={{
                                    endAdornment: (
                                        <Button onClick={togglePasswordVisibility} sx={{ minWidth: "auto" }}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </Button>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                                size="small"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isLoggingIn}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: "bold",
                                    textTransform: "none",
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
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default LoginForm;
