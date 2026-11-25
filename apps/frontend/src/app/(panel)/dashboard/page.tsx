import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

export function generateMetadata() {
  return getScreenMetadata("dashboard");
}

export default async function DashboardPage() {
  const sessionUser = await requireSessionUser("dashboard");

  return (
    <>
      <PageHeader title={getScreenTitle("dashboard", sessionUser.role)} />
      <PageContent>
        <ScreenPlaceholder />
      </PageContent>
    </>
  );
}
