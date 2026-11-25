"use client";

import { useSessionUser } from "@/hooks";
import { permissions } from "@/lib/permissions";
import { ManagerDashboard } from "./manager-dashboard";
import { MyProgress } from "./my-progress";

export function DashboardView() {
  const sessionUser = useSessionUser();
  return permissions.canPerform(sessionUser.role, "seeGymNumbers") ? (
    <ManagerDashboard />
  ) : (
    <MyProgress />
  );
}
