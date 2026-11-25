"use client";

import { Box, Flex, Grid, Heading, Text } from "@chakra-ui/react";
import { Logo } from "@/components/layout/logo";
import { LoginBrandPanel } from "./login-brand-panel";
import { LoginForm, type LoginFormProps } from "./login-form";

export function LoginScreen({
  redirectPathAfterLogin,
  isSessionExpired,
}: LoginFormProps) {
  return (
    <Grid minH="100dvh" templateColumns={{ base: "1fr", lg: "1.1fr 1fr" }}>
      <LoginBrandPanel />

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

          <LoginForm
            redirectPathAfterLogin={redirectPathAfterLogin}
            isSessionExpired={isSessionExpired}
          />
        </Box>
      </Flex>
    </Grid>
  );
}
