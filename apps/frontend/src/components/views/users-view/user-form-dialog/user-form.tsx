"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, NativeSelect } from "@chakra-ui/react";
import {
  PASSWORD_MIN_LENGTH,
  ROLE_LABELS,
  createUserSchema,
  optionalNewPasswordSchema,
  type PublicUser,
} from "@imc-calculator/shared";
import { FormDialogForm } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { notify } from "@/components/ui/toaster";
import { useCreateUser, useSessionUser, useUpdateUser } from "@/hooks";
import { getErrorMessage, getErrorStatus, getFieldErrors } from "@/lib/api-errors";
import { ROLE_DESCRIPTIONS, permissions } from "@/lib/permissions";

const newUserFormSchema = createUserSchema.pick({
  name: true,
  username: true,
  role: true,
  password: true,
});

const editUserFormSchema = newUserFormSchema.extend({
  password: optionalNewPasswordSchema.transform((newPassword) => newPassword ?? ""),
});

const USER_FORM_FIELD_NAMES = newUserFormSchema.keyof().options;

interface UserFormProps {
  userToEdit: PublicUser | null;
  onSaved: () => void;
}

/**
 * Fields of the user dialog. Creates a user, or edits `userToEdit` when given.
 */
export function UserForm({ userToEdit, onSaved }: UserFormProps) {
  const sessionUser = useSessionUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSaving = createUser.isPending || updateUser.isPending;
  const canChooseRole = permissions.canChooseUserRole(sessionUser.role);
  const roleLockedReason =
    userToEdit?.id === sessionUser.id
      ? "Você não pode mudar o próprio perfil."
      : userToEdit?.hasAssessments
        ? "Tem avaliações vinculadas, então o perfil não pode mudar. Inative o cadastro se a pessoa saiu."
        : undefined;
  const selectableRoles =
    roleLockedReason && userToEdit
      ? [userToEdit.role]
      : permissions.getManageableRoles(sessionUser.role);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userToEdit ? editUserFormSchema : newUserFormSchema),
    defaultValues: {
      name: userToEdit?.name ?? "",
      username: userToEdit?.username ?? "",
      role: userToEdit?.role ?? "student",
      password: "",
    },
  });
  const selectedRole = useWatch({ control, name: "role" });

  function handleSaveError(error: unknown) {
    if (getErrorStatus(error) === 409) {
      setError("username", { message: getErrorMessage(error) });
      return;
    }
    const fieldErrors = getFieldErrors(error, USER_FORM_FIELD_NAMES);
    if (fieldErrors.length === 0) {
      notify.error(getErrorMessage(error, "Não foi possível salvar o cadastro."));
      return;
    }
    for (const { fieldName, message } of fieldErrors) {
      setError(fieldName, { message });
    }
  }

  const submitUser = handleSubmit((formValues) => {
    const saveCallbacks = {
      onSuccess: (savedUser: PublicUser) => {
        notify.success(
          userToEdit
            ? `Cadastro de ${savedUser.name} atualizado.`
            : `${savedUser.name} cadastrado.`,
        );
        onSaved();
      },
      onError: handleSaveError,
    };
    if (userToEdit) {
      updateUser.mutate(
        { userId: userToEdit.id, userChanges: formValues },
        saveCallbacks,
      );
      return;
    }
    createUser.mutate(formValues, saveCallbacks);
  });

  return (
    <FormDialogForm onSubmit={submitUser} submitLabel="Salvar" isSubmitting={isSaving}>
      <FormField label="Nome" errorMessage={errors.name?.message} required>
        <Input
          placeholder="Nome completo"
          autoComplete="off"
          autoFocus
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Usuário"
        errorMessage={errors.username?.message}
        helperText="Usado no login. Letras minúsculas, números, ponto, hífen ou sublinhado."
        required
      >
        <Input
          placeholder="ex.: maria.silva"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          {...register("username")}
        />
      </FormField>

      {canChooseRole ? (
        <FormField
          label="Perfil"
          errorMessage={errors.role?.message}
          helperText={roleLockedReason ?? ROLE_DESCRIPTIONS[selectedRole]}
          required
        >
          <NativeSelect.Root>
            <NativeSelect.Field {...register("role")}>
              {selectableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </FormField>
      ) : null}

      <FormField
        label={userToEdit ? "Nova senha" : "Senha"}
        errorMessage={errors.password?.message}
        helperText={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        required={!userToEdit}
      >
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={userToEdit ? "Deixe em branco para manter" : "Senha inicial"}
          {...register("password")}
        />
      </FormField>
    </FormDialogForm>
  );
}
