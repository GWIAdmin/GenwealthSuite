import rawData from './state_tax_data.json';

export const STATE_TAX_BRACKETS = {};

// Build a nested lookup: STATE_TAX_BRACKETS[year][state][filingStatus] = [{ threshold, rate }, …]
for (let year of ['2023','2024','2025']) {
  STATE_TAX_BRACKETS[year] = {};

  for (let [stateAbbrev, byYear] of Object.entries(rawData)) {
    const yearData = byYear[year];
    if (!yearData) continue;

    STATE_TAX_BRACKETS[year][stateAbbrev] = {};

    // yearData is an object: { Single: […], MFJ: […], HOH: […], … }
    for (let [filingStatus, brackets] of Object.entries(yearData)) {
      STATE_TAX_BRACKETS[year][stateAbbrev][filingStatus] =
        brackets.map(({ threshold, rate }) => ({
          threshold: threshold == null ? Infinity : threshold,
          rate
        }));
    }
  }
}

/**
 * Returns rounded state tax on `income` for `stateAbbrev` in `year`,
 * filing under `filingStatus` (e.g. "Single", "MFJ", "HOH", …).
 */
export function computeStateTax(
  income,
  stateAbbrev,
  year = '2023',
  filingStatus = 'Single'
) {
  const yearBrackets = STATE_TAX_BRACKETS[year];
  if (!yearBrackets) return 0;

  const stateBrackets = yearBrackets[stateAbbrev];
  if (!stateBrackets) return 0;

  const brackets = stateBrackets[filingStatus];
  if (!brackets) return 0;

  let tax = 0;
  let last = 0;
  let remaining = income;

  for (let { threshold, rate } of brackets) {
    const chunk = Math.min(remaining, threshold - last);
    if (chunk <= 0) break;
    tax       += chunk * rate;
    remaining -= chunk;
    last       = threshold;
  }

  return Math.round(tax);
}
