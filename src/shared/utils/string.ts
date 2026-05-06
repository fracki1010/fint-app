/**
 * Devuelve las primeras 2 letras de un nombre en mayúscula.
 */
export function getInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Normaliza un texto para comparaciones (trim + lowercase).
 */
export function normalizeText(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}
