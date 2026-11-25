import { Box, Flex, Text } from "@chakra-ui/react";
import type { PublicAssessment } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { formatBmi, formatDate } from "@/lib/formatters";

export function LatestAssessmentRow({ assessment }: { assessment: PublicAssessment }) {
  return (
    <Flex py="3" justify="space-between" align="center" gap="3">
      <Box minW="0">
        <Text fontWeight="600" truncate>
          {assessment.student.name}
        </Text>
        <Text fontSize="xs" color="fg.muted" truncate>
          {formatDate(assessment.createdAt)} · por {assessment.assessor.name}
        </Text>
      </Box>
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "end", sm: "center" }}
        gap={{ base: "1", sm: "3" }}
        flexShrink={0}
      >
        <Text fontFamily="heading" fontWeight="800">
          {formatBmi(assessment.bmi)}
        </Text>
        <ClassificationBadge classification={assessment.classification} size="sm" />
      </Flex>
    </Flex>
  );
}
