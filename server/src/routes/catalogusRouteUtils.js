function asNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function asBit(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

module.exports = {
  asNullableNumber,
  asBit,
};
