import type {
  CreateUserInput,
  ListUsersFilters,
  Paginated,
  PublicUser,
  UpdateUserInput,
  UserOption,
  UserOptionsFilters,
  UserStatus,
} from "@imc-calculator/shared";
import { proxiedBackendApi, type RequestOptions } from "./api";

export async function getUsers(
  filters: ListUsersFilters,
  options: RequestOptions = {},
): Promise<Paginated<PublicUser>> {
  const { data: usersPage } = await (options.directBackendApi ?? proxiedBackendApi).get<
    Paginated<PublicUser>
  >("/users", { params: filters, signal: options.signal });
  return usersPage;
}

export async function getUserOptions(
  filters: UserOptionsFilters,
  options: RequestOptions = {},
): Promise<UserOption[]> {
  const { data: userOptions } = await (options.directBackendApi ?? proxiedBackendApi).get<
    UserOption[]
  >("/users/options", { params: filters, signal: options.signal });
  return userOptions;
}

export async function createUser(newUser: CreateUserInput): Promise<PublicUser> {
  const { data: createdUser } = await proxiedBackendApi.post<PublicUser>(
    "/users",
    newUser,
  );
  return createdUser;
}

export async function updateUser(
  userId: string,
  userChanges: UpdateUserInput,
): Promise<PublicUser> {
  const { data: updatedUser } = await proxiedBackendApi.put<PublicUser>(
    `/users/${userId}`,
    userChanges,
  );
  return updatedUser;
}

export async function changeUserStatus(
  userId: string,
  status: UserStatus,
): Promise<PublicUser> {
  const { data: updatedUser } = await proxiedBackendApi.patch<PublicUser>(
    `/users/${userId}/status`,
    { status },
  );
  return updatedUser;
}

export async function deleteUser(userId: string): Promise<void> {
  await proxiedBackendApi.delete(`/users/${userId}`);
}
