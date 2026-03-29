import axios from "axios";

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          error?: string | { message?: string };
        }
      | undefined;

    const nestedErrorMessage =
      typeof data?.error === "object" && data.error
        ? data.error.message
        : undefined;
    const legacyErrorMessage =
      typeof data?.error === "string" ? data.error : undefined;

    return (
      data?.message ||
      nestedErrorMessage ||
      legacyErrorMessage ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
