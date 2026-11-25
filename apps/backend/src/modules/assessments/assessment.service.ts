import {
  BMI_CLASSIFICATIONS,
  assessBmi,
  roundTo,
  type AssessmentSummary,
  type AssessmentSummaryQuery,
  type CreateAssessmentData,
  type ListAssessmentsQuery,
  type Paginated,
  type PublicAssessment,
  type UpdateAssessmentData,
} from "@imc-calculator/shared";
import { startOfMonth, type Clock } from "../../shared/clock";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "../../shared/errors";
import type { AuthenticatedUser } from "../users/user";
import type { UserRepository } from "../users/user.repository";
import type {
  AssessmentDetails,
  AssessmentMeasures,
  AssessmentScope,
} from "./assessment";
import { toProgressPoint, toPublicAssessment } from "./assessment.mapper";
import type { AssessmentRepository } from "./assessment.repository";

export interface AssessmentServiceDependencies {
  assessmentRepository: AssessmentRepository;
  userRepository: Pick<UserRepository, "findById" | "count">;
  clock: Clock;
}

export class AssessmentService {
  constructor(private readonly dependencies: AssessmentServiceDependencies) {}

  async listAssessments(
    actingUser: AuthenticatedUser,
    listAssessmentsQuery: ListAssessmentsQuery,
  ): Promise<Paginated<PublicAssessment>> {
    const visibleScope = this.buildVisibleScope(actingUser, {
      studentId: listAssessmentsQuery.studentId,
      assessorId: listAssessmentsQuery.assessorId,
      classification: listAssessmentsQuery.classification,
    });
    const { assessments, total } =
      await this.dependencies.assessmentRepository.listPaginated(
        visibleScope,
        listAssessmentsQuery,
      );
    return {
      items: assessments.map(toPublicAssessment),
      total,
      page: listAssessmentsQuery.page,
      pageSize: listAssessmentsQuery.pageSize,
    };
  }

  async getAssessment(
    actingUser: AuthenticatedUser,
    assessmentId: string,
  ): Promise<PublicAssessment> {
    return toPublicAssessment(
      await this.findVisibleAssessmentOrThrow(actingUser, assessmentId),
    );
  }

  async createAssessment(
    actingUser: AuthenticatedUser,
    newAssessmentData: CreateAssessmentData,
  ): Promise<PublicAssessment> {
    this.ensureCanRecordAssessments(actingUser);

    const student = await this.dependencies.userRepository.findById(
      newAssessmentData.studentId,
    );
    if (!student || student.role !== "student") {
      throw new NotFoundError("Aluno não encontrado.");
    }
    if (student.status !== "active") {
      throw new BusinessRuleError("Aluno inativo não pode receber novas avaliações.");
    }

    const createdAssessmentId = await this.dependencies.assessmentRepository.create({
      ...this.calculateMeasures(newAssessmentData.height, newAssessmentData.weight),
      studentId: student.id,
      assessorId: actingUser.id,
      createdAt: this.dependencies.clock(),
    });
    return this.getAssessment(actingUser, createdAssessmentId);
  }

  async updateAssessment(
    actingUser: AuthenticatedUser,
    assessmentId: string,
    newMeasures: UpdateAssessmentData,
  ): Promise<PublicAssessment> {
    this.ensureCanRecordAssessments(actingUser);
    const assessment = await this.findVisibleAssessmentOrThrow(actingUser, assessmentId);
    await this.dependencies.assessmentRepository.updateMeasures(
      assessment.id,
      this.calculateMeasures(newMeasures.height, newMeasures.weight),
    );
    return this.getAssessment(actingUser, assessment.id);
  }

  async deleteAssessment(
    actingUser: AuthenticatedUser,
    assessmentId: string,
  ): Promise<void> {
    if (actingUser.role !== "admin") throw new ForbiddenError();
    const assessment = await this.findVisibleAssessmentOrThrow(actingUser, assessmentId);
    await this.dependencies.assessmentRepository.delete(assessment.id);
  }

  /**
   * Builds the dashboard numbers from the assessments the user may see. With a
   * `studentId`, the numbers cover that student and include their progress.
   *
   * @param actingUser - Signed in user.
   * @param summaryQuery - Optional student to summarize.
   * @returns Counters, current average BMI, classification breakdown and progress.
   */
  async getAssessmentSummary(
    actingUser: AuthenticatedUser,
    summaryQuery: AssessmentSummaryQuery,
  ): Promise<AssessmentSummary> {
    const visibleScope = this.buildVisibleScope(actingUser, {
      studentId: summaryQuery.studentId,
    });
    const [assessmentTotals, activeStudentCount, studentAssessmentsOldestFirst] =
      await Promise.all([
        this.dependencies.assessmentRepository.calculateTotals(
          visibleScope,
          startOfMonth(this.dependencies.clock()),
        ),
        actingUser.role === "student"
          ? Promise.resolve(null)
          : this.dependencies.userRepository.count({ role: "student", status: "active" }),
        visibleScope.studentId
          ? this.dependencies.assessmentRepository.listOldestFirst(visibleScope)
          : Promise.resolve(null),
      ]);

    const totalByClassification = new Map(
      assessmentTotals.distribution.map((classificationCount) => [
        classificationCount.classification,
        classificationCount.total,
      ]),
    );
    return {
      totalAssessments: assessmentTotals.totalAssessments,
      assessmentsThisMonth: assessmentTotals.assessmentsThisMonth,
      assessedStudents: assessmentTotals.assessedStudents,
      activeStudents: activeStudentCount,
      averageBmi:
        assessmentTotals.assessedStudents > 0
          ? roundTo(assessmentTotals.currentBmiSum / assessmentTotals.assessedStudents)
          : null,
      distribution: BMI_CLASSIFICATIONS.map((classification) => ({
        classification,
        total: totalByClassification.get(classification) ?? 0,
      })),
      progress: studentAssessmentsOldestFirst
        ? studentAssessmentsOldestFirst.map(toProgressPoint)
        : null,
    };
  }

  /**
   * Limits the requested filters to what the user may see: a student only their own
   * assessments, a teacher the full history of the students they assessed. A filter
   * the role may not use answers 403 instead of being ignored.
   *
   * @param actingUser - Signed in user.
   * @param requestedFilters - Filters sent by the client.
   * @returns The scope applied to every query.
   */
  private buildVisibleScope(
    actingUser: AuthenticatedUser,
    requestedFilters: AssessmentScope,
  ): AssessmentScope {
    if (actingUser.role === "admin") return requestedFilters;
    if (requestedFilters.assessorId) {
      throw new ForbiddenError("Só o administrador filtra avaliações por professor.");
    }
    if (actingUser.role === "teacher") {
      return { ...requestedFilters, responsibleTeacherId: actingUser.id };
    }
    if (requestedFilters.studentId && requestedFilters.studentId !== actingUser.id) {
      throw new ForbiddenError("Alunos só veem as próprias avaliações.");
    }
    return { ...requestedFilters, studentId: actingUser.id };
  }

  private async findVisibleAssessmentOrThrow(
    actingUser: AuthenticatedUser,
    assessmentId: string,
  ): Promise<AssessmentDetails> {
    const assessment = await this.dependencies.assessmentRepository.findById(
      assessmentId,
      this.buildVisibleScope(actingUser, {}),
    );
    if (!assessment) throw new NotFoundError("Avaliação não encontrada.");
    return assessment;
  }

  private ensureCanRecordAssessments(actingUser: AuthenticatedUser): void {
    if (actingUser.role === "student") throw new ForbiddenError();
  }

  private calculateMeasures(
    typedHeight: number,
    typedWeight: number,
  ): AssessmentMeasures {
    const height = roundTo(typedHeight);
    const weight = roundTo(typedWeight);
    return { height, weight, ...assessBmi(weight, height) };
  }
}
