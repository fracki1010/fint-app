import { useMemo } from "react";
import { useAuth } from "@features/auth/hooks/useAuth";

export type ExperienceMode = "simple" | "intermediate" | "full";

export function useExperienceMode() {
  const { user } = useAuth();
  const tenant = user?.tenant;
  const mode: ExperienceMode = tenant?.experienceMode || "simple";

  const isSimple = mode === "simple";
  const isIntermediate = mode === "intermediate";
  const isFull = mode === "full";

  return { mode, isSimple, isIntermediate, isFull };
}
