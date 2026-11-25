"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, Flex, Grid, Input, InputGroup, Text } from "@chakra-ui/react";
import {
  BMI_CLASSIFICATION_LABELS,
  createAssessmentSchema,
  heightSchema,
  weightSchema,
  type PublicAssessment,
  type UserOptionsFilters,
} from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { BmiScale } from "@/components/ui/bmi-scale";
import { FormDialog, FormDialogForm } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { PersonSelect } from "@/components/ui/person-select";
import { notify } from "@/components/ui/toaster";
import { useCreateAssessment, useGetUserOptions, useUpdateAssessment } from "@/hooks";
import { getErrorMessage, getFieldErrors } from "@/lib/api-errors";
import { buildBmiPreview } from "@/lib/bmi-preview";
import {
  formatBmi,
  formatNumber,
  maskHeight,
  parseDecimal,
  sanitizeWeight,
} from "@/lib/formatters";

const ACTIVE_STUDENT_OPTIONS_FILTERS: UserOptionsFilters = {
  role: "student",
  status: "active",
};

const assessmentFormSchema = z.object({
  studentId: createAssessmentSchema.shape.studentId,
  height: z.string().transform(parseDecimal).pipe(heightSchema),
  weight: z.string().transform(parseDecimal).pipe(weightSchema),
});

const ASSESSMENT_FORM_FIELD_NAMES = assessmentFormSchema.keyof().options;

interface AssessmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentToEdit: PublicAssessment | null;
}

/**
 * Records an assessment, or fixes the measures of `assessmentToEdit` when given, with
 * the same form.
 */
export function AssessmentFormDialog({
  open,
  onOpenChange,
  assessmentToEdit,
}: AssessmentFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={assessmentToEdit ? "Editar avaliação" : "Nova avaliação"}
      description={
        assessmentToEdit
          ? "Corrija a altura ou o peso. O IMC é calculado de novo."
          : "O IMC e a classificação saem da altura e do peso."
      }
    >
      <AssessmentForm
        assessmentToEdit={assessmentToEdit}
        onSaved={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}

function AssessmentForm({
  assessmentToEdit,
  onSaved,
}: {
  assessmentToEdit: PublicAssessment | null;
  onSaved: () => void;
}) {
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const isSaving = createAssessment.isPending || updateAssessment.isPending;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      studentId: assessmentToEdit?.student.id ?? "",
      height: assessmentToEdit ? formatNumber(assessmentToEdit.height, 2) : "",
      weight: assessmentToEdit ? formatNumber(assessmentToEdit.weight, 2) : "",
    },
  });

  const [typedHeight, typedWeight] = useWatch({ control, name: ["height", "weight"] });
  const bmiPreview = useMemo(
    () => buildBmiPreview(typedHeight, typedWeight),
    [typedHeight, typedWeight],
  );

  function handleSaveError(error: unknown) {
    const fieldErrors = getFieldErrors(error, ASSESSMENT_FORM_FIELD_NAMES);
    if (fieldErrors.length === 0) {
      notify.error(getErrorMessage(error, "Não foi possível salvar a avaliação."));
      return;
    }
    for (const { fieldName, message } of fieldErrors) {
      setError(fieldName, { message });
    }
  }

  const submitAssessment = handleSubmit((formValues) => {
    const saveCallbacks = {
      onSuccess: (savedAssessment: PublicAssessment) => {
        notify.success(
          `Avaliação de ${savedAssessment.student.name} salva: IMC ${formatBmi(savedAssessment.bmi)} (${BMI_CLASSIFICATION_LABELS[savedAssessment.classification]}).`,
        );
        onSaved();
      },
      onError: handleSaveError,
    };
    if (assessmentToEdit) {
      updateAssessment.mutate(
        {
          assessmentId: assessmentToEdit.id,
          measures: { height: formValues.height, weight: formValues.weight },
        },
        saveCallbacks,
      );
      return;
    }
    createAssessment.mutate(formValues, saveCallbacks);
  });

  return (
    <FormDialogForm
      onSubmit={submitAssessment}
      submitLabel={assessmentToEdit ? "Salvar alterações" : "Registrar avaliação"}
      isSubmitting={isSaving}
    >
      {assessmentToEdit ? (
        <Box>
          <Text textStyle="monoLabel" color="fg.muted">
            Aluno
          </Text>
          <Text mt="1" fontWeight="700">
            {assessmentToEdit.student.name}
          </Text>
        </Box>
      ) : (
        <FormField
          label="Aluno"
          errorMessage={errors.studentId?.message}
          helperText="Só aparecem alunos ativos."
          required
        >
          <Controller
            control={control}
            name="studentId"
            render={({ field }) => (
              <ActiveStudentSelect
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.studentId)}
              />
            )}
          />
        </FormField>
      )}

      <Grid templateColumns="1fr 1fr" gap="4">
        <FormField
          label="Altura"
          errorMessage={errors.height?.message}
          helperText="Em metros: 171 vira 1,71."
          required
        >
          <Controller
            control={control}
            name="height"
            render={({ field }) => (
              <InputGroup endElement={<MeasureUnit unit="m" />}>
                <Input
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(maskHeight(event.target.value))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1,75"
                  autoComplete="off"
                />
              </InputGroup>
            )}
          />
        </FormField>
        <FormField
          label="Peso"
          errorMessage={errors.weight?.message}
          helperText="Em quilos, com vírgula."
          required
        >
          <Controller
            control={control}
            name="weight"
            render={({ field }) => (
              <InputGroup endElement={<MeasureUnit unit="kg" />}>
                <Input
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(sanitizeWeight(event.target.value))}
                  inputMode="decimal"
                  placeholder="72,5"
                  autoComplete="off"
                />
              </InputGroup>
            )}
          />
        </FormField>
      </Grid>

      <Box borderRadius="l2" bg="bg.subtle" borderWidth="1px" p="4" aria-live="polite">
        <Flex
          justify="space-between"
          align="center"
          gap="3"
          mb={bmiPreview.kind === "result" ? "2" : "0"}
        >
          <Box>
            <Text textStyle="monoLabel" color="fg.muted">
              IMC calculado
            </Text>
            <Text fontFamily="heading" fontSize="3xl" fontWeight="900" lineHeight="1.1">
              {bmiPreview.kind === "result" ? formatBmi(bmiPreview.bmi) : "--,--"}
            </Text>
          </Box>
          {bmiPreview.kind === "result" ? (
            <ClassificationBadge classification={bmiPreview.classification} size="lg" />
          ) : (
            <Text
              fontSize="xs"
              color={bmiPreview.isOutOfRange ? "red.fg" : "fg.muted"}
              textAlign="end"
              maxW="48"
            >
              {bmiPreview.message}
            </Text>
          )}
        </Flex>
        {bmiPreview.kind === "result" ? <BmiScale bmi={bmiPreview.bmi} /> : null}
      </Box>
    </FormDialogForm>
  );
}

function ActiveStudentSelect({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (studentId: string) => void;
  invalid: boolean;
}) {
  const activeStudentsQuery = useGetUserOptions(ACTIVE_STUDENT_OPTIONS_FILTERS);
  return (
    <PersonSelect
      people={activeStudentsQuery.data ?? []}
      value={value || undefined}
      onChange={(studentId) => onChange(studentId ?? "")}
      placeholder="Digite o nome do aluno"
      emptyMessage="Nenhum aluno ativo cadastrado."
      isLoading={activeStudentsQuery.isPending}
      loadError={activeStudentsQuery.error}
      onRetry={() => void activeStudentsQuery.refetch()}
      invalid={invalid}
      isInsideDialog
    />
  );
}

function MeasureUnit({ unit }: { unit: string }) {
  return (
    <Text color="fg.muted" fontSize="sm">
      {unit}
    </Text>
  );
}
