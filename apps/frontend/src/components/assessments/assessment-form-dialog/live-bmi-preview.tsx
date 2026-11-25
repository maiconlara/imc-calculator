import { Box, Flex, Text } from "@chakra-ui/react";
import { ClassificationBadge } from "@/components/ui/badges";
import { BmiScale } from "@/components/ui/bmi-scale";
import type { BmiPreview } from "@/lib/bmi-preview";
import { formatBmi } from "@/lib/formatters";

/**
 * BMI of the assessment form, updated while the height and the weight are typed, or
 * the hint that explains why it is missing.
 *
 * @param props - Preview built by `buildBmiPreview` from the typed measures.
 */
export function LiveBmiPreview({ bmiPreview }: { bmiPreview: BmiPreview }) {
  return (
    <Box borderRadius="l2" bg="bg.subtle" borderWidth="1px" p="4" aria-live="polite">
      <Flex
        justify="space-between"
        align="center"
        gap="3"
        mb={bmiPreview.kind === "result" ? "2" : "0"}
      >
        <Box>
          <Text textStyle="monoLabel" color="fg.muted">
            IMC calculado
          </Text>
          <Text fontFamily="heading" fontSize="3xl" fontWeight="900" lineHeight="1.1">
            {bmiPreview.kind === "result" ? formatBmi(bmiPreview.bmi) : "--,--"}
          </Text>
        </Box>
        {bmiPreview.kind === "result" ? (
          <ClassificationBadge classification={bmiPreview.classification} size="lg" />
        ) : (
          <Text
            fontSize="xs"
            color={bmiPreview.isOutOfRange ? "red.fg" : "fg.muted"}
            textAlign="end"
            maxW="48"
          >
            {bmiPreview.message}
          </Text>
        )}
      </Flex>
      {bmiPreview.kind === "result" ? <BmiScale bmi={bmiPreview.bmi} /> : null}
    </Box>
  );
}
