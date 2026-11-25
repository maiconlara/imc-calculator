import type { ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireSessionUser } from "@/lib/server/session";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const sessionUser = await requireSessionUser();

  return (
    <Box minH="100dvh" bg="bg.canvas">
      <AppSidebar sessionUser={sessionUser} />
      <Box as="main" pl={{ base: "0", lg: "72px" }}>
        {children}
      </Box>
    </Box>
  );
}
