import { Suspense } from "react";
import { AssessmentsContent } from "@/components/contents/assessments-content";
import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ListSkeleton } from "@/components/ui/skeletons";
import { NewAssessmentButton } from "@/components/views/new-assessment-button";
import { permissions, type PanelAction } from "@/lib/permissions";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

const PERSON_FILTER_ACTIONS: readonly PanelAction[] = [
  "filterAssessmentsByStudent",
  "filterAssessmentsByTeacher",
];

export function generateMetadata() {
  return getScreenMetadata("assessments");
}

export default async function AssessmentsPage() {
  const sessionUser = await requireSessionUser("assessments");
  const personFilterCount = PERSON_FILTER_ACTIONS.filter((action) =>
    permissions.canPerform(sessionUser.role, action),
  ).length;

  return (
    <>
      <PageHeader
        title={getScreenTitle("assessments", sessionUser.role)}
        actions={
          permissions.canPerform(sessionUser.role, "recordAssessments") ? (
            <NewAssessmentButton />
          ) : null
        }
      />
      <PageContent>
        <Suspense fallback={<ListSkeleton filters={personFilterCount + 1} />}>
          <AssessmentsContent role={sessionUser.role} />
        </Suspense>
      </PageContent>
    </>
  );
}
