"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { CalendarCheck, Ruler, Scale } from "lucide-react";
import type { ProgressPoint } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { useSessionUser } from "@/hooks";
import {
  formatBmi,
  formatDate,
  formatHeight,
  formatNumber,
  formatWeight,
  getFirstName,
} from "@/lib/formatters";
import { HeaderMetric } from "./header-metric";

export function CurrentBmiHeader({
  latestProgressPoint,
  assessmentCount,
}: {
  latestProgressPoint: ProgressPoint;
  assessmentCount: number;
}) {
  const sessionUser = useSessionUser();

  return (
    <Box
      bg="graphite.900"
      color="white"
      borderRadius="l3"
      px={{ base: "6", md: "8" }}
      py={{ base: "6", md: "8" }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        right="-16"
        bottom="-24"
        boxSize="72"
        borderRadius="full"
        borderWidth="40px"
        borderColor="brand.solid"
        opacity="0.1"
        aria-hidden="true"
      />
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap="6"
        position="relative"
      >
        <Box minW="0">
          <Text textStyle="monoLabel" color="whiteAlpha.600">
            {getFirstName(sessionUser.name)}, seu IMC atual
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="900"
            fontSize={{ base: "6xl", md: "7xl" }}
            lineHeight="1"
            color="brand.solid"
            mt="2"
          >
            {formatBmi(latestProgressPoint.bmi)}
          </Text>
          <Flex mt="3" gap="3" align="center" wrap="wrap">
            <ClassificationBadge
              classification={latestProgressPoint.classification}
              size="lg"
            />
            <Text fontSize="sm" color="whiteAlpha.700">
              Avaliado em {formatDate(latestProgressPoint.createdAt)}
            </Text>
          </Flex>
        </Box>
        <Flex
          wrap="wrap"
          columnGap={{ base: "6", md: "10" }}
          rowGap="4"
          alignSelf={{ md: "end" }}
        >
          <HeaderMetric
            icon={Scale}
            label="Peso"
            value={formatWeight(latestProgressPoint.weight)}
          />
          <HeaderMetric
            icon={Ruler}
            label="Altura"
            value={formatHeight(latestProgressPoint.height)}
          />
          <HeaderMetric
            icon={CalendarCheck}
            label="Avaliações"
            value={formatNumber(assessmentCount, 0)}
          />
        </Flex>
      </Flex>
    </Box>
  );
}
