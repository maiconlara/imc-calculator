import { Suspense } from "react";
import { UsersContent } from "@/components/contents/users-content";
import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ListSkeleton } from "@/components/ui/skeletons";
import { NewUserButton } from "@/components/views/new-user-button";
import { permissions } from "@/lib/permissions";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

export function generateMetadata() {
  return getScreenMetadata("users");
}

export default async function UsersPage() {
  const sessionUser = await requireSessionUser("users");
  const canChooseRole = permissions.canChooseUserRole(sessionUser.role);

  return (
    <>
      <PageHeader
        title={getScreenTitle("users", sessionUser.role)}
        actions={
          permissions.canPerform(sessionUser.role, "manageUsers") ? (
            <NewUserButton />
          ) : null
        }
      />
      <PageContent>
        <Suspense fallback={<ListSkeleton withSearch filters={canChooseRole ? 2 : 1} />}>
          <UsersContent />
        </Suspense>
      </PageContent>
    </>
  );
}
