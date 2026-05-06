import { create } from "zustand";

import {
  ParsedRow,
  ValidatedRow,
  ValidationError,
  CsvParseResult,
} from "@shared/types/bulkImport";
import { parseCSV } from "@features/sales/utils/csvParser";

export type ImportStatus =
  | "idle"
  | "parsing"
  | "validating"
  | "ready"
  | "importing"
  | "complete"
  | "error";

export interface ImportProgress {
  /** Total number of rows to process */
  total: number;
  /** Number of rows processed so far */
  processed: number;
  /** Number of rows successfully imported */
  succeeded: number;
  /** Number of rows that failed */
  failed: number;
}

export interface BulkImportState {
  /** Current status of the import process */
  status: ImportStatus;
  /** Raw CSV text input */
  rawText: string;
  /** Rows successfully parsed from CSV */
  parsedRows: ParsedRow[];
  /** Rows after validation (includes product/client matches) */
  validatedRows: ValidatedRow[];
  /** Current progress during import phase */
  progress: ImportProgress;
  /** Validation errors collected during parse/validate */
  errors: ValidationError[];
  /** Global error message for fatal errors */
  errorMessage: string | null;
}

export interface BulkImportActions {
  /** Set raw CSV text */
  setRawText: (text: string) => void;
  /** Parse CSV text into structured rows */
  parseCSV: () => CsvParseResult;
  /** Set parsed rows (used by parseCSV action) */
  setParsedRows: (result: CsvParseResult) => void;
  /** Set validated rows after async validation */
  setValidatedRows: (rows: ValidatedRow[]) => void;
  /** Update import progress */
  updateProgress: (progress: Partial<ImportProgress>) => void;
  /** Start the import phase */
  startImport: () => void;
  /** Mark a row as successfully imported */
  markRowSuccess: (rowNumber: number) => void;
  /** Mark a row as failed with error */
  markRowFailed: (rowNumber: number, error: string) => void;
  /** Complete the import */
  completeImport: () => void;
  /** Set error state */
  setError: (message: string) => void;
  /** Reset the store to initial state */
  reset: () => void;
}

const initialProgress: ImportProgress = {
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
};

const initialState: BulkImportState = {
  status: "idle",
  rawText: "",
  parsedRows: [],
  validatedRows: [],
  progress: initialProgress,
  errors: [],
  errorMessage: null,
};

export const useBulkImportStore = create<BulkImportState & BulkImportActions>(
  (set, get) => ({
    ...initialState,

    setRawText: (text: string) => {
      set({ rawText: text });
    },

    parseCSV: () => {
      const { rawText } = get();

      set({ status: "parsing", errors: [], errorMessage: null });

      try {
        const result = parseCSV(rawText);

        get().setParsedRows(result);

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error desconocido al parsear CSV";

        set({
          status: "error",
          errorMessage: message,
        });

        return {
          rows: [],
          errors: [{ row: 0, message }],
          totalRows: 0,
        };
      }
    },

    setParsedRows: (result: CsvParseResult) => {
      // Convert parse errors to validation errors
      const validationErrors: ValidationError[] = result.errors.map((err) => ({
        type: "INVALID_DATE", // Generic type for parse errors
        message: err.message,
        rowNumber: err.row,
      }));

      set({
        status: result.errors.length > 0 && result.rows.length === 0 ? "error" : "idle",
        parsedRows: result.rows,
        errors: validationErrors,
        progress: {
          ...initialProgress,
          total: result.rows.length,
        },
        errorMessage:
          result.errors.length > 0 && result.rows.length === 0
            ? "Error al procesar el archivo CSV"
            : null,
      });
    },

    setValidatedRows: (rows: ValidatedRow[]) => {
      const validCount = rows.filter((r) => r.status === "valid").length;
      const invalidCount = rows.filter((r) => r.status === "invalid").length;

      set({
        validatedRows: rows,
        status: invalidCount > 0 ? "ready" : validCount > 0 ? "ready" : "error",
        progress: {
          ...get().progress,
          total: rows.length,
        },
      });
    },

    updateProgress: (progress: Partial<ImportProgress>) => {
      set((state) => ({
        progress: { ...state.progress, ...progress },
      }));
    },

    startImport: () => {
      const { validatedRows } = get();
      const validRows = validatedRows.filter((r) => r.status === "valid");

      set({
        status: "importing",
        progress: {
          total: validRows.length,
          processed: 0,
          succeeded: 0,
          failed: 0,
        },
        errors: [],
      });
    },

    markRowSuccess: (rowNumber: number) => {
      set((state) => ({
        progress: {
          ...state.progress,
          processed: state.progress.processed + 1,
          succeeded: state.progress.succeeded + 1,
        },
      }));
    },

    markRowFailed: (rowNumber: number, error: string) => {
      set((state) => ({
        progress: {
          ...state.progress,
          processed: state.progress.processed + 1,
          failed: state.progress.failed + 1,
        },
        errors: [
          ...state.errors,
          {
            type: "INVALID_DATE",
            message: error,
            rowNumber,
          },
        ],
      }));
    },

    completeImport: () => {
      set({ status: "complete" });
    },

    setError: (message: string) => {
      set({
        status: "error",
        errorMessage: message,
      });
    },

    reset: () => {
      set(initialState);
    },
  }),
);

export type BulkImportStore = ReturnType<typeof useBulkImportStore>;
