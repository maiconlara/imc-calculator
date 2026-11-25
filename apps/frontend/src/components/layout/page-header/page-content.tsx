import type { ReactNode } from "react";
import { Box } from "@chakra-ui/react";

export function PageContent({ children }: { children: ReactNode }) {
  return (
    <Box px={{ base: "4", lg: "8" }} py={{ base: "5", lg: "8" }}>
      {children}
    </Box>
  );
}
