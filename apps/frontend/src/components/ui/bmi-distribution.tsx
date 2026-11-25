import { Box, Circle, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import {
  BMI_CLASSIFICATION_LABELS,
  BMI_RANGES,
  describeBmiRange,
  type ClassificationCount,
} from "@imc-calculator/shared";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";
import { formatNumber } from "@/lib/formatters";

/**
 * One bar per band of the BMI table, in the table order, with how many students are
 * in it and their share of the total.
 *
 * @param distribution - Students per classification, as the summary of the API sends.
 */
export function BmiDistribution({
  distribution,
}: {
  distribution: ClassificationCount[];
}) {
  const studentsByClassification = new Map(
    distribution.map((classificationCount) => [
      classificationCount.classification,
      classificationCount.total,
    ]),
  );
  const totalStudents = distribution.reduce(
    (studentSum, classificationCount) => studentSum + classificationCount.total,
    0,
  );

  return (
    <Stack gap="4">
      {BMI_RANGES.map((bmiRange) => {
        const bandStudents = studentsByClassification.get(bmiRange.classification) ?? 0;
        const bandSharePercent =
          totalStudents > 0 ? (bandStudents / totalStudents) * 100 : 0;
        const bandColor = CLASSIFICATION_VISUALS[bmiRange.classification].color;
        return (
          <Box key={bmiRange.classification}>
            <Flex justify="space-between" align="baseline" gap="3">
              <HStack gap="2" minW="0">
                <Circle size="2.5" flexShrink={0} bg={bandColor} />
                <Text fontSize="sm" fontWeight="600" truncate>
                  {BMI_CLASSIFICATION_LABELS[bmiRange.classification]}
                </Text>
                <Text
                  fontFamily="mono"
                  fontSize="2xs"
                  color="fg.muted"
                  hideBelow="sm"
                  whiteSpace="nowrap"
                >
                  {describeBmiRange(bmiRange)}
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                fontWeight="700"
                whiteSpace="nowrap"
                css={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatNumber(bandStudents, 0)}
                <Text as="span" ml="1.5" fontWeight="500" color="fg.muted">
                  {formatNumber(bandSharePercent, 0)}%
                </Text>
              </Text>
            </Flex>
            <Box
              mt="1.5"
              h="2"
              borderRadius="full"
              bg="bg.muted"
              overflow="hidden"
              aria-hidden="true"
            >
              <Box
                h="full"
                w={`${bandSharePercent}%`}
                borderRadius="full"
                bg={bandColor}
                transition="width 0.4s ease"
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
