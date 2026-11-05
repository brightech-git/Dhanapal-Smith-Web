"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AnimatePresence,
    motion,
    useAnimationControls,
    useReducedMotion,
    type Variants,
} from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Coins,
    Eye,
    EyeOff,
    Gift,
    Loader2,
    Lock,
    Printer,
    ShieldCheck,
    User,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/lib/auth-context";

const REMEMBER_KEY = "smith.rememberedUser";
const BRAND = "Brightech Software Services";
const PRODUCT = "Smith & Gift Voucher Suite";
const LOGO_SRC = "/logo/com-logo.jpg";

const projectHomePath = (project?: string) =>
    project === "GV" ? "/gift-voucher" : "/";

// Small helpers so a blocked or private-mode storage never breaks login.
const readRemembered = () => {
    try {
        return localStorage.getItem(REMEMBER_KEY) ?? "";
    } catch {
        return "";
    }
};
const writeRemembered = (value: string | null) => {
    try {
        if (value) localStorage.setItem(REMEMBER_KEY, value);
        else localStorage.removeItem(REMEMBER_KEY);
    } catch {
        /* storage unavailable: nothing to remember */
    }
};

const FEATURES = [
    { icon: Coins, title: "Smith ledger", text: "Cash and gold weight balances per smith" },
    { icon: Gift, title: "Gift vouchers", text: "Issue, receipt and track every voucher" },
    { icon: Printer, title: "Reports & printing", text: "Print summaries and voucher tags" },
];

type FieldErrors = { userName?: string; password?: string };

const LoginForm: React.FC = () => {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, allDetails } = useAuth();
    const reduceMotion = useReducedMotion();
    const shake = useAnimationControls();

    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const userRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    // Set while the success animation plays so the "already signed in"
    // redirect below does not cut it short.
    const justSignedIn = useRef(false);

    useEffect(() => {
        const saved = readRemembered();
        if (saved) {
            setUserName(saved);
            setRemember(true);
            passwordRef.current?.focus();
        } else {
            userRef.current?.focus();
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && !justSignedIn.current) {
            router.replace(projectHomePath(allDetails?.projectName));
        }
    }, [isAuthenticated, allDetails, router]);

    const fail = () => {
        if (!reduceMotion) {
            shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.45 } });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== "idle") return;
        setServerError(null);

        const errors: FieldErrors = {};
        if (!userName.trim()) errors.userName = "Enter your username";
        if (!password) errors.password = "Enter your password";
        setFieldErrors(errors);
        if (errors.userName || errors.password) {
            (errors.userName ? userRef : passwordRef).current?.focus();
            fail();
            return;
        }

        setStatus("loading");
        justSignedIn.current = true;
        try {
            const details = await login(userName.trim(), password);
            writeRemembered(remember ? userName.trim() : null);
            setStatus("success");
            setTimeout(
                () => router.replace(projectHomePath(details?.projectName)),
                reduceMotion ? 0 : 900
            );
        } catch (error: any) {
            justSignedIn.current = false;
            setStatus("idle");
            setServerError(error?.message || "Invalid username or password");
            setPassword("");
            passwordRef.current?.focus();
            fail();
        }
    };

    const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) =>
        setCapsLock(e.getModifierState?.("CapsLock") ?? false);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f4f7fb]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const container: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: 0.15 } },
    };
    const item: Variants = reduceMotion
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : {
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
          };

    const busy = status !== "idle";

    return (
        <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4f7fb] via-white to-[#fdf8ee] px-4 py-10 sm:px-6">
            <Backdrop reduceMotion={!!reduceMotion} />

            <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-5xl rounded-[26px] bg-gradient-to-br from-amber-300/80 via-slate-200 to-[#1d5fb0]/50 p-px shadow-[0_30px_70px_-25px_rgba(12,55,106,0.35)]"
            >
            <div className="grid overflow-hidden rounded-[25px] bg-white lg:grid-cols-[1.05fr_1fr]">
                {/* Brand panel */}
                <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-100 p-10 text-[#0c2a52] lg:flex">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#eaf2fc] via-[#f5f8fd] to-[#fdf3dc]" />
                    <div className="absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(45deg,#dbe5f1_1px,transparent_1px),linear-gradient(-45deg,#dbe5f1_1px,transparent_1px)] [background-size:28px_28px]" />

                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                        <motion.div variants={item} className="flex items-center gap-4">
                            <BrandMark reduceMotion={!!reduceMotion} />
                            <div>
                                <h1 className="text-xl font-bold uppercase leading-tight tracking-[0.18em]">Brightech</h1>
                                <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-700">
                                    Software Services
                                </p>
                            </div>
                        </motion.div>

                        <motion.span
                            variants={item}
                            className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            {PRODUCT}
                        </motion.span>

                        <motion.h2
                            variants={item}
                            className="max-w-sm text-4xl font-semibold leading-[1.15] tracking-tight"
                        >
                            Jewellery back-office,{" "}
                            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-700 bg-clip-text text-transparent">
                                crafted for precision.
                            </span>
                        </motion.h2>

                        <motion.ul variants={container} className="space-y-4 pt-2">
                            {FEATURES.map(({ icon: Icon, title, text }) => (
                                <motion.li key={title} variants={item} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#0c376a]/10">
                                        <Icon className="h-4 w-4 text-amber-600" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">{title}</span>
                                        <span className="block text-sm text-slate-500">{text}</span>
                                    </span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} {BRAND}. All rights reserved.
                    </p>
                </div>

                {/* Form panel */}
                <div className="relative bg-white px-6 py-10 sm:px-10 sm:py-12">
                    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto w-full max-w-sm">
                        {/* Compact brand for phones and tablets */}
                        <motion.div variants={item} className="mb-8 flex items-center gap-3 lg:hidden">
                            <BrandMark reduceMotion={!!reduceMotion} small />
                            <div>
                                <span className="block text-base font-bold uppercase tracking-[0.16em] text-primary">Brightech</span>
                                <span className="block text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500">Software Services</span>
                            </div>
                        </motion.div>

                        <motion.h3 variants={item} className="text-3xl font-semibold tracking-tight text-slate-900">
                            Sign in
                        </motion.h3>
                        <motion.p variants={item} className="mt-2 text-sm text-slate-500">
                            Welcome back. Enter your details to continue.
                        </motion.p>

                        <motion.form
                            animate={shake}
                            onSubmit={handleSubmit}
                            noValidate
                            className="mt-8 space-y-5"
                        >
                            <AnimatePresence initial={false}>
                                {serverError && (
                                    <motion.div
                                        key="server-error"
                                        role="alert"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{serverError}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={item}>
                                <Field
                                    id="userName"
                                    label="Username"
                                    icon={User}
                                    inputRef={userRef}
                                    value={userName}
                                    onChange={(v) => {
                                        setUserName(v);
                                        if (fieldErrors.userName) setFieldErrors((f) => ({ ...f, userName: undefined }));
                                    }}
                                    autoComplete="username"
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        // Enter on username moves to password instead of submitting.
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            passwordRef.current?.focus();
                                        }
                                    }}
                                    disabled={busy}
                                    error={fieldErrors.userName}
                                />
                            </motion.div>

                            <motion.div variants={item}>
                                <Field
                                    id="password"
                                    label="Password"
                                    icon={Lock}
                                    inputRef={passwordRef}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(v) => {
                                        setPassword(v);
                                        if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                                    }}
                                    onKeyUp={onPasswordKey}
                                    onKeyDown={onPasswordKey}
                                    onBlur={() => setCapsLock(false)}
                                    autoComplete="current-password"
                                    enterKeyHint="go"
                                    disabled={busy}
                                    error={fieldErrors.password}
                                    trailing={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    }
                                />
                                <AnimatePresence>
                                    {capsLock && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="mt-1.5 text-xs font-medium text-amber-600"
                                        >
                                            Caps Lock is on
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <motion.label
                                variants={item}
                                className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    disabled={busy}
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-primary"
                                />
                                Remember my username
                            </motion.label>

                            <motion.div variants={item}>
                                <SubmitButton status={status} reduceMotion={!!reduceMotion} />
                            </motion.div>
                        </motion.form>

                        <motion.div variants={item} className="mt-10 flex items-center justify-center gap-3 text-xs text-slate-400">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                Secured by {BRAND}
                            </span>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                        </motion.div>
                        <motion.p variants={item} className="mt-3 text-center text-xs text-slate-400">
                            Trouble signing in? Contact your administrator.
                        </motion.p>
                    </motion.div>
                </div>
            </div>
            </motion.div>
        </div>
    );
};

/* ------------------------------------------------------------------ */

interface FieldProps {
    id: string;
    label: string;
    icon: React.ElementType;
    value: string;
    onChange: (value: string) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    type?: string;
    autoComplete?: string;
    disabled?: boolean;
    error?: string;
    trailing?: React.ReactNode;
    onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>["enterKeyHint"];
    onBlur?: () => void;
}

// Input with a floating label, leading icon and inline error.
const Field: React.FC<FieldProps> = ({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    inputRef,
    type = "text",
    autoComplete,
    disabled,
    error,
    trailing,
    onKeyUp,
    onKeyDown,
    onBlur,
    enterKeyHint,
}) => (
    <div>
        <div
            className={`group relative flex items-center rounded-xl border bg-slate-50/60 transition-all duration-200 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(12,55,106,0.08)] ${
                error
                    ? "border-red-300 focus-within:border-red-400"
                    : "border-slate-200 hover:border-slate-300 focus-within:border-primary"
            }`}
        >
            <Icon
                className={`pointer-events-none absolute left-3.5 h-[18px] w-[18px] transition-colors ${
                    error ? "text-red-400" : "text-slate-400 group-focus-within:text-primary"
                }`}
            />
            <input
                id={id}
                ref={inputRef}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyUp={onKeyUp}
                onKeyDown={onKeyDown}
                enterKeyHint={enterKeyHint}
                onBlur={onBlur}
                autoComplete={autoComplete}
                disabled={disabled}
                placeholder=" "
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className="peer h-14 w-full rounded-xl bg-transparent pb-2 pl-11 pr-11 pt-6 text-[15px] text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-[15px] text-slate-400 transition-all duration-200 peer-focus:top-[18px] peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-[18px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
            >
                {label}
            </label>
            {trailing && <div className="absolute right-2">{trailing}</div>}
        </div>
        <AnimatePresence>
            {error && (
                <motion.p
                    id={`${id}-error`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-xs font-medium text-red-600"
                >
                    {error}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

const SubmitButton: React.FC<{ status: "idle" | "loading" | "success"; reduceMotion: boolean }> = ({
    status,
    reduceMotion,
}) => (
    <motion.button
        type="submit"
        disabled={status !== "idle"}
        whileHover={status === "idle" && !reduceMotion ? { y: -1 } : undefined}
        whileTap={status === "idle" && !reduceMotion ? { scale: 0.985 } : undefined}
        className={`group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl text-[15px] font-semibold text-white shadow-lg transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-default ${
            status === "success"
                ? "bg-emerald-600 shadow-emerald-600/25"
                : "bg-gradient-to-r from-primary to-primary-500 shadow-primary/25"
        }`}
    >
        {/* Shimmer sweep on hover */}
        {status === "idle" && !reduceMotion && (
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
        )}
        <AnimatePresence mode="wait" initial={false}>
            {status === "idle" && (
                <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2"
                >
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </motion.span>
            )}
            {status === "loading" && (
                <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2"
                >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                </motion.span>
            )}
            {status === "success" && (
                <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="flex items-center gap-2"
                >
                    <CheckCircle2 className="h-5 w-5" />
                    Signed in
                </motion.span>
            )}
        </AnimatePresence>
    </motion.button>
);

// Brightech logo on a white tile, ringed by a slowly turning gold halo.
const BrandMark: React.FC<{ reduceMotion: boolean; small?: boolean }> = ({ reduceMotion, small }) => {
    const size = small ? 44 : 60;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* Clip a rotating gradient to a rounded frame so only a thin ring shows. */}
            <span className="absolute -inset-[3px] overflow-hidden rounded-[17px]">
                <motion.span
                    className="absolute -inset-1/2 bg-[conic-gradient(from_0deg,#fde68a,#f59e0b,#1d5fb0,#fde68a)]"
                    animate={reduceMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
            </span>
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white p-1.5 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_SRC} alt={`${BRAND} logo`} className="h-full w-full object-contain" />
                {!reduceMotion && (
                    <motion.span
                        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                        animate={{ left: ["-40%", "140%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                )}
            </div>
        </div>
    );
};

// Slow drifting glows and twinkling sparkles behind the card.
const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
    left: (i * 53) % 100,
    top: (i * 37 + 11) % 100,
    delay: (i % 6) * 0.7,
    size: i % 3 === 0 ? 3 : 2,
}));

const Backdrop: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <motion.div
            className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#93c5fd] opacity-40 blur-[120px]"
            animate={reduceMotion ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-amber-300 opacity-35 blur-[120px]"
            animate={reduceMotion ? undefined : { x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        {!reduceMotion &&
            SPARKLES.map((s, i) => (
                <motion.span
                    key={i}
                    className="absolute rounded-full bg-amber-400"
                    style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.2, 0.6] }}
                    transition={{ duration: 3.2, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
                />
            ))}
    </div>
);

export default LoginForm;
