import { EmptyState, VStack } from "@chakra-ui/react";
import { Construction } from "lucide-react";

export function ScreenPlaceholder() {
  return (
    <EmptyState.Root py="16">
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Construction />
        </EmptyState.Indicator>
        <VStack textAlign="center" gap="1">
          <EmptyState.Title>Tela em construção</EmptyState.Title>
          <EmptyState.Description>
            Esta parte do painel chega nas próximas versões.
          </EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
