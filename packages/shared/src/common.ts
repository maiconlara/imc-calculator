import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Time zone of the gym. Dates on screen and the monthly counts follow it, whatever
 * the time zone of the machine that runs the API or the panel.
 */
export const GYM_TIME_ZONE = "America/Sao_Paulo";

/**
 * Treats empty query string values as absent before validating them.
 *
 * @param schema - Schema applied when the value is present.
 * @returns An optional schema that accepts `""` as `undefined`.
 */
export function optionalParam<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

const INVALID_PAGE_MESSAGE = "A página precisa ser um número inteiro a partir de 1";
const INVALID_PAGE_SIZE_MESSAGE = `O tamanho da página precisa ser um número inteiro de 1 a ${MAX_PAGE_SIZE}`;

export const paginationSchema = z.object({
  page: z.coerce
    .number({ error: INVALID_PAGE_MESSAGE })
    .int(INVALID_PAGE_MESSAGE)
    .min(1, INVALID_PAGE_MESSAGE)
    .default(1),
  pageSize: z.coerce
    .number({ error: INVALID_PAGE_SIZE_MESSAGE })
    .int(INVALID_PAGE_SIZE_MESSAGE)
    .min(1, INVALID_PAGE_SIZE_MESSAGE)
    .max(MAX_PAGE_SIZE, INVALID_PAGE_SIZE_MESSAGE)
    .default(DEFAULT_PAGE_SIZE),
});

export type Pagination = z.output<typeof paginationSchema>;

export const idParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido" }),
});

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  message: string;
  issues?: { path: string; message: string }[];
}
