import { HStack, Text } from "@chakra-ui/react";

export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#FFC409" />
      <path
        d="M7 25h7l4-10 5 15 4-9h6"
        fill="none"
        stroke="#0C0D0D"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
