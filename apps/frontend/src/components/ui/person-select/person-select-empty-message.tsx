"use client";

import { Button, Text, VStack } from "@chakra-ui/react";
import { RotateCw } from "lucide-react";

export function PersonSelectEmptyMessage({
  isLoading,
  loadError,
  onRetry,
  emptyMessage,
}: {
  isLoading: boolean;
  loadError: Error | null;
  onRetry: () => void;
  emptyMessage: string;
}) {
  if (isLoading) return <Text>Carregando…</Text>;
  if (loadError) {
    return (
      <VStack align="start" gap="2">
        <Text>Não foi possível carregar a lista.</Text>
        <Button size="xs" variant="outline" onClick={onRetry}>
          <RotateCw /> Tentar de novo
        </Button>
      </VStack>
    );
  }
  return <Text>{emptyMessage}</Text>;
}
