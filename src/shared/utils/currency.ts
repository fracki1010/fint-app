const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  ARS: "$",
  MXN: "$",
  COP: "$",
};

const COMPACT_MAX_CHARS = 10;

/** Global currency override — set via setGlobalCurrency() when settings load */
let _currentCurrency: string | undefined;

/**
 * Set the default currency used by formatCurrency / formatCompactCurrency
 * when no explicit currency argument is passed.
 */
export function setGlobalCurrency(currency: string) {
  _currentCurrency = currency;
}

function toNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function trimZeros(value: string) {
  return value.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

function isDesktopViewport() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(min-width: 1024px)").matches;
}

function resolveCurrency(currency?: string): string {
  return currency || _currentCurrency || "USD";
}

export function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: resolveCurrency(currency),
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatCompactCurrency(value: number, currency?: string) {
  const c = resolveCurrency(currency);

  if (isDesktopViewport()) {
    return formatCurrency(value, c);
  }

  const numericValue = toNumber(value);
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  const symbol = CURRENCY_SYMBOLS[c];
  const fullBase = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  const fullAmount = symbol
    ? `${sign}${symbol}${fullBase}`
    : `${sign}${c} ${fullBase}`;

  if (fullAmount.length <= COMPACT_MAX_CHARS || absValue < 1000) {
    return fullAmount;
  }

  const compactValue = absValue >= 1_000_000 ? absValue / 1_000_000 : absValue / 1000;
  const suffix = absValue >= 1_000_000 ? "M" : "K";
  const compactBase = trimZeros(
    compactValue.toFixed(compactValue >= 100 ? 0 : 1),
  );
  const compactAmount = `${compactBase}${suffix}`;

  return symbol
    ? `${sign}${symbol}${compactAmount}`
    : `${sign}${c} ${compactAmount}`;
}
