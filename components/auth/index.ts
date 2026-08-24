// AuthHeroPanel is deliberately NOT re-exported: it is a server component that
// reaches lib/data/design -> lib/supabase/server, and a barrel shared with
// client components would drag that whole module graph into the browser bundle.
// app/(auth)/layout.tsx imports it by path.
export * from "./AuthTransition";
export * from "./LoginForm";
export * from "./SignupForm";
export * from "./ForgotPasswordForm";
export * from "./ResetPasswordForm";
export * from "./VerifyOtpForm";
