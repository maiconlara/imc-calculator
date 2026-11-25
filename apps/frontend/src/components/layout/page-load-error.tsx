"use client";

import { Button } from "@chakra-ui/react";
import { ServerCrash } from "lucide-react";
import { StateMessage } from "@/components/ui/state-message";

/**
 * Error screen of a page that could not be built, with a button that fetches the page
 * again from the server.
 *
 * @param retry - The `retry` function Next.js passes to `error.tsx`.
 */
export function PageLoadError({ retry }: { retry: () => void }) {
  return (
    <StateMessage
      icon={ServerCrash}
      title="Não foi possível carregar esta página"
      description="O servidor não respondeu como esperado. Confira se a API está no ar e tente de novo."
      isFullPage
      action={
        <Button colorPalette="brand" onClick={() => retry()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
