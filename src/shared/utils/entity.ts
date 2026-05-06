/**
 * Obtiene el nombre a mostrar de un cliente (viene como string ID o como objeto).
 */
export function getClientName(client: string | { _id: string; name?: string; phone?: string }): string {
  if (typeof client === "object" && client) return client.name || "Cliente desconocido";
  return "Cliente desconocido";
}

/**
 * Obtiene el teléfono de un cliente.
 */
export function getClientPhone(client: string | { _id: string; name?: string; phone?: string }): string {
  if (typeof client === "object" && client) return client.phone || "Sin teléfono";
  return client || "Sin teléfono";
}

/**
 * Obtiene el nombre a mostrar de un proveedor/entidad con company + name.
 */
export function displayName(entity: { company?: string; name?: string }): string {
  return entity.company || entity.name || "";
}
