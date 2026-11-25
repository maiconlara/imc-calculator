import { HydrationBoundary, QueryClient, dehydrate, noop } from "@tanstack/react-query";
import type { Role } from "@imc-calculator/shared";
import { DashboardView } from "@/components/views/dashboard-view";
import { LATEST_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { getDirectBackendApi } from "@/lib/server/session";
import { assessmentQueries } from "@/queries";

export async function DashboardContent({ role }: { role: Role }) {
  const directBackendApi = await getDirectBackendApi();
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient
      .query(assessmentQueries.getAssessmentSummary(undefined, directBackendApi))
      .catch(noop),
    permissions.canPerform(role, "seeGymNumbers")
      ? queryClient
          .query(
            assessmentQueries.getAssessments(
              LATEST_ASSESSMENTS_FILTERS,
              directBackendApi,
            ),
          )
          .catch(noop)
      : null,
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
