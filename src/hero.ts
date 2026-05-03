import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0F766E",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#059669",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        focus: "#D97706",
        background: "#F8F6F4",
        foreground: "#1C1613",
        content1: "#FFFFFF",
        content2: "#F0ECE8",
        content3: "#E4DED8",
        content4: "#D5CDC4",
        divider: "rgba(100,70,40,0.12)",
      },
    },
    dark: {
      colors: {
        primary: {
          DEFAULT: "#F59E0B",
          foreground: "#1A1410",
        },
        secondary: {
          DEFAULT: "#2DD4BF",
          foreground: "#041513",
        },
        success: {
          DEFAULT: "#34D399",
          foreground: "#052E16",
        },
        warning: {
          DEFAULT: "#FBBF24",
          foreground: "#1C0E00",
        },
        danger: {
          DEFAULT: "#F87171",
          foreground: "#1C0E00",
        },
        focus: "#F59E0B",
        background: "#0C0908",
        foreground: "#F5F0EC",
        content1: "#14110E",
        content2: "#1C1814",
        content3: "#25211C",
        content4: "#302A24",
        divider: "rgba(220,180,140,0.10)",
      },
    },
  },
});
