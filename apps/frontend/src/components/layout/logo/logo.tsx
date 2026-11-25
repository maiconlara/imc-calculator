import { HStack, Text } from "@chakra-ui/react";
import { LogoIcon } from "./logo-icon";

export function Logo({
  background = "light",
  size = 36,
}: {
  background?: "light" | "dark";
  size?: number;
}) {
  const isDarkBackground = background === "dark";
  const wordmarkFontSize = size > 40 ? "2xl" : "lg";
  return (
    <HStack gap="2.5" role="img" aria-label="IMC Calculator">
      <LogoIcon size={size} />
      <HStack gap="1" lineHeight="1" aria-hidden="true">
        <Text
          as="span"
          fontFamily="heading"
          fontWeight="900"
          fontSize={wordmarkFontSize}
          letterSpacing="tight"
          color={isDarkBackground ? "brand.solid" : "graphite.900"}
          bg={isDarkBackground ? undefined : "brand.solid"}
          px={isDarkBackground ? "0" : "1.5"}
          borderRadius="sm"
        >
          IMC
        </Text>
        <Text
          as="span"
          fontFamily="heading"
          fontWeight="900"
          fontSize={wordmarkFontSize}
          letterSpacing="tight"
          color={isDarkBackground ? "white" : "graphite.900"}
        >
          CALCULATOR
        </Text>
      </HStack>
    </HStack>
  );
}
