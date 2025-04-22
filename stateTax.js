// stateTax.js

// 1. Load the raw JSON
async function loadRawData() {
    const res = await fetch(new URL('./state_tax_data.json', import.meta.url));
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }
  
  // 2. Simple in‑JS JSON‑Pointer resolver for "#/STATE/YEAR" or deeper
  function resolveJsonPointer(obj, pointer) {
    // strip leading "#/"
    const parts = pointer.replace(/^#\//, '').split('/');
    let current = obj;
    for (const part of parts) {
      if (!(part in current)) {
        throw new Error(`Invalid JSON pointer: ${pointer}`);
      }
      current = current[part];
    }
    return current;
  }
  
  // 3. Where we'll stash everything
  export const STATE_TAX_BRACKETS = {};
  
  // 4. Immediately kick off loading & normalization
  ;(async () => {
    const rawData = await loadRawData();
    const YEARS = ['2023', '2024', '2025'];
    const STATUSES = ['Single', 'MFS', 'MFJ', 'HOH', 'QW'];
  
    for (const year of YEARS) {
      STATE_TAX_BRACKETS[year] = {};
  
      for (const [stateAbbrev, byYear] of Object.entries(rawData)) {
        let yearData = byYear[year];
        if (!yearData) continue;
  
        // 4a) Handle a top‑level $ref for the entire year
        if (
          yearData &&
          typeof yearData === 'object' &&
          Object.prototype.hasOwnProperty.call(yearData, '$ref')
        ) {
          yearData = resolveJsonPointer(rawData, yearData.$ref);
        }
  
        STATE_TAX_BRACKETS[year][stateAbbrev] = {};
  
        // 4b) Flat‑array case (some states just give an array instead of per‑status)
        if (Array.isArray(yearData)) {
          const normalized = yearData.map(({ threshold, rate }) => ({
            threshold: threshold == null ? Infinity : threshold,
            rate,
          }));
          for (const status of STATUSES) {
            STATE_TAX_BRACKETS[year][stateAbbrev][status] = normalized;
          }
          continue;
        }
  
        // 4c) Otherwise yearData should be an object of statuses → bracket‑arrays or $refs
        for (const [filingStatus, rawBrackets] of Object.entries(yearData)) {
          let brackets = rawBrackets;
  
          // 4c.i) If this status entry is a { "$ref": "…" } object
          if (
            brackets &&
            typeof brackets === 'object' &&
            Object.prototype.hasOwnProperty.call(brackets, '$ref')
          ) {
            brackets = resolveJsonPointer(rawData, brackets.$ref);
          }
  
          // 4c.ii) Only map real arrays; skip anything else
          if (!Array.isArray(brackets)) {
            console.warn(
              `Skipping ${stateAbbrev} ${year} ${filingStatus}: expected array, got`,
              brackets
            );
            continue;
          }
  
          STATE_TAX_BRACKETS[year][stateAbbrev][filingStatus] = brackets.map(
            ({ threshold, rate }) => ({
              threshold: threshold == null ? Infinity : threshold,
              rate,
            })
          );
        }
      }
    }
  })();
  
  // 5. Compute tax using the normalized bracket data
  export function computeStateTax(
    income,
    stateAbbrev,
    year = '2023',
    filingStatus = 'Single'
  ) {
    const brackets =
      STATE_TAX_BRACKETS[year]?.[stateAbbrev]?.[filingStatus] ?? [];
    let tax = 0,
      last = 0,
      remaining = income;
  
    for (const { threshold, rate } of brackets) {
      const chunk = Math.min(remaining, threshold - last);
      if (chunk <= 0) break;
      tax += chunk * rate;
      remaining -= chunk;
      last = threshold;
    }
  
    return Math.round(tax);
  }
  
  export { computeStateTax as calculateStateTax };
  