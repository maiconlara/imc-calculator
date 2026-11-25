import { ClipboardList } from "lucide-react";
import type { Role } from "@imc-calculator/shared";
import type { StateMessageContent } from "@/components/ui/state-message";
import { permissions } from "@/lib/permissions";
import { NewAssessmentButton } from "./new-assessment-button";

/**
 * Content of the "no assessments yet" state, shared by the assessments list and the
 * latest assessments of the dashboard. A role that records assessments gets the button
 * to record the first one.
 *
 * @param role - Role of the signed in user.
 * @returns The icon, texts and action of the empty state.
 */
export function getAssessmentsEmptyState(role: Role): StateMessageContent {
  const canRecordAssessments = permissions.canPerform(role, "recordAssessments");
  return {
    icon: ClipboardList,
    title: "Nenhuma avaliação ainda",
    description: canRecordAssessments
      ? "Registre a primeira avaliação para acompanhar a evolução dos alunos."
      : "Assim que um professor avaliar você, o resultado aparece aqui.",
    action: canRecordAssessments ? <NewAssessmentButton /> : undefined,
  };
}
