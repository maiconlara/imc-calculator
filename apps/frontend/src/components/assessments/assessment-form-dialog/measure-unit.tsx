import { Text } from "@chakra-ui/react";

export function MeasureUnit({ unit }: { unit: string }) {
  return (
    <Text color="fg.muted" fontSize="sm">
      {unit}
    </Text>
  );
}
