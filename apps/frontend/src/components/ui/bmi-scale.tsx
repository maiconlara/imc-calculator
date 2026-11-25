import { Box, Flex, Text } from "@chakra-ui/react";
import { BMI_CLASSIFICATION_LABELS, BMI_RANGES } from "@imc-calculator/shared";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";
import { formatBmi } from "@/lib/formatters";

const SCALE_MIN_BMI = 15;
const SCALE_MAX_BMI = 45;
const SCALE_BMI_SPAN = SCALE_MAX_BMI - SCALE_MIN_BMI;

function getScalePositionPercent(bmi: number): number {
  const bmiInsideScale = Math.min(SCALE_MAX_BMI, Math.max(SCALE_MIN_BMI, bmi));
  return ((bmiInsideScale - SCALE_MIN_BMI) / SCALE_BMI_SPAN) * 100;
}

const SCALE_SEGMENTS = BMI_RANGES.map((bmiRange) => {
  const segmentStart = bmiRange.min ?? SCALE_MIN_BMI;
  const segmentEnd = bmiRange.max ?? SCALE_MAX_BMI;
  return {
    ...bmiRange,
    widthPercent: ((segmentEnd - segmentStart) / SCALE_BMI_SPAN) * 100,
  };
});

const SCALE_TICK_VALUES = BMI_RANGES.flatMap((bmiRange) =>
  bmiRange.min === null ? [] : [bmiRange.min],
);

/**
 * Horizontal BMI ruler with the WHO bands and a marker on the given value.
 */
export function BmiScale({ bmi }: { bmi?: number | null }) {
  return (
    <Box
      position="relative"
      pt={bmi ? "9" : "0"}
      pb="5"
      role="img"
      aria-label={
        bmi
          ? `IMC ${formatBmi(bmi)} na tabela de classificação`
          : "Tabela de classificação do IMC"
      }
    >
      {bmi ? (
        <Flex
          position="absolute"
          top="0"
          left={`${getScalePositionPercent(bmi)}%`}
          transform="translateX(-50%)"
          direction="column"
          align="center"
          zIndex="1"
        >
          <Text
            px="2"
            py="0.5"
            borderRadius="md"
            bg="graphite.900"
            color="brand.solid"
            fontFamily="heading"
            fontWeight="800"
            fontSize="sm"
            lineHeight="1.3"
            whiteSpace="nowrap"
          >
            {formatBmi(bmi)}
          </Text>
          <Box
            w="0"
            h="0"
            borderLeft="6px solid transparent"
            borderRight="6px solid transparent"
            borderTop="7px solid"
            borderTopColor="graphite.900"
          />
        </Flex>
      ) : null}

      <Flex h="3.5" gap="2px" borderRadius="full" overflow="hidden">
        {SCALE_SEGMENTS.map((scaleSegment) => (
          <Box
            key={scaleSegment.classification}
            flex={`${scaleSegment.widthPercent} 0 0`}
            bg={CLASSIFICATION_VISUALS[scaleSegment.classification].color}
            title={BMI_CLASSIFICATION_LABELS[scaleSegment.classification]}
          />
        ))}
      </Flex>

      <Box position="relative" mt="1.5" h="4">
        {SCALE_TICK_VALUES.map((tickValue) => (
          <Text
            key={tickValue}
            position="absolute"
            left={`${getScalePositionPercent(tickValue)}%`}
            transform="translateX(-50%)"
            fontFamily="mono"
            fontSize="2xs"
            color="fg.muted"
          >
            {tickValue.toLocaleString("pt-BR")}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
