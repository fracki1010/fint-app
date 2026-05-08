/**
 * Crea una fecha evitando el desfase por timezone.
 * Para strings "YYYY-MM-DD", fuerza medio día para evitar UTC→local shift.
 */
function safeDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  // Si es solo fecha sin hora (YYYY-MM-DD), agregamos medio día
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00");
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

/**
 * Formatea una fecha ISO a un string legible sin hora.
 * Ej: "08/05/2026"
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = safeDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formatea una fecha ISO con hora (HH:MM).
 * Ej: "08/05/2026 14:30"
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = safeDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formato más corto con nombre de mes. Ej: "8 may 2026"
 */
export function formatDateShort(dateStr: string): string {
  const d = safeDate(dateStr);
  return d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
