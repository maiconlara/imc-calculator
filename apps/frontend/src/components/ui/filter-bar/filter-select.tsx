"use client";

import { Box, NativeSelect } from "@chakra-ui/react";
import { FormField } from "@/components/ui/form-field";

export interface FilterOption<Value extends string> {
  value: Value;
  label: string;
}

interface FilterSelectProps<Value extends string> {
  label: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  options: readonly FilterOption<Value>[];
  allOptionLabel?: string;
}

/**
 * Select of a fixed list filter. The empty option means no filter, and the chosen
 * value comes back with the type of the options.
 */
export function FilterSelect<Value extends string>({
  label,
  value,
  onChange,
  options,
  allOptionLabel = "Todos",
}: FilterSelectProps<Value>) {
  return (
    <Box w={{ base: "full", md: "52" }}>
      <FormField label={label}>
        <NativeSelect.Root size="sm" bg="bg.panel">
          <NativeSelect.Field
            value={value ?? ""}
            onChange={(event) =>
              onChange(
                options.find((option) => option.value === event.target.value)?.value,
              )
            }
          >
            <option value="">{allOptionLabel}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </FormField>
    </Box>
  );
}
