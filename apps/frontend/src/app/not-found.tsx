import NextLink from "next/link";
import { Button, Center, Heading, Stack, Text } from "@chakra-ui/react";
import { LogoIcon } from "@/components/layout/logo";
import { HOME_ROUTE } from "@/lib/routes";

export default function NotFound() {
  return (
    <Center minH="100dvh" px="6">
      <Stack align="center" textAlign="center" gap="4" maxW="sm">
        <LogoIcon size={56} />
        <Heading fontSize="5xl" fontWeight="900">
          404
        </Heading>
        <Text color="fg.muted">Essa página não existe ou mudou de endereço.</Text>
        <Button asChild colorPalette="brand">
          <NextLink href={HOME_ROUTE}>Voltar ao painel</NextLink>
        </Button>
      </Stack>
    </Center>
  );
}
