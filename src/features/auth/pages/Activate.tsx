import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import api from "@shared/api/axios";

const MIN_PASSWORD_LENGTH = 6;

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const confirmationMismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit =
    token.length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirmation === password &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/activate", { token, password });
      setDone(true);
    } catch (requestError: unknown) {
      const message =
        (requestError as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message;
      setError(message ?? "No pudimos activar tu usuario. Pedí un link nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <Card className="app-panel rounded-[28px]">
          <CardBody className="gap-6 p-6">
            {done ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <h1 className="text-xl font-semibold">Usuario activado</h1>
                <p className="text-default-500">Ya podés iniciar sesión con tu email y la contraseña que elegiste.</p>
                <Button as={RouterLink} color="primary" fullWidth to="/login">
                  Ir a iniciar sesión
                </Button>
              </div>
            ) : !token ? (
              <div className="flex flex-col gap-3 text-center">
                <h1 className="text-xl font-semibold">Link inválido</h1>
                <p className="text-default-500">Este link no tiene datos de activación. Pedí uno nuevo a quien te invitó.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <h1 className="text-xl font-semibold">Activá tu usuario</h1>
                  <p className="text-default-500">Elegí la contraseña con la que vas a entrar a Fint Guard.</p>
                </div>

                <Input
                  autoComplete="new-password"
                  errorMessage={passwordTooShort ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.` : undefined}
                  inputMode="text"
                  isInvalid={passwordTooShort}
                  label="Nueva contraseña"
                  startContent={<Lock className="h-4 w-4 text-default-400" />}
                  type="password"
                  value={password}
                  variant="bordered"
                  onValueChange={setPassword}
                />

                <Input
                  autoComplete="new-password"
                  errorMessage={confirmationMismatch ? "Las contraseñas no coinciden." : undefined}
                  isInvalid={confirmationMismatch}
                  label="Repetí la contraseña"
                  type="password"
                  value={confirmation}
                  variant="bordered"
                  onValueChange={setConfirmation}
                />

                {error && <p className="text-small text-danger">{error}</p>}

                <Button
                  color="primary"
                  fullWidth
                  isDisabled={!canSubmit}
                  onPress={handleSubmit}
                  startContent={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                >
                  {submitting ? "Activando..." : "Activar usuario"}
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
