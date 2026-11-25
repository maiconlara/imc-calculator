import { PageContent, PageHeader } from "@/components/layout/page-header";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";
import { getScreenTitle } from "@/lib/screen-titles";
import { getScreenMetadata, requireSessionUser } from "@/lib/server/session";

export function generateMetadata() {
  return getScreenMetadata("assessments");
}

export default async function AssessmentsPage() {
  const sessionUser = await requireSessionUser("assessments");

  return (
    <>
      <PageHeader title={getScreenTitle("assessments", sessionUser.role)} />
      <PageContent>
        <ScreenPlaceholder />
      </PageContent>
    </>
  );
}
