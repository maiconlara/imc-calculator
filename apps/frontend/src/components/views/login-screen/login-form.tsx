"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, IconButton, Input, InputGroup, Stack } from "@chakra-ui/react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@imc-calculator/shared";
import { FormField } from "@/components/ui/form-field";
import { useLogin } from "@/hooks";
import { getErrorMessage } from "@/lib/api-errors";

export interface LoginFormProps {
  redirectPathAfterLogin: string;
  isSessionExpired: boolean;
}

/**
 * Username and password form. A successful login goes to the page the visitor asked
 * for, and an expired session or a refused login shows its message above the fields.
 */
export function LoginForm({ redirectPathAfterLogin, isSessionExpired }: LoginFormProps) {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const submitLogin = handleSubmit((credentials) =>
    login.mutate(credentials, {
      onSuccess: () => {
        router.replace(redirectPathAfterLogin);
        router.refresh();
      },
    }),
  );

  return (
    <form noValidate onSubmit={submitLogin}>
      <Stack gap="4">
        {isSessionExpired && !login.isError ? (
          <Alert.Root status="info" borderRadius="l2">
            <Alert.Indicator />
            <Alert.Title>Sua sessão terminou. Entre de novo para continuar.</Alert.Title>
          </Alert.Root>
        ) : null}
        {login.isError ? (
          <Alert.Root status="error" borderRadius="l2">
            <Alert.Indicator />
            <Alert.Title>{getErrorMessage(login.error)}</Alert.Title>
          </Alert.Root>
        ) : null}

        <FormField label="Usuário" errorMessage={errors.username?.message}>
          <Input
            size="lg"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            placeholder="ex.: pedro.costa"
            {...register("username")}
          />
        </FormField>

        <FormField label="Senha" errorMessage={errors.password?.message}>
          <InputGroup
            endElement={
              <IconButton
                aria-label={isPasswordVisible ? "Esconder senha" : "Mostrar senha"}
                variant="ghost"
                size="sm"
                me="-2"
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              >
                {isPasswordVisible ? <EyeOff /> : <Eye />}
              </IconButton>
            }
          >
            <Input
              size="lg"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              {...register("password")}
            />
          </InputGroup>
        </FormField>

        <Button
          type="submit"
          size="lg"
          colorPalette="brand"
          mt="2"
          loading={login.isPending || login.isSuccess}
          loadingText="Entrando"
        >
          Entrar <ArrowRight />
        </Button>
      </Stack>
    </form>
  );
}
