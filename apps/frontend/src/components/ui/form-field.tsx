import type { ReactNode } from "react";
import { Field } from "@chakra-ui/react";

interface FormFieldProps {
  label: string;
  errorMessage?: string;
  helperText?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  errorMessage,
  helperText,
  required,
  children,
}: FormFieldProps) {
  return (
    <Field.Root invalid={Boolean(errorMessage)} required={required}>
      <Field.Label textStyle="monoLabel" color="fg.muted">
        {label}
        {required ? <Field.RequiredIndicator /> : null}
      </Field.Label>
      {children}
      {errorMessage ? (
        <Field.ErrorText>{errorMessage}</Field.ErrorText>
      ) : helperText ? (
        <Field.HelperText>{helperText}</Field.HelperText>
      ) : null}
    </Field.Root>
  );
}
