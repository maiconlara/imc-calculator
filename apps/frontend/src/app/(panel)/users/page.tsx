import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

export function generateMetadata() {
  return getScreenMetadata("users");
}

export default async function UsersPage() {
  const sessionUser = await requireSessionUser("users");

  return (
    <>
      <PageHeader title={getScreenTitle("users", sessionUser.role)} />
      <PageContent>
        <ScreenPlaceholder />
      </PageContent>
    </>
  );
}
