import rawData from './stateTaxData.json';

export const STATE_TAX_BRACKETS = {};

// Convert any `null` thresholds to `Infinity`
for (let year of ['2023','2024','2025']) {
  STATE_TAX_BRACKETS[year] = {};
  for (let [st, brackets] of Object.entries(rawData[year]||{})) {
    STATE_TAX_BRACKETS[year][st] = brackets.map(({ threshold, rate }) => ({
      threshold: threshold == null ? Infinity : threshold,
      rate
    }));
  }
}

/**
 * Returns rounded state tax on `income` for `stateAbbrev` in `year`.
 */
export function computeStateTax(income, stateAbbrev, year = 2023) {
  const yearBrackets = STATE_TAX_BRACKETS[year];
  if (!yearBrackets) return 0;
  const brackets = yearBrackets[stateAbbrev];
  if (!brackets) return 0;

  let tax = 0, last = 0, remaining = income;
  for (let { threshold, rate } of brackets) {
    const chunk = Math.min(remaining, threshold - last);
    if (chunk <= 0) break;
    tax      += chunk * rate;
    remaining -= chunk;
    last       = threshold;
  }
  return Math.round(tax);
}
