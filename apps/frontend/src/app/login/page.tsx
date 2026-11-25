import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/views/login-screen";
import { getSafeRedirectPath } from "@/lib/routes";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Entrar" };

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; expired?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const loginSearchParams = await searchParams;
  const redirectPathAfterLogin = getSafeRedirectPath(loginSearchParams.redirect);

  const sessionUser = await getSessionUser().catch(() => null);
  if (sessionUser) redirect(redirectPathAfterLogin);

  return (
    <LoginScreen
      redirectPathAfterLogin={redirectPathAfterLogin}
      isSessionExpired={loginSearchParams.expired === "1"}
    />
  );
}
