// 1) Simple JSON‑Pointer resolver (for "$ref": "#/XX/2022")
function resolveJsonPointer(obj, pointer) {
  const parts = pointer.replace(/^#\//, '').split('/');
  return parts.reduce((cur, part) => {
    if (!cur || !(part in cur)) {
      throw new Error(`Invalid JSON pointer: ${pointer}`);
    }
    return cur[part];
  }, obj);
}

// 2) Pull out & normalize one state's one filing‑status bracket array
export function getBrackets(rawData, stateAbbrev, year, filingStatus) {
  if (!rawData[stateAbbrev]) {
    console.warn(`getBrackets: no data for state “${stateAbbrev}”`);
    return [];
  }

  let yearData = rawData[stateAbbrev][year];
  if (!yearData) return [];

  // follow a top‑level $ref
  if (yearData.$ref) {
    yearData = resolveJsonPointer(rawData, yearData.$ref);
  }

  // flat‑array (no statuses)
  if (Array.isArray(yearData)) {
    return yearData;
  }

  // status‑specific
  let brackets = yearData[filingStatus];
  if (!brackets) return [];

  // bracket‑level $ref
  if (brackets.$ref) {
    brackets = resolveJsonPointer(rawData, brackets.$ref);
  }

  // single‑element pointer‐array (e.g. HOH → MFJ)
  if (
    Array.isArray(brackets) &&
    brackets.length === 1 &&
    brackets[0] != null &&
    typeof brackets[0] === 'object' &&
    brackets[0].$ref
  ) {
    brackets = resolveJsonPointer(rawData, brackets[0].$ref);
  }

  return Array.isArray(brackets) ? brackets : [];
}

// 3) Compute the tax
export function calculateStateTax(brackets, taxableIncome) {
  let tax = 0;
  let lastThreshold = 0;

  for (let { threshold, rate } of brackets) {
    // interpret `null` (or undefined) as “∞”
    const upper = (threshold == null) ? Infinity : threshold;

    if (taxableIncome > lastThreshold) {
      const slice = Math.min(taxableIncome, upper) - lastThreshold;

      // ---- NEW: parse the rate if it’s a string ending in “%”
      let r;
      if (typeof rate === 'string' && rate.trim().endsWith('%')) {
        r = parseFloat(rate) / 100;      // "8.0%" → 0.08
      } else {
        r = Number(rate);                // already a number (e.g. 0.08)
      }

      tax += slice * r;
    }

    lastThreshold = upper;
    if (taxableIncome <= upper) break;
  }

  return tax;
}

window.getBrackets = getBrackets;
window.calculateStateTax = calculateStateTax;
