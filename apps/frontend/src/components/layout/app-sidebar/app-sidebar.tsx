"use client";

import type { SessionUser } from "@imc-calculator/shared";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileTopBar } from "./mobile-top-bar";

/**
 * Panel menu: a rail on the left of wide screens, and a top bar with a drawer on
 * phones and tablets. Each one hides itself on the screens of the other.
 */
export function AppSidebar({ sessionUser }: { sessionUser: SessionUser }) {
  return (
    <>
      <DesktopSidebar sessionUser={sessionUser} />
      <MobileTopBar sessionUser={sessionUser} />
    </>
  );
}
