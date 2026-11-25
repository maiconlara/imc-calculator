"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  IconButton,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { BMI_RANGES, loginSchema } from "@imc-calculator/shared";
import { Logo } from "@/components/layout/logo";
import { FormField } from "@/components/ui/form-field";
import { useLogin } from "@/hooks";
import { getErrorMessage } from "@/lib/api-errors";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";

interface LoginScreenProps {
  redirectPathAfterLogin: string;
  isSessionExpired: boolean;
}

export function LoginScreen({
  redirectPathAfterLogin,
  isSessionExpired,
}: LoginScreenProps) {
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
    <Grid minH="100dvh" templateColumns={{ base: "1fr", lg: "1.1fr 1fr" }}>
      <Flex
        hideBelow="lg"
        direction="column"
        justify="space-between"
        bg="graphite.900"
        color="white"
        px="14"
        py="12"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          right="-28"
          top="-28"
          boxSize="96"
          borderRadius="full"
          borderWidth="56px"
          borderColor="brand.solid"
          opacity="0.12"
          aria-hidden="true"
        />
        <Logo background="dark" size={42} />

        <Box position="relative">
          <Heading
            as="p"
            fontFamily="heading"
            fontWeight="900"
            textTransform="uppercase"
            lineHeight="0.88"
            letterSpacing="tight"
            fontSize={{ lg: "6xl", xl: "7xl" }}
          >
            Treino medido.
            <br />
            <Text as="span" color="brand.solid">
              Evolução
            </Text>
            <br />
            visível.
          </Heading>
          <Text mt="6" maxW="md" fontSize="lg" color="whiteAlpha.800">
            Registre as avaliações de IMC dos alunos e acompanhe a evolução de cada um,
            mês a mês.
          </Text>
        </Box>

        <Box>
          <Text
            fontFamily="mono"
            fontSize="2xs"
            textTransform="uppercase"
            letterSpacing="0.18em"
            color="whiteAlpha.600"
            mb="3"
          >
            Tabela de IMC da OMS
          </Text>
          <Flex gap="1" h="2.5" borderRadius="full" overflow="hidden" maxW="md">
            {BMI_RANGES.map((bmiRange) => (
              <Box
                key={bmiRange.classification}
                flex="1"
                bg={CLASSIFICATION_VISUALS[bmiRange.classification].color}
              />
            ))}
          </Flex>
        </Box>
      </Flex>

      <Flex align="center" justify="center" px="6" py="12" bg="bg.panel">
        <Box w="full" maxW="sm">
          <Box hideFrom="lg" mb="10">
            <Logo size={40} />
          </Box>
          <Heading
            as="h1"
            fontSize="3xl"
            fontWeight="900"
            textTransform="uppercase"
            letterSpacing="tight"
          >
            Entrar
          </Heading>
          <Text mt="2" mb="8" color="fg.muted">
            Use o usuário e a senha que a academia cadastrou para você.
          </Text>

          <form noValidate onSubmit={submitLogin}>
            <Stack gap="4">
              {isSessionExpired && !login.isError ? (
                <Alert.Root status="info" borderRadius="l2">
                  <Alert.Indicator />
                  <Alert.Title>
                    Sua sessão terminou. Entre de novo para continuar.
                  </Alert.Title>
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
        </Box>
      </Flex>
    </Grid>
  );
}
