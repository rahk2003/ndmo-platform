const GREGORIAN_LOCALES = {
  ar: "ar-SA-u-ca-gregory-nu-latn",
  en: "en-GB-u-ca-gregory",
};

function parseDate(value) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? `${value}T00:00:00`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatGregorianDate(value, language = "ar") {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(GREGORIAN_LOCALES[language] || GREGORIAN_LOCALES.en, {
    calendar: "gregory",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatGregorianDateTime(value, language = "ar") {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(GREGORIAN_LOCALES[language] || GREGORIAN_LOCALES.en, {
    calendar: "gregory",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
