// stateTax.js

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

  const STATUSES = ['Single','MFS','MFJ','HOH','QW'];

  //  ↙— bail out if someone passed the placeholder
  if (!STATUSES.includes(filingStatus)) {
    console.warn(`getBrackets: invalid status “${filingStatus}”, returning empty brackets`);
    return [];
  }

  if (!STATUSES.includes(stateAbbrev)) {
    console.warn(`stateAbbrev: invalid status “${stateAbbrev}”`);
    return [];
  }

  let yearData = rawData[stateAbbrev]?.[year];
  if (!yearData) return [];

  // top‑level $ref?
  if (yearData.$ref) {
    yearData = resolveJsonPointer(rawData, yearData.$ref);
  }

  // flat‑array case (same brackets for all statuses)
  if (Array.isArray(yearData)) {
    return yearData.map(({threshold,rate}) => ({
      threshold: threshold == null ? Infinity : threshold,
      rate
    }));
  }

  // otherwise per‑status object
  let brackets = yearData[filingStatus];
  if (!brackets) return [];
  if (brackets.$ref) {
    brackets = resolveJsonPointer(rawData, brackets.$ref);
  }
  if (!Array.isArray(brackets)) return [];

  return brackets.map(({threshold,rate}) => ({
    threshold: threshold == null ? Infinity : threshold,
    rate
  }));
}

// 3) Compute the tax
export function calculateStateTax(
  rawData,
  stateAbbrev,
  income,
  year = '2023',
  filingStatus = 'Single'
) {
  const brackets = getBrackets(rawData, stateAbbrev, year, filingStatus);
  let tax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const lower = brackets[i].threshold || 0;
    const upper = brackets[i+1]?.threshold ?? Infinity;
    if (income <= lower) break;
    const slice = Math.min(income, upper) - lower;
    tax += slice * brackets[i].rate;
  }

  return Math.round(tax);
}

window.getBrackets    = getBrackets;
window.calculateStateTax = calculateStateTax;