import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import * as XLSX from "xlsx";
import { useAppToast } from "@features/notifications/components/AppToast";
import { useProductImport } from "../hooks/useProductImport";
import { parseProductXlsx, groupProductRows, generateProductTemplate, GroupedProduct } from "../utils/productXlsxParser";

interface ImportProductsModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Stage = "upload" | "preview" | "importing" | "done";

export default function ImportProductsModal({ open, onClose, onImported }: ImportProductsModalProps) {
  const { showToast } = useAppToast();
  const { mutateAsync: importProducts, isPending } = useProductImport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [groups, setGroups] = useState<GroupedProduct[]>([]);
  const [result, setResult] = useState<{ created: number; updated: number; errors: { row: number; message: string }[] } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { rows, errors: parseErrors } = await parseProductXlsx(file);
      if (parseErrors.length > 0) {
        showToast({ variant: "warning", message: `${parseErrors.length} filas ignoradas por datos inválidos` });
      }
      if (rows.length === 0) {
        showToast({ variant: "error", message: "No se encontraron productos válidos en el archivo" });
        return;
      }
      const grouped = groupProductRows(rows);
      setGroups(grouped);
      setStage("preview");
    } catch (err) {
      showToast({ variant: "error", message: "Error al leer el archivo. Asegurate de que sea un XLSX válido." });
    }
  };

  const handleImport = async () => {
    setStage("importing");
    try {
      const products = groups.map(g => ({
        nombre: g.name,
        sku: g.sku,
        ...(g.data[0].codigo_barras ? { codigo_barras: g.data[0].codigo_barras } : {}),
        ...(g.data[0].descripcion ? { descripcion: g.data[0].descripcion } : {}),
        precio_base: g.data[0].precio_base,
        precio_costo: g.data[0].precio_costo,
        stock_actual: g.data[0].stock_actual,
        stock_minimo: g.data[0].stock_minimo,
        categoria: g.data[0].categoria,
        unidad_medida: g.data[0].unidad_medida,
        tipo: g.data[0].tipo,
        precio_minorista: g.data[0].precio_minorista,
        precio_mayorista: g.data[0].precio_mayorista,
        precio_distribuidor: g.data[0].precio_distribuidor,
        presentacion_nombre: g.presentations[0]?.presentacion_nombre,
        presentacion_precio: g.presentations[0]?.presentacion_precio,
        presentacion_unidades: g.presentations[0]?.presentacion_unidades,
        presentacion_sku: g.presentations[0]?.presentacion_sku,
      }));
      const res = await importProducts({ products });
      setResult(res);
      setStage("done");
      onImported();
    } catch (err) {
      showToast({ variant: "error", message: "Error al importar productos" });
      setStage("preview");
    }
  };

  const handleDownloadTemplate = () => {
    const wb = generateProductTemplate();
    XLSX.writeFile(wb, "plantilla_productos.xlsx");
  };

  const totalProducts = groups.length;
  const totalPresentations = groups.reduce((s, g) => s + g.presentations.length, 0);

  return (
    <Modal isOpen={open} onClose={onClose} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-base font-bold">
          <FileSpreadsheet size={18} className="text-primary" />
          Importar Productos
        </ModalHeader>
        <ModalBody className="space-y-4">
          {stage === "upload" && (
            <>
              <p className="text-sm text-default-500">
                Seleccioná un archivo XLSX con los productos a importar. También podés descargar la plantilla de ejemplo.
              </p>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-divider/40 bg-content2/20 p-8 hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={32} className="text-default-400 mb-3" />
                <p className="text-sm font-semibold text-foreground">Hacé click para seleccionar archivo</p>
                <p className="text-xs text-default-500 mt-1">XLSX — Máximo 500 filas</p>
                <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
              </div>
              <div className="text-center">
                <Button variant="flat" size="sm" startContent={<Download size={14} />} onPress={handleDownloadTemplate}>
                  Descargar plantilla
                </Button>
              </div>
            </>
          )}

          {stage === "preview" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {totalProducts} producto{totalProducts !== 1 ? "s" : ""} · {totalPresentations} presentación{totalPresentations !== 1 ? "es" : ""}
                </p>
                <Button variant="flat" size="sm" onPress={() => { setStage("upload"); setGroups([]); }}>
                  Cambiar archivo
                </Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {groups.map((g) => (
                  <div key={g.key} className="rounded-xl border border-divider/20 bg-content2/30 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{g.name}</span>
                        {g.sku && <span className="text-[10px] font-mono text-default-400">{g.sku}</span>}
                      </div>
                      <span className="text-[10px] font-semibold text-default-400 shrink-0">
                        {g.presentations.length} pres.
                      </span>
                    </div>
                    {g.presentations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {g.presentations.map((p, i) => (
                          <span key={i} className="rounded-full bg-content1/60 px-2 py-0.5 text-[10px] text-default-500">
                            {p.presentacion_nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {stage === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mb-4" size={32} />
              <p className="text-sm font-semibold text-foreground">Importando productos...</p>
            </div>
          )}

          {stage === "done" && result && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle size={18} />
                  <p className="text-sm font-bold">Importación completada</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-content2/40 p-3 text-center">
                    <p className="text-lg font-bold text-primary">{result.created}</p>
                    <p className="text-[10px] text-default-500">Creados</p>
                  </div>
                  <div className="rounded-xl bg-content2/40 p-3 text-center">
                    <p className="text-lg font-bold text-success">{result.updated}</p>
                    <p className="text-[10px] text-default-500">Actualizados</p>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 p-3">
                  <div className="flex items-center gap-2 text-danger mb-2">
                    <AlertCircle size={14} />
                    <p className="text-xs font-bold">{result.errors.length} error(es)</p>
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-danger/80">Fila {e.row}: {e.message}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {stage === "upload" && (
            <Button variant="flat" onPress={onClose}>Cerrar</Button>
          )}
          {stage === "preview" && (
            <>
              <Button variant="flat" onPress={onClose}>Cancelar</Button>
              <Button color="primary" onPress={handleImport} isLoading={isPending}>
                Importar {totalProducts} producto{totalProducts !== 1 ? "s" : ""}
              </Button>
            </>
          )}
          {stage === "done" && (
            <Button color="primary" onPress={onClose}>Listo</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
