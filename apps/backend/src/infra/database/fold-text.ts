export const FOLD_TEXT_SQL_FUNCTION = "fold_text";

interface SqliteFunctionRegistry {
  function(
    name: string,
    options: { deterministic: boolean },
    implementation: (value: unknown) => unknown,
  ): unknown;
}

/**
 * Lowercases a text and removes its accents, so "joao" matches "João" and "Érica"
 * sorts next to "Erica".
 *
 * @param text - Text to fold.
 * @returns The folded text.
 */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}

/**
 * Makes `foldText` available to SQL as `fold_text(...)`, since SQLite's `LOWER` only
 * handles ASCII letters.
 *
 * @param database - The better-sqlite3 connection opened by TypeORM.
 */
export function registerFoldTextFunction(database: SqliteFunctionRegistry): void {
  database.function(FOLD_TEXT_SQL_FUNCTION, { deterministic: true }, (value) =>
    typeof value === "string" ? foldText(value) : value,
  );
}
