import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          DEFAULT: "#0D4FA9",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0F766E",
          foreground: "#FFFFFF",
        },
        focus: "#0D4FA9",
        background: "#F5F9FF",
        foreground: "#0E1B32",
        content1: "#FFFFFF",
        content2: "#EEF4FF",
        content3: "#DFEAFB",
        content4: "#CCDDF6",
      },
    },
    dark: {
      colors: {
        primary: {
          DEFAULT: "#5B95E6",
          foreground: "#08101C",
        },
        secondary: {
          DEFAULT: "#2DD4BF",
          foreground: "#041513",
        },
        focus: "#5B95E6",
        background: "#0C0F14",
        foreground: "#EAF0FF",
        content1: "#131820",
        content2: "#1A202B",
        content3: "#232B38",
        content4: "#2D3748",
      },
    },
  },
});
