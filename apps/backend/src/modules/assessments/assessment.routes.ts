import { Router, type RequestHandler } from "express";
import { requireRole } from "../../shared/http/authentication";
import type { AssessmentController } from "./assessment.controller";

export function createAssessmentsRouter(dependencies: {
  controller: AssessmentController;
  authenticateRequest: RequestHandler;
}): Router {
  const { controller } = dependencies;
  const requireAdminOrTeacher = requireRole("admin", "teacher");
  const router = Router();

  router.use(dependencies.authenticateRequest);
  router.get("/", controller.listAssessments);
  router.get("/summary", controller.getAssessmentSummary);
  router.get("/:id", controller.getAssessment);
  router.post("/", requireAdminOrTeacher, controller.createAssessment);
  router.put("/:id", requireAdminOrTeacher, controller.updateAssessment);
  router.delete("/:id", requireRole("admin"), controller.deleteAssessment);
  return router;
}
