import { randomUUID } from "node:crypto";
import type { DataSource, SelectQueryBuilder } from "typeorm";
import type { Pagination } from "@imc-calculator/shared";
import type {
  Assessment,
  AssessmentDetails,
  AssessmentMeasures,
  AssessmentScope,
  AssessmentTotals,
  NewAssessment,
} from "../../../modules/assessments/assessment";
import type { AssessmentRepository } from "../../../modules/assessments/assessment.repository";
import { bmiClassificationColumnValues, userStatusColumnValues } from "../column-values";
import { AssessmentSchema, type AssessmentRecord } from "../schemas/assessment.schema";

function toAssessment(assessmentRecord: AssessmentRecord): Assessment {
  return {
    id: assessmentRecord.id,
    height: assessmentRecord.height,
    weight: assessmentRecord.weight,
    bmi: assessmentRecord.bmi,
    classification: assessmentRecord.classification,
    assessorId: assessmentRecord.assessorId,
    studentId: assessmentRecord.studentId,
    createdAt: assessmentRecord.createdAt,
  };
}

function toAssessmentDetails(assessmentRecord: AssessmentRecord): AssessmentDetails {
  const { student, assessor } = assessmentRecord;
  if (!student || !assessor) {
    throw new Error(`Assessment ${assessmentRecord.id} was loaded without its people`);
  }
  return {
    ...toAssessment(assessmentRecord),
    student: { id: student.id, name: student.name },
    assessor: { id: assessor.id, name: assessor.name },
  };
}

export class TypeormAssessmentRepository implements AssessmentRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get assessmentOrmRepository() {
    return this.dataSource.getRepository(AssessmentSchema);
  }

  async create(newAssessment: NewAssessment): Promise<string> {
    const createdAssessmentId = randomUUID();
    await this.assessmentOrmRepository.insert({
      id: createdAssessmentId,
      ...newAssessment,
    });
    return createdAssessmentId;
  }

  async updateMeasures(
    assessmentId: string,
    measures: AssessmentMeasures,
  ): Promise<void> {
    await this.assessmentOrmRepository.update({ id: assessmentId }, measures);
  }

  async delete(assessmentId: string): Promise<void> {
    await this.assessmentOrmRepository.delete({ id: assessmentId });
  }

  async findById(
    assessmentId: string,
    visibleScope: AssessmentScope,
  ): Promise<AssessmentDetails | null> {
    const assessmentRecord = await this.joinStudentAndAssessorNames(
      this.buildScopedQuery(visibleScope),
    )
      .andWhere("a.id = :assessmentId", { assessmentId })
      .getOne();
    return assessmentRecord ? toAssessmentDetails(assessmentRecord) : null;
  }

  async listPaginated(
    visibleScope: AssessmentScope,
    { page, pageSize }: Pagination,
  ): Promise<{ assessments: AssessmentDetails[]; total: number }> {
    const [assessmentRecords, total] = await this.joinStudentAndAssessorNames(
      this.buildScopedQuery(visibleScope),
    )
      .orderBy("a.createdAt", "DESC")
      .addOrderBy("a.id", "DESC")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getManyAndCount();
    return { assessments: assessmentRecords.map(toAssessmentDetails), total };
  }

  async calculateTotals(
    visibleScope: AssessmentScope,
    monthStart: Date,
  ): Promise<AssessmentTotals> {
    const allTimeCounts = await this.buildScopedQuery(visibleScope)
      .select("COUNT(a.id)", "total")
      .addSelect(
        "COALESCE(SUM(CASE WHEN a.createdAt >= :monthStart THEN 1 ELSE 0 END), 0)",
        "thisMonth",
      )
      .setParameter("monthStart", monthStart)
      .getRawOne<{ total: number; thisMonth: number }>();

    const latestAssessmentsByClassification = await this.buildScopedQuery(visibleScope)
      .innerJoin("a.student", "activeStudent", "activeStudent.status = :activeStatus", {
        activeStatus: userStatusColumnValues.toColumnValue("active"),
      })
      .andWhere(
        (query) =>
          `NOT EXISTS ${query
            .subQuery()
            .select("1")
            .from(AssessmentSchema, "laterAssessment")
            .where("laterAssessment.studentId = a.studentId")
            .andWhere(
              "(laterAssessment.createdAt > a.createdAt OR (laterAssessment.createdAt = a.createdAt AND laterAssessment.id > a.id))",
            )
            .getQuery()}`,
      )
      .select("a.classification", "classification")
      .addSelect("COUNT(a.id)", "total")
      .addSelect("SUM(a.bmi)", "bmiSum")
      .groupBy("a.classification")
      .getRawMany<{ classification: string; total: number; bmiSum: number }>();

    return {
      totalAssessments: Number(allTimeCounts?.total ?? 0),
      assessmentsThisMonth: Number(allTimeCounts?.thisMonth ?? 0),
      assessedStudents: latestAssessmentsByClassification.reduce(
        (studentCount, classificationRow) =>
          studentCount + Number(classificationRow.total),
        0,
      ),
      currentBmiSum: latestAssessmentsByClassification.reduce(
        (bmiSum, classificationRow) => bmiSum + Number(classificationRow.bmiSum),
        0,
      ),
      distribution: latestAssessmentsByClassification.map((classificationRow) => ({
        classification: bmiClassificationColumnValues.fromColumnValue(
          classificationRow.classification,
        ),
        total: Number(classificationRow.total),
      })),
    };
  }

  async listOldestFirst(visibleScope: AssessmentScope): Promise<Assessment[]> {
    const assessmentRecords = await this.buildScopedQuery(visibleScope)
      .orderBy("a.createdAt", "ASC")
      .addOrderBy("a.id", "ASC")
      .getMany();
    return assessmentRecords.map(toAssessment);
  }

  private buildScopedQuery(
    visibleScope: AssessmentScope,
  ): SelectQueryBuilder<AssessmentRecord> {
    const scopedQuery = this.assessmentOrmRepository.createQueryBuilder("a");
    if (visibleScope.studentId) {
      scopedQuery.andWhere("a.studentId = :studentId", {
        studentId: visibleScope.studentId,
      });
    }
    if (visibleScope.assessorId) {
      scopedQuery.andWhere("a.assessorId = :assessorId", {
        assessorId: visibleScope.assessorId,
      });
    }
    if (visibleScope.classification) {
      scopedQuery.andWhere("a.classification = :classification", {
        classification: bmiClassificationColumnValues.toColumnValue(
          visibleScope.classification,
        ),
      });
    }
    if (visibleScope.responsibleTeacherId) {
      scopedQuery.andWhere(
        (query) =>
          `a.studentId IN ${query
            .subQuery()
            .select("teacherAssessment.studentId")
            .from(AssessmentSchema, "teacherAssessment")
            .where("teacherAssessment.assessorId = :responsibleTeacherId")
            .getQuery()}`,
        { responsibleTeacherId: visibleScope.responsibleTeacherId },
      );
    }
    return scopedQuery;
  }

  private joinStudentAndAssessorNames(
    scopedQuery: SelectQueryBuilder<AssessmentRecord>,
  ): SelectQueryBuilder<AssessmentRecord> {
    return scopedQuery
      .innerJoin("a.student", "student")
      .innerJoin("a.assessor", "assessor")
      .addSelect(["student.id", "student.name", "assessor.id", "assessor.name"]);
  }
}
