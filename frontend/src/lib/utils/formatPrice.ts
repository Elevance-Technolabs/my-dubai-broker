export const formatPrice = (
  value?: number | string | null,
  currency = "AED",
  locale = "en-AE",
  includeSymbol = true,
) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (
    numericValue === undefined ||
    numericValue === null ||
    isNaN(numericValue)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    style: includeSymbol ? "currency" : "decimal",
    currency: includeSymbol ? currency : undefined,
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  }).format(numericValue);
};
