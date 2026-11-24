import type { RequestHandler } from "express";
import {
  changeUserStatusSchema,
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userOptionsQuerySchema,
} from "@imc-calculator/shared";
import { getAuthenticatedUser } from "../../shared/http/authentication";
import type { UserService } from "./user.service";

export class UserController {
  constructor(private readonly userService: UserService) {}

  listUsers: RequestHandler = async (req, res) => {
    const listUsersQuery = listUsersQuerySchema.parse(req.query);
    res.json(await this.userService.listUsers(getAuthenticatedUser(req), listUsersQuery));
  };

  listUserOptions: RequestHandler = async (req, res) => {
    const userOptionsQuery = userOptionsQuerySchema.parse(req.query);
    res.json(
      await this.userService.listUserOptions(getAuthenticatedUser(req), userOptionsQuery),
    );
  };

  getUser: RequestHandler = async (req, res) => {
    const { id: userId } = idParamSchema.parse(req.params);
    res.json(await this.userService.getUser(getAuthenticatedUser(req), userId));
  };

  createUser: RequestHandler = async (req, res) => {
    const newUserData = createUserSchema.parse(req.body);
    res
      .status(201)
      .json(await this.userService.createUser(getAuthenticatedUser(req), newUserData));
  };

  updateUser: RequestHandler = async (req, res) => {
    const { id: userId } = idParamSchema.parse(req.params);
    const requestedChanges = updateUserSchema.parse(req.body);
    res.json(
      await this.userService.updateUser(
        getAuthenticatedUser(req),
        userId,
        requestedChanges,
      ),
    );
  };

  changeUserStatus: RequestHandler = async (req, res) => {
    const { id: userId } = idParamSchema.parse(req.params);
    const { status: newStatus } = changeUserStatusSchema.parse(req.body);
    res.json(
      await this.userService.changeUserStatus(
        getAuthenticatedUser(req),
        userId,
        newStatus,
      ),
    );
  };

  deleteUser: RequestHandler = async (req, res) => {
    const { id: userId } = idParamSchema.parse(req.params);
    await this.userService.deleteUser(getAuthenticatedUser(req), userId);
    res.status(204).end();
  };
}
