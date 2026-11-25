import { Box, Flex, Text } from "@chakra-ui/react";
import { BMI_CLASSIFICATION_LABELS } from "@imc-calculator/shared";
import {
  BMI_SCALE_SEGMENTS,
  BMI_SCALE_TICK_VALUES,
  getBmiScalePositionPercent,
} from "@/lib/bmi-scale";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";
import { formatBmi } from "@/lib/formatters";

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
          left={`${getBmiScalePositionPercent(bmi)}%`}
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
        {BMI_SCALE_SEGMENTS.map((scaleSegment) => (
          <Box
            key={scaleSegment.classification}
            flex={`${scaleSegment.widthPercent} 0 0`}
            bg={CLASSIFICATION_VISUALS[scaleSegment.classification].color}
            title={BMI_CLASSIFICATION_LABELS[scaleSegment.classification]}
          />
        ))}
      </Flex>

      <Box position="relative" mt="1.5" h="4">
        {BMI_SCALE_TICK_VALUES.map((tickValue) => (
          <Text
            key={tickValue}
            position="absolute"
            left={`${getBmiScalePositionPercent(tickValue)}%`}
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
