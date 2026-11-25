"use client";

import { Button, EmptyState, VStack } from "@chakra-ui/react";
import { ServerCrash } from "lucide-react";

/**
 * Error screen of a page that could not be built, with a button that fetches the page
 * again from the server.
 *
 * @param retry - The `retry` function Next.js passes to `error.tsx`.
 */
export function PageLoadError({ retry }: { retry: () => void }) {
  return (
    <EmptyState.Root py="24">
      <EmptyState.Content>
        <EmptyState.Indicator>
          <ServerCrash />
        </EmptyState.Indicator>
        <VStack textAlign="center" gap="1">
          <EmptyState.Title>Não foi possível carregar esta página</EmptyState.Title>
          <EmptyState.Description>
            O servidor não respondeu como esperado. Confira se a API está no ar e tente de
            novo.
          </EmptyState.Description>
        </VStack>
        <Button colorPalette="brand" onClick={() => retry()}>
          Tentar de novo
        </Button>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
