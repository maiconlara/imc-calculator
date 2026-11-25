import { Box, Text } from "@chakra-ui/react";
import { ClassificationBadge } from "@/components/ui/badges";
import { ListCard } from "@/components/ui/list-card";
import { formatBmi, formatDateTime, formatHeight, formatWeight } from "@/lib/formatters";
import { AssessmentRowActions } from "./assessment-row-actions";
import type { AssessmentRowProps } from "./assessments-view.types";

/**
 * Card that replaces an assessment row on phones.
 *
 * @param props - The assessment of the row and the handlers and permissions of the list.
 */
export function AssessmentCard({ assessment, rowContext }: AssessmentRowProps) {
  const assessedAt = formatDateTime(assessment.createdAt);
  return (
    <ListCard
      summaryAlign="start"
      summary={
        <>
          <Box minW="0">
            <Text fontWeight="700" truncate>
              {rowContext.seesSeveralStudents ? assessment.student.name : assessedAt}
            </Text>
            <Text fontSize="xs" color="fg.muted" truncate>
              {rowContext.seesSeveralStudents ? `${assessedAt} · ` : ""}
              por {assessment.assessor.name}
            </Text>
          </Box>
          <Box flexShrink={0} textAlign="end">
            <Text fontFamily="heading" fontWeight="900" fontSize="2xl" lineHeight="1">
              {formatBmi(assessment.bmi)}
            </Text>
            <Text mt="1" fontSize="xs" color="fg.muted" whiteSpace="nowrap">
              {formatHeight(assessment.height)} · {formatWeight(assessment.weight)}
            </Text>
          </Box>
        </>
      }
      footer={
        <>
          <ClassificationBadge classification={assessment.classification} />
          <AssessmentRowActions assessment={assessment} rowContext={rowContext} />
        </>
      }
    />
  );
}
