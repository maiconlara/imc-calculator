import { HydrationBoundary, QueryClient, dehydrate, noop } from "@tanstack/react-query";
import type { Role } from "@imc-calculator/shared";
import { AssessmentsView } from "@/components/views/assessments-view";
import {
  ASSESSED_STUDENT_OPTIONS_FILTERS,
  INITIAL_ASSESSMENTS_FILTERS,
  TEACHER_OPTIONS_FILTERS,
} from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { getDirectBackendApi } from "@/lib/server/session";
import { assessmentQueries, userQueries } from "@/queries";

export async function AssessmentsContent({ role }: { role: Role }) {
  const directBackendApi = await getDirectBackendApi();
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient
      .query(
        assessmentQueries.getAssessments(INITIAL_ASSESSMENTS_FILTERS, directBackendApi),
      )
      .catch(noop),
    permissions.canPerform(role, "filterAssessmentsByStudent")
      ? queryClient
          .query(
            userQueries.getUserOptions(
              ASSESSED_STUDENT_OPTIONS_FILTERS,
              directBackendApi,
            ),
          )
          .catch(noop)
      : null,
    permissions.canPerform(role, "filterAssessmentsByTeacher")
      ? queryClient
          .query(userQueries.getUserOptions(TEACHER_OPTIONS_FILTERS, directBackendApi))
          .catch(noop)
      : null,
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AssessmentsView />
    </HydrationBoundary>
  );
}
