/**
 * Builds the initials shown in the avatar: the first letter of the first and of the
 * last word of the name.
 *
 * @param name - Full name.
 * @returns One or two uppercase letters.
 */
export function getInitials(name: string): string {
  const nameParts = name.trim().split(/\s+/);
  const firstInitial = nameParts[0]?.charAt(0) ?? "";
  const lastInitial = nameParts.length > 1 ? (nameParts.at(-1)?.charAt(0) ?? "") : "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}
