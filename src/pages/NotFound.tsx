import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="app-panel w-full max-w-md rounded-[28px] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Compass size={24} />
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-default-500">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Esta pantalla no existe
        </h1>
        <p className="mt-2 text-sm text-default-500">
          Volve al tablero principal para continuar operando.
        </p>
        <Link
          className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          to="/"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
