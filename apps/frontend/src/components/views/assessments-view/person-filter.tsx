import { Box } from "@chakra-ui/react";
import type { UserOptionsFilters } from "@imc-calculator/shared";
import { UserOptionsSelect } from "@/components/assessments";
import { FormField } from "@/components/ui/form-field";

interface PersonFilterProps {
  label: string;
  /** Width from the `md` breakpoint up; below it the filter takes the whole row. */
  mdWidth: string;
  userOptionsFilters: UserOptionsFilters;
  value: string | undefined;
  onChange: (personId: string | undefined) => void;
  placeholder: string;
  emptyMessage: string;
}

/**
 * Filter of the assessments list by one person, such as the student or the teacher.
 *
 * @param props - Label and width of the filter, the people it lists and the chosen one.
 */
export function PersonFilter({
  label,
  mdWidth,
  userOptionsFilters,
  value,
  onChange,
  placeholder,
  emptyMessage,
}: PersonFilterProps) {
  return (
    <Box w={{ base: "full", md: mdWidth }}>
      <FormField label={label}>
        <UserOptionsSelect
          userOptionsFilters={userOptionsFilters}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          emptyMessage={emptyMessage}
          size="sm"
        />
      </FormField>
    </Box>
  );
}
