import { Router, type RequestHandler } from "express";
import { requireRole } from "../../shared/http/authentication";
import type { UserController } from "./user.controller";

export function createUsersRouter(dependencies: {
  controller: UserController;
  authenticateRequest: RequestHandler;
}): Router {
  const { controller } = dependencies;
  const requireAdminOrTeacher = requireRole("admin", "teacher");
  const router = Router();

  router.use(dependencies.authenticateRequest);
  router.get("/", requireAdminOrTeacher, controller.listUsers);
  router.get("/options", requireAdminOrTeacher, controller.listUserOptions);
  router.get("/:id", requireAdminOrTeacher, controller.getUser);
  router.post("/", requireAdminOrTeacher, controller.createUser);
  router.put("/:id", requireAdminOrTeacher, controller.updateUser);
  router.patch("/:id/status", requireAdminOrTeacher, controller.changeUserStatus);
  router.delete("/:id", requireRole("admin"), controller.deleteUser);
  return router;
}
