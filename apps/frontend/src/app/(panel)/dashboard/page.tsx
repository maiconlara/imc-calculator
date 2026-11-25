import { Suspense } from "react";
import { NewAssessmentButton } from "@/components/assessments";
import { DashboardContent } from "@/components/contents/dashboard-content";
import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ManagerDashboardSkeleton, MyProgressSkeleton } from "@/components/ui/skeletons";
import { permissions } from "@/lib/permissions";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

export function generateMetadata() {
  return getScreenMetadata("dashboard");
}

export default async function DashboardPage() {
  const sessionUser = await requireSessionUser("dashboard");
  const canSeeGymNumbers = permissions.canPerform(sessionUser.role, "seeGymNumbers");

  return (
    <>
      <PageHeader
        title={getScreenTitle("dashboard", sessionUser.role)}
        actions={
          permissions.canPerform(sessionUser.role, "recordAssessments") ? (
            <NewAssessmentButton />
          ) : null
        }
      />
      <PageContent>
        <Suspense
          fallback={
            canSeeGymNumbers ? <ManagerDashboardSkeleton /> : <MyProgressSkeleton />
          }
        >
          <DashboardContent role={sessionUser.role} />
        </Suspense>
      </PageContent>
    </>
  );
}
