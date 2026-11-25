import { HydrationBoundary, QueryClient, dehydrate, noop } from "@tanstack/react-query";
import { UsersView } from "@/components/views/users-view";
import { INITIAL_USERS_FILTERS } from "@/lib/initial-filters";
import { getDirectBackendApi } from "@/lib/server/session";
import { userQueries } from "@/queries";

export async function UsersContent() {
  const directBackendApi = await getDirectBackendApi();
  const queryClient = new QueryClient();
  await queryClient
    .query(userQueries.getUsers(INITIAL_USERS_FILTERS, directBackendApi))
    .catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersView />
    </HydrationBoundary>
  );
}
