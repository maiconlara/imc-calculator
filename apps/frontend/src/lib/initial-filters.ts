import type {
  ListAssessmentsFilters,
  ListUsersFilters,
  UserOptionsFilters,
} from "@imc-calculator/shared";

export const INITIAL_USERS_FILTERS = {
  page: 1,
  pageSize: 10,
} as const satisfies ListUsersFilters;

export const INITIAL_ASSESSMENTS_FILTERS = {
  page: 1,
  pageSize: 10,
} as const satisfies ListAssessmentsFilters;

export const ASSESSED_STUDENT_OPTIONS_FILTERS: UserOptionsFilters = {
  role: "student",
  onlyAssessed: true,
};

export const TEACHER_OPTIONS_FILTERS: UserOptionsFilters = { role: "teacher" };
