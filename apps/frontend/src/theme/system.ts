import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    "html, body": {
      bg: "bg.canvas",
      color: "fg",
      fontFamily: "body",
    },
    "*, *::before, *::after": {
      _motionReduce: {
        animationDuration: "0.01ms !important",
        transitionDuration: "0.01ms !important",
      },
    },
  },
  theme: {
    textStyles: {
      monoLabel: {
        value: {
          fontFamily: "mono",
          fontSize: "2xs",
          fontWeight: "medium",
          lineHeight: "1rem",
          textTransform: "uppercase",
          letterSpacing: "wider",
        },
      },
    },
    tokens: {
      fonts: {
        heading: { value: "var(--font-heading), 'Arial Narrow', system-ui, sans-serif" },
        body: {
          value: "var(--font-body), system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
        mono: { value: "var(--font-mono), ui-monospace, 'SF Mono', Consolas, monospace" },
      },
      colors: {
        brand: {
          50: { value: "#fff8f0" },
          100: { value: "#fff2e0" },
          200: { value: "#ffe8c6" },
          300: { value: "#ffdb9e" },
          400: { value: "#ffcc24" },
          500: { value: "#ffc409" },
          600: { value: "#e29700" },
          700: { value: "#bb6a02" },
          800: { value: "#985208" },
          900: { value: "#7c430b" },
          950: { value: "#482300" },
        },
        graphite: {
          50: { value: "#f3f3f3" },
          100: { value: "#dbdbdb" },
          200: { value: "#bfbfbf" },
          300: { value: "#a3a3a3" },
          400: { value: "#868888" },
          500: { value: "#6b6b6b" },
          600: { value: "#515252" },
          700: { value: "#3a3b3b" },
          800: { value: "#232424" },
          900: { value: "#0c0d0d" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.graphite.900}" },
          fg: { value: "{colors.brand.800}" },
          muted: { value: "{colors.brand.200}" },
          subtle: { value: "{colors.brand.100}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
          border: { value: "{colors.brand.500}" },
        },
        graphite: {
          solid: { value: "{colors.graphite.900}" },
          contrast: { value: "{colors.white}" },
          fg: { value: "{colors.graphite.700}" },
          muted: { value: "{colors.graphite.100}" },
          subtle: { value: "{colors.graphite.50}" },
          emphasized: { value: "{colors.graphite.200}" },
          focusRing: { value: "{colors.graphite.900}" },
          border: { value: "{colors.graphite.200}" },
        },
        bg: {
          canvas: { value: "{colors.graphite.50}" },
        },
      },
    },
    recipes: {
      button: {
        base: {
          borderRadius: "full",
          fontWeight: "semibold",
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
