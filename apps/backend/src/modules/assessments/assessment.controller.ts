import type { RequestHandler } from "express";
import {
  assessmentSummaryQuerySchema,
  createAssessmentSchema,
  idParamSchema,
  listAssessmentsQuerySchema,
  updateAssessmentSchema,
} from "@imc-calculator/shared";
import { getAuthenticatedUser } from "../../shared/http/authentication";
import type { AssessmentService } from "./assessment.service";

export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  listAssessments: RequestHandler = async (req, res) => {
    const listAssessmentsQuery = listAssessmentsQuerySchema.parse(req.query);
    res.json(
      await this.assessmentService.listAssessments(
        getAuthenticatedUser(req),
        listAssessmentsQuery,
      ),
    );
  };

  getAssessmentSummary: RequestHandler = async (req, res) => {
    const summaryQuery = assessmentSummaryQuerySchema.parse(req.query);
    res.json(
      await this.assessmentService.getAssessmentSummary(
        getAuthenticatedUser(req),
        summaryQuery,
      ),
    );
  };

  getAssessment: RequestHandler = async (req, res) => {
    const { id: assessmentId } = idParamSchema.parse(req.params);
    res.json(
      await this.assessmentService.getAssessment(getAuthenticatedUser(req), assessmentId),
    );
  };

  createAssessment: RequestHandler = async (req, res) => {
    const newAssessmentData = createAssessmentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await this.assessmentService.createAssessment(
          getAuthenticatedUser(req),
          newAssessmentData,
        ),
      );
  };

  updateAssessment: RequestHandler = async (req, res) => {
    const { id: assessmentId } = idParamSchema.parse(req.params);
    const newMeasures = updateAssessmentSchema.parse(req.body);
    res.json(
      await this.assessmentService.updateAssessment(
        getAuthenticatedUser(req),
        assessmentId,
        newMeasures,
      ),
    );
  };

  deleteAssessment: RequestHandler = async (req, res) => {
    const { id: assessmentId } = idParamSchema.parse(req.params);
    await this.assessmentService.deleteAssessment(
      getAuthenticatedUser(req),
      assessmentId,
    );
    res.status(204).end();
  };
}
