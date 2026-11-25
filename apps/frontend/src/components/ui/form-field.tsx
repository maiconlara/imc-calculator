import type { ReactNode } from "react";
import { Field } from "@chakra-ui/react";

interface FormFieldProps {
  label: string;
  errorMessage?: string;
  helperText?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export const FIELD_LABEL_STYLE = {
  fontFamily: "mono",
  fontSize: "2xs",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "wider",
  color: "fg.muted",
} as const;

export function FormField({
  label,
  errorMessage,
  helperText,
  required,
  children,
}: FormFieldProps) {
  return (
    <Field.Root invalid={Boolean(errorMessage)} required={required}>
      <Field.Label {...FIELD_LABEL_STYLE}>
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
