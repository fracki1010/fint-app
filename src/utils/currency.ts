const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  ARS: "$",
  MXN: "$",
  COP: "$",
};

const COMPACT_SUFFIXES = ["", "K", "M", "B", "T"];

function toNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function trimZeros(value: string) {
  return value.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatCompactCurrency(value: number, currency = "USD") {
  const numericValue = toNumber(value);
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  const symbol = CURRENCY_SYMBOLS[currency];

  if (absValue < 1000) {
    const base = new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absValue);

    return symbol ? `${sign}${symbol}${base}` : `${sign}${currency} ${base}`;
  }

  let compactValue = absValue;
  let suffixIndex = 0;

  while (compactValue >= 1000 && suffixIndex < COMPACT_SUFFIXES.length - 1) {
    compactValue /= 1000;
    suffixIndex += 1;
  }

  const compactBase = trimZeros(
    compactValue.toFixed(compactValue >= 100 ? 0 : 1),
  );
  const compactAmount = `${compactBase}${COMPACT_SUFFIXES[suffixIndex]}`;

  return symbol
    ? `${sign}${symbol}${compactAmount}`
    : `${sign}${currency} ${compactAmount}`;
}
