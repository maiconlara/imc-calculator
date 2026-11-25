import type { ComponentType } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import type { LucideProps } from "lucide-react";

export function HeaderMetric({
  icon: MetricIcon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Flex align="center" gap="1.5" color="whiteAlpha.600">
        <MetricIcon size={14} aria-hidden="true" />
        <Text textStyle="monoLabel">{label}</Text>
      </Flex>
      <Text
        mt="1"
        fontFamily="heading"
        fontWeight="800"
        fontSize={{ base: "lg", md: "2xl" }}
        whiteSpace="nowrap"
      >
        {value}
      </Text>
    </Box>
  );
}
