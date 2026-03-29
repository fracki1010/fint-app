import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Loader2, Lock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("No pudimos autenticarte. Verifica tus datos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <Card className="app-panel rounded-[28px]">
          <CardBody className="p-6">
            <p className="section-kicker">Fint Suite</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Accede para gestionar operaciones, clientes e inventario.
            </p>

            <div className="mt-5 space-y-3">
              <Input
                label="Email"
                type="email"
                value={email}
                variant="bordered"
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Contraseña"
                startContent={<Lock size={16} />}
                type="password"
                value={password}
                variant="bordered"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="mt-3 text-xs text-danger">{error}</p>}

            <Button
              className="mt-5 h-12 rounded-2xl font-semibold"
              color="primary"
              isDisabled={submitting}
              startContent={
                submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null
              }
              onClick={handleSubmit}
            >
              Ingresar
            </Button>
            <p className="mt-4 text-xs text-default-500">
              El alta de cuentas la realiza el administrador.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
