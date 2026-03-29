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
          DEFAULT: "#2DD4BF",
          foreground: "#06221D",
        },
        focus: "#0D4FA9",
        background: "#111318",
        foreground: "#EAF0FF",
        content1: "#171A21",
        content2: "#1E232D",
        content3: "#262D39",
        content4: "#30394A",
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
