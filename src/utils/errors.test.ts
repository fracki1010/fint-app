import { describe, expect, it } from "vitest";
import axios from "axios";

import { getErrorMessage } from "@/utils/errors";

describe("getErrorMessage", () => {
  it("usa message de respuesta axios cuando existe", () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: "Backend message" } },
    } as unknown as Error;

    expect(getErrorMessage(error, "fallback")).toBe("Backend message");
  });

  it("usa error.message anidado de respuesta axios cuando existe", () => {
    const error = {
      isAxiosError: true,
      response: { data: { error: { message: "Nested backend message" } } },
    } as unknown as Error;

    expect(getErrorMessage(error, "fallback")).toBe("Nested backend message");
  });

  it("usa mensaje de Error estandar", () => {
    expect(getErrorMessage(new Error("Boom"), "fallback")).toBe("Boom");
  });

  it("retorna fallback cuando no puede inferir", () => {
    expect(getErrorMessage({ something: true }, "fallback")).toBe("fallback");
  });

  it("reconoce errores axios reales", () => {
    const error = axios.AxiosError.from(new Error("Network down"));

    expect(getErrorMessage(error, "fallback")).toBe("Network down");
  });
});
