import api from "@shared/api/axios";

export type ExportType =
  | "sales"
  | "product-analysis"
  | "accounting"
  | "clients"
  | "purchases";

export interface ExportParams {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export async function downloadExport(
  type: ExportType,
  params: ExportParams = {},
  filename?: string,
): Promise<void> {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.category) searchParams.set("category", params.category);

  const qs = searchParams.toString();
  const url = `/export/${type}${qs ? `?${qs}` : ""}`;

  const response = await api.get(url, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"];
  let finalFilename = filename;

  if (!finalFilename && contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) finalFilename = match[1];
  }

  if (!finalFilename) {
    finalFilename = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
  }

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}