import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { BMI_RANGES } from "@imc-calculator/shared";
import { Logo } from "@/components/layout/logo";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";

/**
 * Graphite side of the login screen on wide screens: the logo, the headline and the
 * colors of the BMI table.
 */
export function LoginBrandPanel() {
  return (
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
          Registre as avaliações de IMC dos alunos e acompanhe a evolução de cada um, mês
          a mês.
        </Text>
      </Box>

      <Box>
        <Text textStyle="monoLabel" color="whiteAlpha.600" mb="3">
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
  );
}
