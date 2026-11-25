"use client";

import NextLink from "next/link";
import { Button, Stack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { ManagerPanelsGrid } from "@/components/ui/dashboard-grids";
import { Panel } from "@/components/ui/panel";
import { PANEL_ROUTES } from "@/lib/routes";
import { BmiDistributionBlock } from "./bmi-distribution-block";
import { LatestAssessmentsList } from "./latest-assessments-list";
import { SummaryStatCards } from "./summary-stat-cards";

export function ManagerDashboard() {
  return (
    <Stack gap="6">
      <SummaryStatCards />
      <ManagerPanelsGrid>
        <Panel
          title="Classificação atual"
          description="Última avaliação de cada aluno ativo, pela tabela de IMC da OMS."
        >
          <BmiDistributionBlock />
        </Panel>
        <Panel
          title="Últimas avaliações"
          action={
            <Button asChild size="xs" variant="ghost" flexShrink={0}>
              <NextLink href={PANEL_ROUTES.assessments}>
                Ver todas <ArrowRight />
              </NextLink>
            </Button>
          }
        >
          <LatestAssessmentsList />
        </Panel>
      </ManagerPanelsGrid>
    </Stack>
  );
}
