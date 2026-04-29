const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  ARS: "$",
  MXN: "$",
  COP: "$",
};

const COMPACT_MAX_CHARS = 10;

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

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatCompactCurrency(value: number, currency = "USD") {
  if (isDesktopViewport()) {
    return formatCurrency(value, currency);
  }

  const numericValue = toNumber(value);
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  const symbol = CURRENCY_SYMBOLS[currency];
  const fullBase = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  const fullAmount = symbol
    ? `${sign}${symbol}${fullBase}`
    : `${sign}${currency} ${fullBase}`;

  if (fullAmount.length <= COMPACT_MAX_CHARS || absValue < 1000) {
    return fullAmount;
  }

  const compactValue =
    absValue >= 1_000_000 ? absValue / 1_000_000 : absValue / 1000;
  const suffix = absValue >= 1_000_000 ? "M" : "K";
  const compactBase = trimZeros(
    compactValue.toFixed(compactValue >= 100 ? 0 : 1),
  );
  const compactAmount = `${compactBase}${suffix}`;

  return symbol
    ? `${sign}${symbol}${compactAmount}`
    : `${sign}${currency} ${compactAmount}`;
}
