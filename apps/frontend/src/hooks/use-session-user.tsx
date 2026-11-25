"use client";

import { createContext, use, type ReactNode } from "react";
import type { SessionUser } from "@imc-calculator/shared";

const SessionUserContext = createContext<SessionUser | null>(null);

export function SessionUserProvider({
  sessionUser,
  children,
}: {
  sessionUser: SessionUser;
  children: ReactNode;
}) {
  return <SessionUserContext value={sessionUser}>{children}</SessionUserContext>;
}

export function useSessionUser(): SessionUser {
  const sessionUser = use(SessionUserContext);
  if (!sessionUser) {
    throw new Error("useSessionUser must be used inside SessionUserProvider");
  }
  return sessionUser;
}
