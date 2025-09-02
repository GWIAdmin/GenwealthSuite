// Author: Genwealth 360 Inc.

import { STATE_STD_DED } from './stateStdDeduction.js';
import { calculateStateTax, getBrackets } from './stateTax.js';

const FS_MAP = {
    "Single":                   "Single",
    "Married Filing Jointly":   "MFJ",
    "Married Filing Separately":"MFS",
    "Head of Household":        "HOH",
    "Qualifying Widow(er)":     "QW"
};

 export const BRACKETS = {
      2022: {
            "Single": [
              { threshold: 10275, rate: 0.10 },
              { threshold: 41775, rate: 0.12 },
              { threshold: 89075, rate: 0.22 },
              { threshold: 170050, rate: 0.24 },
              { threshold: 215950, rate: 0.32 },
              { threshold: 539900, rate: 0.35 },
              { threshold: Infinity, rate: 0.37 }
            ],
            "Married Filing Jointly": [
              { threshold: 20550, rate: 0.10 },
              { threshold: 83550, rate: 0.12 },
              { threshold: 178150, rate: 0.22 },
              { threshold: 340100, rate: 0.24 },
              { threshold: 431900, rate: 0.32 },
              { threshold: 647850, rate: 0.35 },
              { threshold: Infinity, rate: 0.37 }
            ],
            "Married Filing Separately": [
                { threshold: 10275, rate: 0.10 },
                { threshold: 41775, rate: 0.12 },
                { threshold: 89075, rate: 0.22 },
                { threshold: 170050, rate: 0.24 },
                { threshold: 215950, rate: 0.32 },
                { threshold: 323925, rate: 0.35 },
                { threshold: Infinity, rate: 0.37 }
            ],
            "Head of Household": [
              { threshold: 14650, rate: 0.10 },
              { threshold: 55900, rate: 0.12 },
              { threshold: 89050, rate: 0.22 },
              { threshold: 170050, rate: 0.24 },
              { threshold: 215950, rate: 0.32 },
              { threshold: 539900, rate: 0.35 },
              { threshold: Infinity, rate: 0.37 }
            ],
            "Qualifying Widow(er)": [
                { threshold: 20550, rate: 0.10 },
                { threshold: 83550, rate: 0.12 },
                { threshold: 178150, rate: 0.22 },
                { threshold: 340100, rate: 0.24 },
                { threshold: 431900, rate: 0.32 },
                { threshold: 647850, rate: 0.35 },
                { threshold: Infinity, rate: 0.37 }
            ]
      },
      2023: {
        "Single": [
          { threshold: 11000, rate: 0.10 },
          { threshold: 44725, rate: 0.12 },
          { threshold: 95375, rate: 0.22 },
          { threshold: 182100, rate: 0.24 },
          { threshold: 231250, rate: 0.32 },
          { threshold: 578125, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Jointly": [
          { threshold: 22000, rate: 0.10 },
          { threshold: 89450, rate: 0.12 },
          { threshold: 190750, rate: 0.22 },
          { threshold: 364200, rate: 0.24 },
          { threshold: 462500, rate: 0.32 },
          { threshold: 693750, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Separately": [
            { threshold: 11000, rate: 0.10 },
            { threshold: 44725, rate: 0.12 },
            { threshold: 95375, rate: 0.22 },
            { threshold: 182100, rate: 0.24 },
            { threshold: 231250, rate: 0.32 },
            { threshold: 346875, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        "Head of Household": [
          { threshold: 15700, rate: 0.10 },
          { threshold: 59850, rate: 0.12 },
          { threshold: 95350, rate: 0.22 },
          { threshold: 182100, rate: 0.24 },
          { threshold: 231250, rate: 0.32 },
          { threshold: 578100, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Qualifying Widow(er)": [
            { threshold: 22000, rate: 0.10 },
            { threshold: 89450, rate: 0.12 },
            { threshold: 190750, rate: 0.22 },
            { threshold: 364200, rate: 0.24 },
            { threshold: 462500, rate: 0.32 },
            { threshold: 693750, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ]
      },
      2024: {
        "Single": [
          { threshold: 11600, rate: 0.10 },
          { threshold: 47150, rate: 0.12 },
          { threshold: 100525, rate: 0.22 },
          { threshold: 191950, rate: 0.24 },
          { threshold: 243725, rate: 0.32 },
          { threshold: 609350, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Jointly": [
          { threshold: 23200, rate: 0.10 },
          { threshold: 94300, rate: 0.12 },
          { threshold: 201050, rate: 0.22 },
          { threshold: 383900, rate: 0.24 },
          { threshold: 487450, rate: 0.32 },
          { threshold: 731200, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Separately": [
            { threshold: 11600, rate: 0.10 },
            { threshold: 47150, rate: 0.12 },
            { threshold: 100525, rate: 0.22 },
            { threshold: 191950, rate: 0.24 },
            { threshold: 243725, rate: 0.32 },
            { threshold: 365600, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        "Head of Household": [
          { threshold: 16550, rate: 0.10 },
          { threshold: 63100, rate: 0.12 },
          { threshold: 100500, rate: 0.22 },
          { threshold: 191950, rate: 0.24 },
          { threshold: 243700, rate: 0.32 },
          { threshold: 609350, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Qualifying Widow(er)": [
            { threshold: 23200, rate: 0.10 },
            { threshold: 94300, rate: 0.12 },
            { threshold: 201050, rate: 0.22 },
            { threshold: 383900, rate: 0.24 },
            { threshold: 487450, rate: 0.32 },
            { threshold: 731200, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ]
      },
      2025: {
        "Single": [
          { threshold: 11925, rate: 0.10 },
          { threshold: 48475, rate: 0.12 },
          { threshold: 103350, rate: 0.22 },
          { threshold: 197300, rate: 0.24 },
          { threshold: 250525, rate: 0.32 },
          { threshold: 626350, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Jointly": [
          { threshold: 23850, rate: 0.10 },
          { threshold: 96950, rate: 0.12 },
          { threshold: 206700, rate: 0.22 },
          { threshold: 394600, rate: 0.24 },
          { threshold: 501050, rate: 0.32 },
          { threshold: 751600, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Married Filing Separately": [
            { threshold: 11925, rate: 0.10 },
            { threshold: 48475, rate: 0.12 },
            { threshold: 103350, rate: 0.22 },
            { threshold: 197300, rate: 0.24 },
            { threshold: 250525, rate: 0.32 },
            { threshold: 375800, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        "Head of Household": [
          { threshold: 17000, rate: 0.10 },
          { threshold: 64850, rate: 0.12 },
          { threshold: 103350, rate: 0.22 },
          { threshold: 197300, rate: 0.24 },
          { threshold: 250500, rate: 0.32 },
          { threshold: 626350, rate: 0.35 },
          { threshold: Infinity, rate: 0.37 }
        ],
        "Qualifying Widow(er)": [
            { threshold: 23850, rate: 0.10 },
            { threshold: 96950, rate: 0.12 },
            { threshold: 206700, rate: 0.22 },
            { threshold: 394600, rate: 0.24 },
            { threshold: 501050, rate: 0.32 },
            { threshold: 751600, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ]
      }
    };

const ORDINARY_TAX_BRACKETS = BRACKETS;
  
window.addEventListener('DOMContentLoaded', async () => {
    initCollapsibles();
    initUI();

    const rcField = ensureGlobalRCField();
    // Append it to the document, for example, to the body or a specific container:
    document.body.appendChild(rcField);

  const userPrefersDark = localStorage.getItem('preferred-theme') === 'dark';
  const darkToggleEl = document.getElementById('darkModeToggle');
  if (userPrefersDark && darkToggleEl) {
    darkToggleEl.checked = true;
    document.body.classList.add('dark-mode');
  }

    // ─── NOW wire up your live‑update mapping ───
    mappings
      .filter(m => m.type === 'write')
      .forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          // for text inputs use `input`, for selects use `change`
          const evt = el.tagName === 'SELECT' ? 'change' : 'input';
        //   el.addEventListener(evt, debounce(fetchSheetData));
        }
      });

    // Initialize Child Tax Credit calculation system
    initializeChildTaxCreditSystem();

    // kick‐off one initial recalculation now that data is in place
    updateAllBusinessOwnerResCom(); // fill in each business’s OwnerComp from W‑2s
    updateAggregateResComp();       // sum into the global RC field
    recalculateTotals();            // re‑run your full totals (incl. state & employer FICA)

  });

window.getBrackets        = getBrackets;
window.calculateStateTax  = calculateStateTax;

function initCollapsibles() {
  document.querySelectorAll('h2[data-target], h3[data-target]')
    .forEach(header => {
      const content = document.getElementById(header.dataset.target);
      if (!content) return;

      // start collapsed
      content.style.display = 'none';
      header.style.cursor = 'pointer';

      header.addEventListener('click', () => {
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
      });
    });
}

function initUI() {
  // Back‑to‑top button
  const backBtn = document.getElementById('backToTopBtn');
  backBtn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
  window.addEventListener('scroll', () => {
    backBtn.style.display = window.pageYOffset > 200 ? 'block' : 'none';
  });

  // Dark‑mode toggle
  const dmToggle = document.getElementById('darkModeToggle');
  dmToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', dmToggle.checked);
  });
}

//-------------------------------//
// 1. SUBMIT HANDLER AND RESULTS //
//-------------------------------//

// --- Custom validation so hidden/ collapsed fields don't trigger "not focusable" ---

function isVisible(el) {
  return !!(el && el.offsetParent !== null);
}

// Open any collapsed parents so the browser can focus the field
function expandSectionFor(el) {
  let node = el;
  while (node) {
    if (node.id && node.id.endsWith('Content')) {
      node.style.display = 'block'; // your collapsible uses style.display
    }
    node = node.parentElement;
  }
}

// Validate only what matters (and only if visible)
function validateBeforeSubmit() {
  const problems = [];

  // Core required fields at the top of the form
  const requiredIds = [
    'typeOfAnalysis','firstName','lastName','year','filingStatus','state','residentInState'
  ];
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = (el.value || '').trim();
    if (!v || v === 'please select' || v === 'Please Select') {
      problems.push({ el, msg: 'This field is required.' });
    }
  });

  // W-2: validate selects that actually exist and are visible
  document.querySelectorAll("select[id^='w2IsClientBusiness_']").forEach(sel => {
    if (isVisible(sel) && !sel.value) {
      problems.push({ el: sel, msg: 'Please choose Yes or No.' });
    }
  });
  // MFJ: “Whose W-2 is this?” if present
  document.querySelectorAll("select[id^='w2WhoseW2_']").forEach(sel => {
    if (isVisible(sel) && !sel.value) {
      problems.push({ el: sel, msg: 'Please select whose W-2 this is.' });
    }
  });

  // Payments: if user left it blank, treat as 0 rather than blocking submit
  const est = document.getElementById('estimatedTaxPayments');
  if (est && !est.value.trim()) est.value = '0';

  if (problems.length) {
    problems.forEach(p => expandSectionFor(p.el)); // open sections
    problems[0].el.focus();
    alert('Please complete the highlighted required fields.');
    return false;
  }
  return true;
}

document.getElementById('taxForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!validateBeforeSubmit()) return;

  // Build the Excel writes from the mapping table (base column 'B' is assumed).
  function toNumberMaybe(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    // currency like $1,234 or (1,234)
    const neg = /^\s*\(.*\)\s*$/.test(v);
    const cleaned = String(v).replace(/[^0-9.]/g, '');
    if (cleaned === '') return 0;
    const n = Number(cleaned);
    return neg ? -n : n;
  }

  const writes = [];
  (window.mappingsTotal || []).forEach(m => {
    if (m.type !== 'write') return;
    const el = document.getElementById(m.id);
    if (!el) return;

    let raw = el.value;

    if (raw == null || raw === '' || raw === 'please select' || raw === 'Please Select') {
      return; // skip empties
    }

    // Normalizations that match your sheet’s expectations
    if (m.id === 'state') {
      raw = `${raw} Taxes`;
    } else if (m.id === 'blind') {
      const map = { 'Zero': 0, 'One': 1, 'Two': 2, '0': 0, '1': 1, '2': 2 };
      raw = (Object.prototype.hasOwnProperty.call(map, raw) ? map[raw] : 0);
    } else if (typeof raw === 'string' && /[$,()]/.test(raw)) {
      raw = toNumberMaybe(raw);
    } else if (!isNaN(+raw)) {
      raw = +raw;
    }

    writes.push({ cell: m.cell, value: raw });
  });

  // Optionally inject a few important computed fields if present in your UI
  const childCreditEl = document.getElementById('childTaxCredit');
  if (childCreditEl && childCreditEl.value) {
    writes.push({ cell: 'B90', value: toNumberMaybe(childCreditEl.value) });
  }
  const fedTaxEl = document.getElementById('totalFederalTax');
  if (fedTaxEl && fedTaxEl.value) {
    writes.push({ cell: 'B93', value: toNumberMaybe(fedTaxEl.value) });
  }
  const totalTaxEl = document.getElementById('totalTax');
  if (totalTaxEl && totalTaxEl.value) {
    writes.push({ cell: 'B147', value: toNumberMaybe(totalTaxEl.value) });
  }

  // Resolve year and analysis label
  const yearSel = document.getElementById('year');
  const typeSel = document.getElementById('typeOfAnalysis');
  const year = parseInt(yearSel?.value || '0', 10);
  const analysisType = (typeSel?.value || '').trim();

  const resultsDiv = document.getElementById('results');
  resultsDiv.classList.remove('hidden');
  resultsDiv.innerHTML = '<p>Saving to Excel…</p>';

  try {
    const resp = await fetch('/api/submitRunLocal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, analysisType, writes })
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(t || 'Submit failed');
    }
    const info = await resp.json();
    resultsDiv.innerHTML =
      `<p><strong>Saved:</strong> wrote ${analysisType} ${year} into column <b>${info.column}</b> on <b>${info.worksheet}</b> of <code>${info.filePath}</code> (header row 24).` +
      ` Change inputs and submit again for a new year/type to fill the next column.</p>`;
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<p class="red-disclaimer">Excel save failed: ${err.message || err}</p>`;
  }

  // Keep your existing Python call if you need it (optional; errors ignored)
  try {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    for (let key in data) {
      if (!isNaN(data[key]) && data[key].trim() !== '') {
        data[key] = parseFloat(data[key].replace(/[^0-9.-]/g, ''));
      }
    }
    const response = await fetch('http://127.0.0.1:5000/process-tax-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const resultData = await response.json();
      displayResults(resultData);
    }
  } catch (ign) {
    // ignore; this call is optional
  }
});

function displayResults(resultData) {
    const resultsDiv = document.getElementById('results');

    // first update the form’s Taxable Income and re‑calc state tax
    document.getElementById('taxableIncome').value = parseInt(resultData.taxableIncome, 10);

    const fedTax = parseInt(resultData.totalTax, 10);

    // use the server‑returned state income tax directly
    const stateTax = parseInt(resultData.stateTotalTax, 10) || 0;

    const totalTax = fedTax + stateTax;
    let refundOrDue = parseInt(resultData.refundOrDue, 10);
    if (isNaN(refundOrDue)) {
      // sum up every “Federal Income Tax Withheld” from the W-2 blocks
      const withholdings = Array.from(
        document.querySelectorAll("input[id^='w2FederalTaxWithheld_']")
      ).reduce((sum, fld) => sum + unformatCurrency(fld.value), 0);

      refundOrDue = totalTax - withholdings;
    }
    resultsDiv.innerHTML = `
      <h2>Your Tax Results</h2>
      <p><strong>Taxable Income:</strong> $${parseInt(resultData.taxableIncome, 10)}</p>
      <p><strong>Federal Tax Owed:</strong> $${fedTax}</p>
      <p><strong>State Tax Owed:</strong> $${stateTax}</p>
      <p><strong>Total Tax Owed:</strong> $${totalTax}</p>
      <p><strong>Refund or Amount Due:</strong> $${refundOrDue}</p>
    `;
}

//-----------------------//
// 1.1. Global Variables //
//-----------------------//

let userManuallyChanged65Plus = false;
let dependentBizMap = {};
let dependentsStore = {};
let lastManualAdjustment = {};
let w2Counter = 0;
let businessCounter = 0;
let businessUniqueId = 1;
let w2WageMap = {};

window.blurredIncome = {};
window.blurredExpenses = {};

//-------------------------------------------//
// 2. "BACK TO TOP" BUTTON AND WINDOW SCROLL //
//-------------------------------------------//

window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
} 

document.getElementById('backToTopBtn').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// window.addEventListener('beforeunload', function (e) {
//     e.preventDefault();
//     e.returnValue = '';
// });

//-----------------------------//
// 3. SPOUSE SECTION ANIMATION //
//-----------------------------//

document.getElementById('filingStatus').addEventListener('change', function() {
    const spouseSection = document.getElementById('spouseSection');
    if (this.value === 'Married Filing Jointly' || this.value === 'Married Filing Separately') {
        showElement(spouseSection);
    } else {
        hideElement(spouseSection);
    }

    // Update the blind dropdown options based on the new filing status
    updateBlindOptions();

    // Also update the "How many 65 or older:" dropdown options
    updateOlderThan65Options();
    
    // Recalculate Child Tax Credit when filing status changes (affects phase-out thresholds)
    recalculateChildTaxCredit();
});

function showElement(element) {
    element.style.display = 'block';
    element.style.maxHeight = element.scrollHeight + 'px';
    element.style.transition = 'max-height 1s ease-in-out';
}

function hideElement(element) {
    element.style.maxHeight = '0';
    element.style.transition = 'max-height 1s ease-in-out';
    setTimeout(() => {
        element.style.display = 'none';
        element.style.backgroundColor = '';
    }, 500);
}

//-----------------------//
// 3.1. HELPER FUNCTIONS //
//-----------------------//

function updateBlindOptions() {
    const filingStatus = document.getElementById('filingStatus').value;
    const blindSelect = document.getElementById('blind');
    
    // Clear all existing options
    blindSelect.innerHTML = '';

    // Create and append the "Please Select" option
    let option = document.createElement('option');
    option.value = 'please select';
    option.textContent = 'Please Select';
    option.disabled = true;
    option.selected = true;
    blindSelect.appendChild(option);

    // Always add option for 0 (displayed as "0" with value "Zero")
    option = document.createElement('option');
    option.value = 'Zero';
    option.textContent = '0';
    blindSelect.appendChild(option);

    // Always add option for 1 (displayed as "1" with value "One")
    option = document.createElement('option');
    option.value = 'One';
    option.textContent = '1';
    blindSelect.appendChild(option);

    // If filing status is "Married Filing Jointly", add option for 2 (value "Two")
    if (filingStatus === 'Married Filing Jointly') {
        option = document.createElement('option');
        option.value = 'Two';
        option.textContent = '2';
        blindSelect.appendChild(option);
    }
}

function updateOlderThan65Options() {
    const filingStatus = document.getElementById('filingStatus').value;
    const olderSelect = document.getElementById('olderthan65');
    
    // Clear all existing options
    olderSelect.innerHTML = '';

    // Create and append the "Please Select" option
    let option = document.createElement('option');
    option.value = 'Please Select';
    option.textContent = 'Please Select';
    option.disabled = true;
    option.selected = true;
    olderSelect.appendChild(option);

    // Always add option for 0
    option = document.createElement('option');
    option.value = '0';
    option.textContent = '0';
    olderSelect.appendChild(option);

    // Always add option for 1
    option = document.createElement('option');
    option.value = '1';
    option.textContent = '1';
    olderSelect.appendChild(option);

    // If filing status is "Married Filing Jointly", add option for 2
    if (filingStatus === 'Married Filing Jointly') {
        option = document.createElement('option');
        option.value = '2';
        option.textContent = '2';
        olderSelect.appendChild(option);
    }
}

function expandParents(element) {
    let parent = element.parentElement;
    while (parent) {
      if ((parent.classList.contains('collapsible') || parent.classList.contains('collapsible-content')) &&
           !parent.classList.contains('active')) {
        parent.classList.add('active');
      }
      parent = parent.parentElement;
    }
}
 
// Helper: Given a businessIndex and ownerIndex, find the first W‑2 block
// that contributed wage to that owner. (It checks the global w2WageMap.)
function scrollToW2Block(businessIndex, ownerIndex) {
    // 1. Expand the main Income section if it’s collapsed
    const incomeContent = document.getElementById('incomeContent');
    if (incomeContent && !incomeContent.classList.contains('active')) {
      incomeContent.classList.add('active');
    }
  
    // 2. Expand the W‑2 section container if it’s collapsed
    const w2sContainer = document.getElementById('w2sContainer');
    if (w2sContainer && !w2sContainer.classList.contains('active')) {
      w2sContainer.classList.add('active');
    }
  
    // 3. Get the owner name (in lowercase for a case-insensitive match)
    const ownerSelect = document.getElementById(`business${businessIndex}OwnerName${ownerIndex}`);
    if (!ownerSelect) {
      return;
    }
    const ownerName = ownerSelect.value.trim().toLowerCase();
    if (!ownerName) {
      return;
    }
  
    // 4. Loop over w2WageMap to find a matching W‑2 block
    let found = false;
    for (let key in w2WageMap) {
      if (w2WageMap.hasOwnProperty(key)) {
        const mapping = w2WageMap[key];
        // Compare business index and do a case-insensitive check for the client name
        if (mapping.businessIndex === businessIndex &&
            mapping.client.trim().toLowerCase() === ownerName) {
          const w2Block = document.getElementById(key);
          if (w2Block) {
            // 5. Expand the specific W‑2 block’s content if needed
            const collapsibleContent = w2Block.querySelector('.collapsible-content');
            if (collapsibleContent && !collapsibleContent.classList.contains('active')) {
              collapsibleContent.classList.add('active');
              // Force reflow so that the change is registered
              void collapsibleContent.offsetHeight;
            }
            // 6. Wait a bit for expansion to render, then scroll into view
            setTimeout(() => {
              w2Block.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
            found = true;
            break;
          }
        }
      }
    }
    // 7. Fallback if no matching block was found.
    if (!found && w2sContainer) {
      w2sContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function createResCompSection(businessIndex, ownerIndex, isOtherOwner = false) {
    const container = document.createElement('div');
    container.classList.add('res-comp-section');
    container.style.marginTop = '15px';
    container.style.marginBottom = '5px';

    const label = document.createElement('label');
    label.textContent = 'Reasonable Compensation:';
    container.appendChild(label);

    const compInput = document.createElement('input');
    compInput.type = 'text';
    compInput.id = `business${businessIndex}OwnerComp${ownerIndex}`;
    compInput.name = `business${businessIndex}OwnerComp${ownerIndex}`;
    compInput.value = "0";
    // Store the default value in a data attribute
    compInput.dataset.defaultValue = compInput.value;
    // If not an "Other" owner, lock the field by default.
    compInput.readOnly = !isOtherOwner;
    container.appendChild(compInput);

    if (!isOtherOwner) {
        const btnContainer = document.createElement('div');
        btnContainer.classList.add('res-comp-btn-container');

        const overrideBtn = document.createElement('button');
        overrideBtn.type = 'button';
        overrideBtn.classList.add('res-comp-btn');
        overrideBtn.textContent = 'Override';
        // Track override state in a data attribute.
        overrideBtn.dataset.overrideActive = 'false';

        overrideBtn.addEventListener('click', function() {
            const isActive = overrideBtn.dataset.overrideActive === 'true';
            if (!isActive) {
            // Activate override: enable editing and change button style.
            overrideBtn.dataset.overrideActive = 'true';
            compInput.readOnly = false;
            overrideBtn.style.backgroundColor = 'var(--accent-hover)';
                // (The updateBusinessOwnerResCom function will keep the data attribute updated.)
            } else {
                // Deactivate override: revert value to the stored default and lock the field.
                overrideBtn.dataset.overrideActive = 'false';
                compInput.readOnly = true;
                compInput.value = compInput.dataset.defaultValue;
                overrideBtn.style.backgroundColor = '';
            }
        });
        btnContainer.appendChild(overrideBtn);

        const scrollBtn = document.createElement('button');
        scrollBtn.type = 'button';
        scrollBtn.classList.add('res-comp-btn');
        scrollBtn.textContent = '⇧';
        scrollBtn.addEventListener('click', function() {
            scrollToW2Block(businessIndex, ownerIndex);
        });
        btnContainer.appendChild(scrollBtn);

        container.appendChild(btnContainer);
    }

    return container;
}

function updateRCSectionForOwner(businessIndex, ownerIndex, isOther) {
    const rcSection = document.getElementById(`rcSection_${businessIndex}_${ownerIndex}`);
    if (!rcSection) return;
    const compInput = rcSection.querySelector('input');
    if (!compInput) return;
    if (isOther) {
        compInput.readOnly = false;
        const btnContainer = rcSection.querySelector('.res-comp-btn-container');
        if (btnContainer) {
            btnContainer.remove();
        }
    }
    // (If you wish to re-add buttons when not Other, add that logic here.)
}

function ensureGlobalRCField() {
    let rcField = document.getElementById('reasonableCompensation');
    if (!rcField) {
      rcField = document.createElement('input');
      rcField.type = 'hidden'; // This makes it not visible.
      rcField.id = 'reasonableCompensation';
      rcField.name = 'reasonableCompensation';
    }
    return rcField;
}

function updateAggregateResComp() {
    let totalRC = 0;
    const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    for (let i = 1; i <= numBusinesses; i++) {
        const numOwnersSelect = document.getElementById(`numOwnersSelect${i}`);
        if (numOwnersSelect) {
            const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
            for (let j = 1; j <= numOwners; j++) {
                const compField = document.getElementById(`business${i}OwnerComp${j}`);
                if (compField) {
                    let compVal = unformatCurrency(compField.value);
                    totalRC += compVal;
                }
            }
        }
    }
    const rcField = document.getElementById('reasonableCompensation');
    if (rcField) {
        rcField.value = formatCurrency(String(totalRC));
    }
}

function getStateTaxKey(stateAbbrev) {
    // Map state abbreviations to the full key used in your tax mapping.
    const stateMapping = {
      "AL": "Alabama Taxes",
      "AK": "Alaska Taxes",
      "AZ": "Arizona Taxes",
      "AR": "Arkansas Taxes",
      "CA": "California Taxes",
      "CO": "Colorado Taxes",
      "CT": "Connecticut Taxes",
      "DE": "Delaware Taxes",
      "FL": "Florida Taxes",
      "GA": "Georgia Taxes",
      "HI": "Hawaii Taxes",
      "ID": "Idaho Taxes",
      "IL": "Illinois Taxes",
      "IN": "Indiana Taxes",
      "IA": "Iowa Taxes",
      "KS": "Kansas Taxes",
      "KY": "Kentucky Taxes",
      "LA": "Louisiana Taxes",
      "ME": "Maine Taxes",
      "MD": "Maryland Taxes",
      "MA": "Massachusetts Taxes",
      "MI": "Michigan Taxes",
      "MN": "Minnesota Taxes",
      "MS": "Mississippi Taxes",
      "MO": "Missouri Taxes",
      "MT": "Montana Taxes",
      "NE": "Nebraska Taxes",
      "NV": "Nevada Taxes",
      "NH": "New Hampshire Taxes",
      "NJ": "New Jersey Taxes",
      "NM": "New Mexico Taxes",
      "NY": "New York Taxes",
      "NC": "North Carolina Taxes",
      "ND": "North Dakota Taxes",
      "OH": "Ohio Taxes",
      "OK": "Oklahoma Taxes",
      "OR": "Oregon Taxes",
      "PA": "Pennsylvania Taxes",
      "RI": "Rhode Island Taxes",
      "SC": "South Carolina Taxes",
      "SD": "South Dakota Taxes",
      "TN": "Tennessee Taxes",
      "TX": "Texas Taxes",
      "UT": "Utah Taxes",
      "VT": "Vermont Taxes",
      "VA": "Virginia Taxes",
      "WA": "Washington Taxes",
      "DC": "District of Columbia Taxes", // if applicable
      "WV": "West Virginia Taxes",
      "WI": "Wisconsin Taxes",
      "WY": "Wyoming Taxes"
    };
    return stateMapping[stateAbbrev] || "";
}

/**
 * @typedef {Object} WageMapping
 * @property {number} wage
 * @property {number} medicareWages
 * @property {boolean} isBusinessRelated
 * @property {number} unemploymentTax
 * @property {number} [futaValue]
 * @property {number} [unemploymentValue]
*/

function validateW2StateBreakdownSum(w2Id) {
    let sum = 0;
    for (let i = 1; i <= 4; i++) {
      const amtEl = document.getElementById(`w2StateBreakdownAmount_${w2Id}_${i}`);
      if (amtEl) {
        const amt = unformatCurrency(amtEl.value || "0");
        sum += amt;
      }
    }
    const wagesEl = document.getElementById(`w2Wages_${w2Id}`);
    const wagesVal = wagesEl ? unformatCurrency(wagesEl.value || "0") : 0;
    const errorEl = document.getElementById(`w2StateBreakdownError_${w2Id}`);
    if (Math.abs(sum - wagesVal) > 1) {
      errorEl.textContent = "The sum of the state breakdown amounts (" + formatCurrency(String(sum)) + ") does not match Wages, Salaries, Tips, and Other Compensation (" + formatCurrency(String(wagesVal)) + ").";
    } else {
      errorEl.textContent = "";
    }
}

function updateStateBreakdownDropdowns(w2Id) {
    // Select all dropdowns in the state breakdown section for this W-2 block
    const dropdowns = document.querySelectorAll(`[id^="w2StateBreakdownDropdown_${w2Id}_"]`);
    
    // Gather all current selections (non-empty)
    let selectedStates = Array.from(dropdowns).map(dd => dd.value).filter(val => val !== "");
    
    // For each dropdown, repopulate its options based on STATES_ARRAY and other selections
    dropdowns.forEach(dd => {
      const currentValue = dd.value; // may be "" if not selected
      dd.innerHTML = "";
      // Add default option first:
      const defaultOpt = document.createElement('option');
      defaultOpt.value = "";
      defaultOpt.textContent = "Please Select";
      defaultOpt.disabled = true;
      defaultOpt.selected = (currentValue === "");
      dd.appendChild(defaultOpt);
      
      STATES_ARRAY.forEach(function(optData) {
        // Skip a state if it's selected in another dropdown and is not the current value.
        if (optData.value !== "" && selectedStates.includes(optData.value) && optData.value !== currentValue) {
          return;
        }
        const opt = document.createElement('option');
        opt.value = optData.value;
        opt.textContent = optData.text;
        if (optData.value === currentValue) {
          opt.selected = true;
        }
        dd.appendChild(opt);
      });
    });
}  

const STATES_ARRAY = [
    { value: "", text: "Please Select" },
    { value: "AL", text: "Alabama" },
    { value: "AK", text: "Alaska" },
    { value: "AZ", text: "Arizona" },
    { value: "AR", text: "Arkansas" },
    { value: "CA", text: "California" },
    { value: "CO", text: "Colorado" },
    { value: "CT", text: "Connecticut" },
    { value: "DE", text: "Delaware" },
    { value: "FL", text: "Florida" },
    { value: "GA", text: "Georgia" },
    { value: "HI", text: "Hawaii" },
    { value: "ID", text: "Idaho" },
    { value: "IL", text: "Illinois" },
    { value: "IN", text: "Indiana" },
    { value: "IA", text: "Iowa" },
    { value: "KS", text: "Kansas" },
    { value: "KY", text: "Kentucky" },
    { value: "LA", text: "Louisiana" },
    { value: "ME", text: "Maine" },
    { value: "MD", text: "Maryland" },
    { value: "MA", text: "Massachusetts" },
    { value: "MI", text: "Michigan" },
    { value: "MN", text: "Minnesota" },
    { value: "MS", text: "Mississippi" },
    { value: "MO", text: "Missouri" },
    { value: "MT", text: "Montana" },
    { value: "NE", text: "Nebraska" },
    { value: "NV", text: "Nevada" },
    { value: "NH", text: "New Hampshire" },
    { value: "NJ", text: "New Jersey" },
    { value: "NM", text: "New Mexico" },
    { value: "NY", text: "New York" },
    { value: "NC", text: "North Carolina" },
    { value: "ND", text: "North Dakota" },
    { value: "OH", text: "Ohio" },
    { value: "OK", text: "Oklahoma" },
    { value: "OR", text: "Oregon" },
    { value: "PA", text: "Pennsylvania" },
    { value: "RI", text: "Rhode Island" },
    { value: "SC", text: "South Carolina" },
    { value: "SD", text: "South Dakota" },
    { value: "TN", text: "Tennessee" },
    { value: "TX", text: "Texas" },
    { value: "UT", text: "Utah" },
    { value: "VT", text: "Vermont" },
    { value: "VA", text: "Virginia" },
    { value: "WA", text: "Washington" },
    { value: "DC", text: "Washington D.C." },
    { value: "WV", text: "West Virginia" },
    { value: "WI", text: "Wisconsin" },
    { value: "WY", text: "Wyoming" }
];  

// ===== DEBUG HELPERS =====
window.DEBUG_TAX = window.DEBUG_TAX ?? (localStorage.DEBUG_TAX === '1'); // toggle in console: localStorage.DEBUG_TAX='1'
function D(msg, ...args) {
  if (!window.DEBUG_TAX) return;
  console.debug(`[STATE/UI] ${msg}`, ...args);
}

function updateTotalStateTax() {
  // Base = Outlier "Total:" if present, otherwise fall back to stateTaxesDue (normal states)
  const outlierTotalEl = document.getElementById('state_total');
  const baseStateTax = outlierTotalEl
    ? unformatCurrency(outlierTotalEl.value || '0') // outlier "Total:"
    : getFieldValue('stateTaxesDue');                // normal states

  // Add Local tax after credits
  const localTax = getFieldValue('localTaxAfterCredits');

  // This is the amount of state tax before payments/interest/penalty
  const totalStateTax = baseStateTax + localTax;

  // Payments and adjustments
  const withholdings       = getFieldValue('stateWithholdings');
  const paymentsAndCredits = getFieldValue('statePaymentsAndCredits');
  const interest           = getFieldValue('stateInterest'); // adds to amount owed
  const penalty            = getFieldValue('statePenalty');  // adds to amount owed

  // Totals
  const totalPaid  = withholdings + paymentsAndCredits;
  const amountOwed = totalStateTax + interest + penalty;

  // Split into refund vs balance due
  const overpayment = Math.max(0, totalPaid - amountOwed);        // "Estimated Refund (Overpayment)"
  const balanceDue  = Math.max(0, amountOwed - totalPaid);        // "Estimated Balance Due"

  // Write back to the DOM
  const totalStateTaxField = document.getElementById('totalStateTax');
  if (totalStateTaxField) totalStateTaxField.value = formatCurrency(String(totalStateTax));

  const refundField = document.getElementById('stateEstimatedRefundOverpayment');
  if (refundField) refundField.value = formatCurrency(String(overpayment));

  const balanceDueField = document.getElementById('stateEstimatedBalanceDue');
  if (balanceDueField) balanceDueField.value = formatCurrency(String(balanceDue));
}


['stateWithholdings','statePaymentsAndCredits','stateInterest','statePenalty']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateTotalStateTax();
      });
    }
  });

//-------------------------------------//
// CHILD TAX CREDIT CONSTANTS & RULES //
//-------------------------------------//

/**
 * CHILD TAX CREDIT IMPLEMENTATION
 * ================================
 * 
 * This implementation provides full compliance with IRS Child Tax Credit and Credit for Other 
 * Dependents rules as specified in IRC Section 24 and IRS Publication 972.
 * 
 * FEATURES IMPLEMENTED:
 * 
 * 1. AUTOMATIC CALCULATION
 *    - Calculates credits based on dependent information entered in the form
 *    - Updates automatically when AGI, filing status, or dependent info changes
 *    - Integrates seamlessly with existing tax calculation workflow
 * 
 * 2. FULL IRS COMPLIANCE
 *    - Child Tax Credit: $2,000 per qualifying child under 17 (IRC Sec 24(a))
 *    - Other Dependent Credit: $500 per qualifying dependent 17+ (IRC Sec 24(h))
 *    - Correct phase-out calculations based on AGI and filing status
 *    - Phase-out rate: $50 per $1,000 (or fraction) of excess AGI
 * 
 * 3. PHASE-OUT THRESHOLDS (2022-2025):
 *    - Single: $200,000
 *    - Married Filing Jointly: $400,000
 *    - Married Filing Separately: $200,000
 *    - Head of Household: $200,000
 *    - Qualifying Widow(er): $400,000
 * 
 * 4. INTELLIGENT AGE DETECTION
 *    - Supports exact age input, birthdate calculation, and age ranges
 *    - Automatically determines CTC vs CTOD eligibility based on age
 *    - Handles edge cases and missing data gracefully
 * 
 * 5. USER EXPERIENCE ENHANCEMENTS
 *    - Real-time calculation with detailed explanations
 *    - Tooltip showing full calculation breakdown
 *    - Visual feedback in form with calculation details
 *    - Read-only field prevents manual override (ensures accuracy)
 * 
 * 6. SCALABILITY & MAINTAINABILITY
 *    - Configuration-driven design supports easy updates for new tax years
 *    - Comprehensive error handling and input validation
 *    - Built-in testing and validation functions
 *    - Extensive logging for debugging and audit trails
 * 
 * TECHNICAL ARCHITECTURE:
 * 
 * 1. Configuration Object (CHILD_TAX_CREDIT_CONFIG)
 *    - Year-specific credit amounts and thresholds
 *    - Easy to update for new tax years
 *    - Supports different rules across years
 * 
 * 2. Core Calculation Function (calculateChildTaxCredit)
 *    - Pure function with comprehensive input validation
 *    - Returns detailed calculation breakdown
 *    - Handles all edge cases and error conditions
 * 
 * 3. Integration Functions
 *    - recalculateChildTaxCredit: Updates form fields and triggers recalculation
 *    - countQualifyingDependents: Analyzes form data to count eligible dependents
 *    - getDependentAge: Smart age detection from multiple input sources
 * 
 * 4. Event Handling System
 *    - Automatic recalculation when relevant fields change
 *    - Debounced updates to prevent excessive recalculation
 *    - Integration with existing form validation workflow
 * 
 * COMPLIANCE NOTES:
 * 
 * - This implementation does NOT handle the Additional Child Tax Credit (refundable portion)
 *   which requires Form 8812 calculations involving earned income and tax liability
 * - Qualifying child tests (relationship, age, residency, support) are assumed to be
 *   satisfied if user marks dependent as qualifying for credit
 * - For production use, consider adding validation prompts for qualifying dependent tests
 * 
 * TESTING & VALIDATION:
 * 
 * - Built-in test cases validate calculation logic against known scenarios
 * - Export function allows external validation and testing
 * - Comprehensive error handling ensures graceful degradation
 * - Console logging provides audit trail for calculations
 * 
 * FUTURE ENHANCEMENTS:
 * 
 * - Additional Child Tax Credit (Form 8812) calculation
 * - Enhanced dependent qualification validation
 * - Multi-year comparison and planning features
 * - Integration with state-specific dependent credits
 * 
 * @author Genwealth 360 Inc.
 * @version 1.0.0
 * @since 2025
 * @compliance IRS Publication 972, IRC Section 24, Form 8812
 */

/**
 * IRS Child Tax Credit and Credit for Other Dependents Configuration
 * Updated for current tax years with proper phase-out rules
 * 
 * COMPLIANCE NOTES:
 * - Child Tax Credit: IRC Section 24 - Up to $2,000 per qualifying child under 17
 * - Credit for Other Dependents: IRC Section 24(h) - Up to $500 per qualifying dependent
 * - Phase-out rules: Based on AGI thresholds varying by filing status
 * - Phase-out rate: $50 reduction per $1,000 (or fraction thereof) of AGI above threshold
 * 
 * IMPORTANT: This implementation follows IRS Publication 972 and Form 8812 instructions.
 * For refundable portion calculations (Additional Child Tax Credit), refer to Form 8812.
 */
const CHILD_TAX_CREDIT_CONFIG = {
    2022: {
        // Maximum credit amounts
        CHILD_CREDIT_AMOUNT: 2000,          // Per qualifying child under 17
        OTHER_DEPENDENT_CREDIT_AMOUNT: 500, // Per other qualifying dependent
        
        // AGI phase-out thresholds by filing status
        PHASE_OUT_THRESHOLD: {
            "Single": 200000,
            "Married Filing Jointly": 400000,
            "Married Filing Separately": 200000,
            "Head of Household": 200000,
            "Qualifying Widow(er)": 400000
        },
        
        // Phase-out rate: $50 reduction per $1,000 of AGI above threshold
        PHASE_OUT_RATE: 50,      // Dollars reduced per $1,000 over threshold
        PHASE_OUT_INCREMENT: 1000 // Income increment for phase-out calculation
    },
    
    2023: {
        CHILD_CREDIT_AMOUNT: 2000,
        OTHER_DEPENDENT_CREDIT_AMOUNT: 500,
        PHASE_OUT_THRESHOLD: {
            "Single": 200000,
            "Married Filing Jointly": 400000,
            "Married Filing Separately": 200000,
            "Head of Household": 200000,
            "Qualifying Widow(er)": 400000
        },
        PHASE_OUT_RATE: 50,
        PHASE_OUT_INCREMENT: 1000
    },
    
    2024: {
        CHILD_CREDIT_AMOUNT: 2000,
        OTHER_DEPENDENT_CREDIT_AMOUNT: 500,
        PHASE_OUT_THRESHOLD: {
            "Single": 200000,
            "Married Filing Jointly": 400000,
            "Married Filing Separately": 200000,
            "Head of Household": 200000,
            "Qualifying Widow(er)": 400000
        },
        PHASE_OUT_RATE: 50,
        PHASE_OUT_INCREMENT: 1000
    },
    
    2025: {
        // Projected values - may need updates when IRS releases official amounts
        CHILD_CREDIT_AMOUNT: 2000,
        OTHER_DEPENDENT_CREDIT_AMOUNT: 500,
        PHASE_OUT_THRESHOLD: {
            "Single": 200000,
            "Married Filing Jointly": 400000,
            "Married Filing Separately": 200000,
            "Head of Household": 200000,
            "Qualifying Widow(er)": 400000
        },
        PHASE_OUT_RATE: 50,
        PHASE_OUT_INCREMENT: 1000
    }
};

/**
 * Calculate Child Tax Credit and Credit for Other Dependents
 * Following IRS Publication 972 and Form 8812 rules
 * 
 * @param {number} adjustedGrossIncome - AGI from Form 1040
 * @param {string} filingStatus - Filing status
 * @param {number} taxYear - Tax year for calculation
 * @returns {Object} Credit calculation results
 */
function calculateChildTaxCredit(adjustedGrossIncome, filingStatus, taxYear) {
    
    // Input validation
    if (typeof adjustedGrossIncome !== 'number' || adjustedGrossIncome < 0) {
        console.warn('Invalid AGI provided for Child Tax Credit calculation:', adjustedGrossIncome);
        adjustedGrossIncome = 0;
    }
    
    if (!filingStatus || typeof filingStatus !== 'string') {
        console.warn('Invalid filing status provided for Child Tax Credit calculation:', filingStatus);
        return {
            childTaxCredit: 0,
            otherDependentCredit: 0,
            totalCredit: 0,
            qualifyingChildren: 0,
            otherDependents: 0,
            phaseOutReduction: 0,
            details: 'Invalid filing status provided'
        };
    }
    
    // Get configuration for the tax year
    const config = CHILD_TAX_CREDIT_CONFIG[taxYear];
    if (!config) {
        console.warn(`Child Tax Credit configuration not found for year ${taxYear}`);
        return {
            childTaxCredit: 0,
            otherDependentCredit: 0,
            totalCredit: 0,
            qualifyingChildren: 0,
            otherDependents: 0,
            phaseOutReduction: 0,
            details: `Configuration not available for tax year ${taxYear}`
        };
    }
    
    // Count qualifying dependents by analyzing form data
    const dependentCounts = countQualifyingDependents();
    
    // Calculate base credit amounts
    const baseChildCredit = dependentCounts.qualifyingChildren * config.CHILD_CREDIT_AMOUNT;
    const baseOtherCredit = dependentCounts.otherDependents * config.OTHER_DEPENDENT_CREDIT_AMOUNT;
    const totalBaseCredit = baseChildCredit + baseOtherCredit;
    
    // No credits if no qualifying dependents
    if (totalBaseCredit === 0) {
        return {
            childTaxCredit: 0,
            otherDependentCredit: 0,
            totalCredit: 0,
            qualifyingChildren: dependentCounts.qualifyingChildren,
            otherDependents: dependentCounts.otherDependents,
            phaseOutReduction: 0,
            details: 'No qualifying dependents found'
        };
    }
    
    // Apply income-based phase-out
    const phaseOutThreshold = config.PHASE_OUT_THRESHOLD[filingStatus] || config.PHASE_OUT_THRESHOLD["Single"];
    let phaseOutReduction = 0;
    
    if (adjustedGrossIncome > phaseOutThreshold) {
        const excessIncome = adjustedGrossIncome - phaseOutThreshold;
        const phaseOutIncrements = Math.ceil(excessIncome / config.PHASE_OUT_INCREMENT);
        phaseOutReduction = phaseOutIncrements * config.PHASE_OUT_RATE;
        
        // Phase-out cannot exceed total credit
        phaseOutReduction = Math.min(phaseOutReduction, totalBaseCredit);
    }
    
    // Calculate final credit amounts
    const finalTotalCredit = Math.max(0, totalBaseCredit - phaseOutReduction);
    
    // Allocate reduction proportionally between child and other dependent credits
    let finalChildCredit = baseChildCredit;
    let finalOtherCredit = baseOtherCredit;
    
    if (phaseOutReduction > 0 && totalBaseCredit > 0) {
        const reductionRatio = phaseOutReduction / totalBaseCredit;
        finalChildCredit = Math.max(0, baseChildCredit - (baseChildCredit * reductionRatio));
        finalOtherCredit = Math.max(0, baseOtherCredit - (baseOtherCredit * reductionRatio));
    }
    
    return {
        childTaxCredit: Math.round(finalChildCredit),
        otherDependentCredit: Math.round(finalOtherCredit),
        totalCredit: Math.round(finalTotalCredit),
        qualifyingChildren: dependentCounts.qualifyingChildren,
        otherDependents: dependentCounts.otherDependents,
        phaseOutReduction: Math.round(phaseOutReduction),
        details: generateCreditCalculationDetails(dependentCounts, config, phaseOutThreshold, adjustedGrossIncome, phaseOutReduction)
    };
}

/**
 * Count qualifying dependents based on current form data
 * Implements IRS rules for Child Tax Credit qualification
 * 
 * @returns {Object} Count of qualifying children and other dependents
 */
function countQualifyingDependents() {
    const numDependents = parseInt(document.getElementById('numberOfDependents')?.value || '0', 10);
    let qualifyingChildren = 0;
    let otherDependents = 0;
    
    for (let i = 1; i <= numDependents; i++) {
        // Check if dependent qualifies for any credit
        const creditQualification = document.getElementById(`dependent${i}Credit`)?.value;
        if (creditQualification !== 'Yes') {
            continue; // Skip if doesn't qualify for credit
        }
        
        // Determine age for qualification rules
        const age = getDependentAge(i);
        if (age === null) {
            continue; // Skip if age cannot be determined
        }
        
        // IRS Rule: Child Tax Credit for children under 17 at end of tax year
        if (age < 17) {
            qualifyingChildren++;
        } 
        // IRS Rule: Credit for Other Dependents for those 17 and older
        else {
            otherDependents++;
        }
    }
    
    return { qualifyingChildren, otherDependents };
}

/**
 * Get dependent's age from form data
 * Handles both exact age input and age range selections
 * 
 * @param {number} dependentIndex - Index of the dependent
 * @returns {number|null} Age of dependent or null if cannot be determined
 */
function getDependentAge(dependentIndex) {
    // Try to get exact age first
    const ageField = document.getElementById(`dependent${dependentIndex}Age`);
    if (ageField && ageField.value) {
        const age = parseInt(ageField.value, 10);
        if (!isNaN(age) && age >= 0) {
            return age;
        }
    }
    
    // Fall back to age range if exact age not available
    const ageRangeField = document.getElementById(`dependent${dependentIndex}AgeRange`);
    if (ageRangeField && ageRangeField.value) {
        // Map age ranges to representative ages for qualification purposes
        switch (ageRangeField.value) {
            case '17 or younger':
                return 16; // Assume under 17 for CTC qualification
            case '18 or older':
                return 18; // Qualifies for Other Dependent Credit only
            default:
                return null;
        }
    }
    
    // If birthdate is available, calculate age
    const birthdateField = document.getElementById(`dependent${dependentIndex}Birthdate`);
    if (birthdateField && birthdateField.value) {
        const birthDate = new Date(birthdateField.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 0 ? age : null;
    }
    
    return null; // Cannot determine age
}

/**
 * Generate detailed explanation of credit calculation
 * For transparency and tax planning purposes
 */
function generateCreditCalculationDetails(dependentCounts, config, phaseOutThreshold, agi, phaseOutReduction) {
    const details = [];
    
    if (dependentCounts.qualifyingChildren > 0) {
        details.push(`Qualifying children under 17: ${dependentCounts.qualifyingChildren} × $${config.CHILD_CREDIT_AMOUNT.toLocaleString()} = $${(dependentCounts.qualifyingChildren * config.CHILD_CREDIT_AMOUNT).toLocaleString()}`);
    }
    
    if (dependentCounts.otherDependents > 0) {
        details.push(`Other qualifying dependents: ${dependentCounts.otherDependents} × $${config.OTHER_DEPENDENT_CREDIT_AMOUNT.toLocaleString()} = $${(dependentCounts.otherDependents * config.OTHER_DEPENDENT_CREDIT_AMOUNT).toLocaleString()}`);
    }
    
    if (agi > phaseOutThreshold) {
        details.push(`AGI ($${agi.toLocaleString()}) exceeds threshold ($${phaseOutThreshold.toLocaleString()})`);
        details.push(`Phase-out reduction: $${phaseOutReduction.toLocaleString()}`);
    }
    
    return details.join('; ');
}

/**
 * Initialize Child Tax Credit system
 * Called during page load to set up all necessary components
 */
function initializeChildTaxCreditSystem() {
    console.log('Initializing Child Tax Credit calculation system...');
    
    // Set up event listeners for automatic recalculation
    const fieldsForRecalc = ['filingStatus', 'year', 'numberOfDependents'];
    
    fieldsForRecalc.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.hasAttribute('data-ctc-listener')) {
            // Mark field to avoid duplicate listeners
            field.setAttribute('data-ctc-listener', 'true');
            
            // Add appropriate event listener
            const eventType = field.tagName.toLowerCase() === 'select' ? 'change' : 'input';
            field.addEventListener(eventType, () => {
                // Debounce to avoid excessive recalculations
                clearTimeout(field.recalcTimeout);
                field.recalcTimeout = setTimeout(recalculateChildTaxCredit, 300);
            });
        }
    });
    
    // Initialize Child Tax Credit field as read-only with calculation indicator
    const childTaxCreditField = document.getElementById('childTaxCredit');
    if (childTaxCreditField) {
        childTaxCreditField.readOnly = true;
        childTaxCreditField.style.backgroundColor = '#f8f9fa';
        childTaxCreditField.title = 'Automatically calculated based on dependent information and income';
    }
    
    // Perform initial calculation if form has data
    const hasFormData = document.getElementById('filingStatus')?.value && 
                       document.getElementById('year')?.value &&
                       parseInt(document.getElementById('numberOfDependents')?.value || '0') > 0;
    
    if (hasFormData) {
        recalculateChildTaxCredit();
    }
    
    // Run validation in development mode (when console is open)
    if (typeof console !== 'undefined' && console.table) {
        try {
            // Only run validation if we can detect development environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                validateChildTaxCreditCalculation();
            }
        } catch (e) {
            // Silently fail if validation can't run
        }
    }
    
    console.log('✅ Child Tax Credit system initialized successfully');
}

/**
 * Update the Child Tax Credit field in the form
 * Called automatically when dependent information changes
 */
function recalculateChildTaxCredit() {
    // Get current form values
    const adjustedGrossIncome = getFieldValue('totalAdjustedGrossIncome');
    const filingStatus = document.getElementById('filingStatus')?.value;
    const taxYear = parseInt(document.getElementById('year')?.value, 10);
    
    // Validate required inputs
    if (!filingStatus || !taxYear || isNaN(adjustedGrossIncome)) {
        // Clear credit field if required data is missing
        const childTaxCreditField = document.getElementById('childTaxCredit');
        const detailsElement = document.getElementById('childTaxCreditDetails');
        
        if (childTaxCreditField) {
            childTaxCreditField.value = formatCurrency('0');
        }
        if (detailsElement) {
            detailsElement.textContent = 'Complete dependent information, filing status, and AGI to calculate';
        }
        return;
    }
    
    // Calculate credits
    const creditResults = calculateChildTaxCredit(adjustedGrossIncome, filingStatus, taxYear);
    
    // Update the form field
    const childTaxCreditField = document.getElementById('childTaxCredit');
    const detailsElement = document.getElementById('childTaxCreditDetails');
    
    if (childTaxCreditField) {
        childTaxCreditField.value = formatCurrency(String(creditResults.totalCredit));
        
        // Add tooltip with detailed calculation
        const tooltipText = [
            `Child Tax Credit Calculation (${taxYear}):`,
            `• Qualifying children under 17: ${creditResults.qualifyingChildren}`,
            `• Other qualifying dependents: ${creditResults.otherDependents}`,
            `• Child Tax Credit: $${creditResults.childTaxCredit.toLocaleString()}`,
            `• Other Dependent Credit: $${creditResults.otherDependentCredit.toLocaleString()}`,
            `• Total Credit: $${creditResults.totalCredit.toLocaleString()}`,
            creditResults.phaseOutReduction > 0 ? `• Phase-out reduction: $${creditResults.phaseOutReduction.toLocaleString()}` : '',
            `• AGI: $${adjustedGrossIncome.toLocaleString()}`,
            `• Filing Status: ${filingStatus}`
        ].filter(line => line).join('\n');
        
        childTaxCreditField.title = tooltipText;
        childTaxCreditField.setAttribute('data-calculation-details', creditResults.details);
    }
    
    // Update details element with user-friendly summary
    if (detailsElement) {
        let detailsText = '';
        
        if (creditResults.totalCredit === 0) {
            if (creditResults.qualifyingChildren === 0 && creditResults.otherDependents === 0) {
                detailsText = 'No qualifying dependents for tax credits';
            } else {
                detailsText = 'Credit reduced to $0 due to income phase-out';
            }
        } else {
            const parts = [];
            
            if (creditResults.qualifyingChildren > 0) {
                parts.push(`${creditResults.qualifyingChildren} child${creditResults.qualifyingChildren > 1 ? 'ren' : ''} under 17: $${creditResults.childTaxCredit.toLocaleString()}`);
            }
            
            if (creditResults.otherDependents > 0) {
                parts.push(`${creditResults.otherDependents} other dependent${creditResults.otherDependents > 1 ? 's' : ''}: $${creditResults.otherDependentCredit.toLocaleString()}`);
            }
            
            detailsText = parts.join(' + ');
            
            if (creditResults.phaseOutReduction > 0) {
                detailsText += ` (reduced by $${creditResults.phaseOutReduction.toLocaleString()} due to income)`;
            }
        }
        
        detailsElement.textContent = detailsText;
    }
    
    // Log calculation for debugging/auditing
    console.log('Child Tax Credit Calculation:', creditResults);
    
    // Trigger total tax recalculation
    if (!isRecalculating) {
        recalculateTotals();
    }
}

//--------------------------------//
// 4. DYNAMIC DEPENDENTS CREATION //
//--------------------------------//

function saveDependentsData() {
    const dependentsContainer = document.getElementById('dependentsContainer');
    if (!dependentsContainer) return;
    const inputs = dependentsContainer.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) {
            dependentsStore[input.id] = input.value;
        }
    });
}

function populateDependentsData() {
    for (let key in dependentsStore) {
        const el = document.getElementById(key);
        if (el) {
            el.value = dependentsStore[key];

            // Trigger any relevant "change" listeners if needed.
            if (el.tagName.toLowerCase() === 'select') {
                el.dispatchEvent(new Event('change'));
            }
        }
    }
}

document.getElementById('numberOfDependents').addEventListener('input', function() {
    // 1) Save existing data before we clear and rebuild
    saveDependentsData();

    const numDependents = parseInt(this.value, 10);
    const dependentsContainer = document.getElementById('dependentsContainer');
    dependentsContainer.innerHTML = '';

    if (!isNaN(numDependents) && numDependents > 0) {
        const heading = document.createElement('h1');
        heading.textContent = 'Children / Dependents Details';
        dependentsContainer.appendChild(heading);
        for (let i = 1; i <= numDependents; i++) {
            createDependentFields(dependentsContainer, i);
        }
    }

    // 2) Now repopulate the newly created fields
    populateDependentsData();
    
    // 3) Recalculate Child Tax Credit based on new dependent count
    recalculateChildTaxCredit();
});

function createDependentFields(container, index) {
    const dependentGroup = document.createElement('div');
    dependentGroup.classList.add('dependent-entry');

    createLabelAndInput(dependentGroup, `dependent${index}Name`, `Dependent ${index} Name:`, 'text');
    createLabelAndDropdown(dependentGroup, `dependent${index}DOBOrAge`, `Do You Know the Dependent's DOB or Current Age?`, ['Please Select', 'Yes', 'No']);

    const conditionalContainer = document.createElement('div');
    conditionalContainer.id = `conditionalContainer${index}`;
    dependentGroup.appendChild(conditionalContainer);

    createLabelAndDropdown(dependentGroup, `dependent${index}Employed`, `Is Dependent ${index} Currently Employed?`, ['Please Select', 'Yes', 'No']);
    const employmentConditionalContainer = document.createElement('div');
    employmentConditionalContainer.id = `employmentConditionalContainer${index}`;
    dependentGroup.appendChild(employmentConditionalContainer);

    container.appendChild(dependentGroup);

    const employedDropdown = document.getElementById(`dependent${index}Employed`);
    if (employedDropdown) {
        employedDropdown.addEventListener('change', function () {
            handleEmploymentStatusChange(index, this.value);
        });
    }

    createLabelAndDropdown(dependentGroup, `dependent${index}Credit`, 'Qualifies for Child/Dependent Credit?', ['Please Select', 'Yes', 'No']);
    
    // Add event listener for credit qualification change
    const creditDropdown = document.getElementById(`dependent${index}Credit`);
    if (creditDropdown) {
        creditDropdown.addEventListener('change', function() {
            recalculateChildTaxCredit();
        });
    }
    
    const dobOrAgeDropdown = document.getElementById(`dependent${index}DOBOrAge`);
    if (dobOrAgeDropdown) {
        dobOrAgeDropdown.addEventListener('change', function () {
            handleDOBOrAgeChange(index, this.value);
            // Recalculate Child Tax Credit when age information changes
            recalculateChildTaxCredit();
        });
    }
}

function handleDOBOrAgeChange(index, value) {
    const container = document.getElementById(`conditionalContainer${index}`);
    container.innerHTML = '';

    if (value === 'Yes') {
        // Create the "Birthdate" field:
        createLabelAndInput(container, `dependent${index}Birthdate`, `Dependent ${index} Birthdate:`, 'date');

        // Create the "Age" field:
        createLabelAndInput(container, `dependent${index}Age`, `Dependent ${index} Current Age:`, 'number');

        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
            // Recalculate Child Tax Credit when birthdate changes
            recalculateChildTaxCredit();
        });

        document.getElementById(`dependent${index}Age`).addEventListener('input', function() {
            if (this.value.trim() !== '') {
                document.getElementById(`dependent${index}Birthdate`).value = '';
            }
            // Recalculate Child Tax Credit when age changes
            recalculateChildTaxCredit();
        });
    }
    else if (value === 'No') {
        createLabelAndDropdown(container, `dependent${index}AgeRange`, `What is the Age Category of Child/Dependent ${index}?`, ['Please Select','17 or younger', '18 or older']);
        
        // Add listener for age range changes to recalculate Child Tax Credit
        const ageRangeDropdown = document.getElementById(`dependent${index}AgeRange`);
        if (ageRangeDropdown) {
            ageRangeDropdown.addEventListener('change', function() {
                recalculateChildTaxCredit();
            });
        }
    }
}

function handleEmploymentStatusChange(index, value) {
    const container = document.getElementById(`employmentConditionalContainer${index}`);
    container.innerHTML = '';

    if (value === 'Yes') {
        // For Dependent 1, enforce a minimum of $1
        if (index === 1) {
            createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`, 1);
        } else {
            createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`);
        }
        
        const incomeField = document.getElementById(`dependent${index}Income`);
        incomeField.addEventListener('blur', function() {
            updateDependentBizMap(index);
            const depData = dependentBizMap[index];
            if (depData && depData.businessIndex) {
                updateBusinessNet(depData.businessIndex);
                recalculateTotals();
            }
        });

        createLabelAndDropdown(container, `dependent${index}EmployedInBusiness`, `Is Dependent ${index} Employed in One of the Client's Businesses?`, ['Please Select', 'Yes', 'No']);

        document.getElementById(`dependent${index}EmployedInBusiness`).addEventListener('change', function() {
            if (this.value === 'Yes') {
                const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
                const businessNames = [];
                for (let i = 1; i <= numBusinesses; i++) {
                    const bName = document.getElementById(`businessName_${i}`)?.value || `Business ${i}`;
                    businessNames.push(bName);
                }
                createLabelAndDropdown(container, `dependent${index}BusinessName`, `Which Business?`, ['Please Select', ...(businessNames.length > 0 ? businessNames : ['No businesses available'])]);

                const bizSelect = document.getElementById(`dependent${index}BusinessName`);
                bizSelect.addEventListener('change', function() {
                    updateDependentBizMap(index);
                    const depData = dependentBizMap[index];
                    if (depData && depData.businessIndex) {
                        updateBusinessNet(depData.businessIndex);
                        recalculateTotals();
                    }
                });
            } else {
                const existingBizDropdown = document.getElementById(`dependent${index}BusinessName`);
                if (existingBizDropdown) {
                    existingBizDropdown.parentNode.removeChild(existingBizDropdown.previousSibling);
                    existingBizDropdown.parentNode.removeChild(existingBizDropdown);
                }
                delete dependentBizMap[index];
                recalculateTotals();
            }
        });
    } else if (value === 'No') {
        createLabelAndDropdown(container, `dependent${index}WillingToHire`, `Is the Client Willing to Hire Dependent ${index}?`, ['Please Select', 'Yes', 'No']);
        const willingDropdown = document.getElementById(`dependent${index}WillingToHire`);
        if (willingDropdown) {
            willingDropdown.addEventListener('change', function() {
                if (this.value === 'Yes') {
                    let dependentAge = 0;
                    const ageField = document.getElementById(`dependent${index}Age`);
                    if (ageField) {
                        dependentAge = parseInt(ageField.value, 10) || 0;
                    } else {
                        const ageRangeField = document.getElementById(`dependent${index}AgeRange`);
                        if (ageRangeField && ageRangeField.value === '18 or older') {
                            dependentAge = 18;
                        }
                    }
                    if (dependentAge >= 18) {
                        showRedDisclaimer('Hiring 18 or older will trigger FICA Taxes', `employmentConditionalContainer${index}`);
                    }
                } else {
                    const existingDisclaimer = document.getElementById(`disclaimer-employmentConditionalContainer${index}`);
                    if (existingDisclaimer) existingDisclaimer.remove();
                }
            });
        }
        delete dependentBizMap[index];
        recalculateTotals();
    }
}

function updateDependentBizMap(dependentIndex) {
    const wageStr = document.getElementById(`dependent${dependentIndex}Income`)?.value || '0';
    const wageVal = unformatCurrency(wageStr);
    const employedEl = document.getElementById(`dependent${dependentIndex}EmployedInBusiness`);
    const employedVal = employedEl ? employedEl.value : 'No';
  
    // Use a trimmed, case-insensitive check for "Yes"
    if (employedVal.trim().toLowerCase() !== 'yes') {
      delete dependentBizMap[dependentIndex];
      return;
    }
  
    const businessNameEl = document.getElementById(`dependent${dependentIndex}BusinessName`);
    const businessName = businessNameEl ? businessNameEl.value.trim() : '';
  
    let matchedBusinessIndex = null;
    const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    for (let i = 1; i <= numBusinesses; i++) {
      const currentBizName = document.getElementById(`businessName_${i}`)?.value.trim() || '';
      if (currentBizName === businessName) {
        matchedBusinessIndex = i;
        break;
      }
    }
  
    // If no match was found and there is exactly one business, default to that business.
    if (!matchedBusinessIndex && numBusinesses === 1) {
        matchedBusinessIndex = 1;
    }
  
    if (!matchedBusinessIndex) {
      delete dependentBizMap[dependentIndex];
      return;
    }
  
    dependentBizMap[dependentIndex] = {
      businessIndex: matchedBusinessIndex,
      wage: wageVal
    };
}
  
function createLabelAndDropdown(container, id, labelText, options) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    label.style.marginTop = '12px';
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    select.required = true;

    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
    });
    
    container.appendChild(select);
}

function createLabelAndInput(container, id, labelText, type) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    label.style.marginTop = '12px';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = true;
    container.appendChild(input);
    return input;
}

//----------------------//
// 5. AGE CALCULATIONS  //
//----------------------//

function calculateAge(birthdateValue, ageInputId) {
    let errorMessageId;
    // Use common error message IDs for client and spouse.
    if (ageInputId === 'spouseCurrentAge') {
        errorMessageId = 'spouseErrorMessage';
    } else if (ageInputId === 'currentAge') {
        errorMessageId = 'clientErrorMessage';
    }
    // For dependents, if the field is named like "dependent1Age", "dependent2Age", etc.
    else if (/^dependent\d+Age$/.test(ageInputId)) {
        // Remove the trailing "Age" and append "ErrorMessage"
        errorMessageId = ageInputId.replace(/Age$/, '') + 'ErrorMessage';
    } else {
        errorMessageId = ageInputId + 'ErrorMessage';
    }

    let errorMessage = document.getElementById(errorMessageId);
    const birthdate = new Date(birthdateValue);
    const today = new Date();

    if (isNaN(birthdate.getTime())) {
        if (!errorMessage) {
            errorMessage = document.createElement('p');
            errorMessage.id = errorMessageId;
            errorMessage.style.color = 'red';
            errorMessage.textContent = 'Invalid date format. Please enter a valid date.';
            document.getElementById(ageInputId).parentNode.appendChild(errorMessage);
        }
        return;
    }

    const todayYear = today.getFullYear();
    const birthYear = birthdate.getFullYear();
    let age = todayYear - birthYear;
    const monthDifference = today.getMonth() - birthdate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }

    if (birthdate > today) {
        displayErrorMessage(errorMessageId, 'Birthdate cannot be in the future.', ageInputId);
        document.getElementById(ageInputId).value = '';
        return;
    }

    if (age > 100) {
        displayErrorMessage(errorMessageId, 'Birthdate indicates an age greater than 100 years. Please check.', ageInputId);
        document.getElementById(ageInputId).value = '';
        return;
    }

    if (errorMessage) {
        errorMessage.textContent = '';
    }
    document.getElementById(ageInputId).value = age;
}

function validateAgeInput(input, index) {
    let errorMessageId;
    // Use common error message IDs for client and spouse.
    if (index === 'spouse') {
        errorMessageId = 'spouseErrorMessage';
    } else if (index === 'current') {
        errorMessageId = 'clientErrorMessage';
    }
    // For dependents, if the index is passed as "dependent1", "dependent2", etc.
    else if (/^dependent\d+$/.test(index)) {
        errorMessageId = index + 'ErrorMessage';
    } else {
        errorMessageId = 'ageErrorMessage' + index;
    }
    
    let errorMessage = document.getElementById(errorMessageId);
    const age = parseInt(input.value, 10);

    if (isNaN(age) || age < 0) {
        displayErrorMessage(errorMessageId, 'Age cannot be less than 0.', input.id);
    } else if (age > 100) {
        displayErrorMessage(errorMessageId, 'Age cannot be greater than 100 years.', input.id);
    } else {
        if (errorMessage) errorMessage.textContent = '';
    }
}

function autoSet65Plus() {
    if (userManuallyChanged65Plus) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientAgeInput = document.getElementById('currentAge');
    const spouseAgeInput = document.getElementById('spouseCurrentAge');
    const olderThan65Select = document.getElementById('olderthan65');
    const olderThan65Hidden = document.getElementById('olderthan65_hidden');

    const clientAgeStr = clientAgeInput.value.trim();
    const spouseAgeStr = spouseAgeInput.value.trim();

    let count65Plus = 0;
    if (clientAgeStr !== "") {
        const clientAge = parseInt(clientAgeStr, 10);
        if (!isNaN(clientAge) && clientAge >= 65) {
            count65Plus++;
        }
    }

    if (filingStatus === 'Married Filing Jointly' && spouseAgeStr !== "") {
        const spouseAge = parseInt(spouseAgeStr, 10);
        if (!isNaN(spouseAge) && spouseAge >= 65) {
            count65Plus++;
        }
    }

    const countStr = count65Plus.toString();
    olderThan65Select.value = countStr;
    olderThan65Hidden.value = countStr;

    // For a select element, use "disabled" to prevent changes.
    if (filingStatus === 'Married Filing Jointly') {
        olderThan65Select.disabled = (clientAgeStr !== "" && spouseAgeStr !== "");
    } else {
        olderThan65Select.disabled = (clientAgeStr !== "");
    }
}

function displayErrorMessage(errorMessageId, message, inputId) {
    let errorMessage = document.getElementById(errorMessageId);
    if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.id = errorMessageId;
        errorMessage.classList.add('red-disclaimer');
        document.getElementById(inputId).parentNode.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
}

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        document.getElementById('birthdate').value = '';
    }
    validateAgeInput(this, 'current'); 
    autoSet65Plus();
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        document.getElementById('spouseBirthdate').value = '';
    }
    validateAgeInput(this, 'spouse');
    autoSet65Plus();
});

document.getElementById('birthdate').addEventListener('change', autoSet65Plus);
document.getElementById('spouseBirthdate').addEventListener('change', autoSet65Plus);
document.getElementById('currentAge').addEventListener('input', autoSet65Plus);
document.getElementById('spouseCurrentAge').addEventListener('input', autoSet65Plus);
document.getElementById('olderthan65').addEventListener('change', function() {
    userManuallyChanged65Plus = true;
});

//----------------------------------------------//
// 6. AUTO-COPY LAST NAME TO SPOUSE'S LAST NAME //
//----------------------------------------------//

document.getElementById('lastName').addEventListener('input', function() {
    const spouseLast = document.getElementById('spouseLastName');
    spouseLast.value = this.value;
    spouseLast.classList.add('auto-copied');
    spouseLast.classList.remove('input-completed');
});

document.getElementById('spouseLastName').addEventListener('input', function() {
    if (this.classList.contains('auto-copied')) {
        this.classList.remove('auto-copied');
    }
});

document.getElementById('spouseLastName').addEventListener('blur', function() {
    if (this.value.trim() !== '') {
        this.classList.add('input-completed');
    } else {
        this.classList.remove('input-completed');
    }
});

//--------------------------------------//
// 7. DYNAMIC BUSINESS NAME CREATION    //
//--------------------------------------//

let businessNameStore = {};
let businessDetailStore = {};

document.getElementById('numOfBusinesses').addEventListener('input', function() {
    // 1. Save existing data
    saveBusinessNameData();
    saveBusinessDetailData();

    businessUniqueId = 1;

    // 2. Clear + rebuild "Business Name" fields
    const newCount = parseInt(this.value, 10) || 0;
    const nameContainer = document.getElementById('numOfBusinessesContainer');
    nameContainer.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
      createBusinessNameFields(nameContainer, businessUniqueId);
      populateBusinessNameFields(businessUniqueId);
      businessUniqueId++;
    }

    // 3. Clear + rebuild "Business Detail" fields
    businessUniqueId = 1;
    const detailContainer = document.getElementById('businessContainer');
    detailContainer.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
      createBusinessFields(detailContainer, businessUniqueId);
      populateBusinessDetailFields(businessUniqueId);
      businessUniqueId++;
    }
  
    recalculateTotals();
});

function createBusinessNameFields(container, uniqueId) {
    const businessNameDiv = document.createElement('div');
    businessNameDiv.classList.add('business-name-entry');

    businessNameDiv.id = `businessNameEntry_${uniqueId}`;
    businessNameDiv.dataset.uniqueId = uniqueId;

    const nameInput = createLabelAndInput(businessNameDiv, `businessName_${uniqueId}`, `Business ${uniqueId} Name:`, 'text');
    container.appendChild(businessNameDiv);

    // Add event listener to update dropdowns when the name is changed.
    if (nameInput) {
        nameInput.addEventListener('input', function() {
          // update the store with the current input value
          businessNameStore[`businessName_${uniqueId}`] = nameInput.value;
          updateAllW2BusinessDropdowns();
        });
      }

    const checkboxContainerReports = document.createElement('div');
    checkboxContainerReports.classList.add('checkbox-container');

    const checkboxLabelReports = document.createElement('label');
    checkboxLabelReports.setAttribute('for', `business${uniqueId}Reports`);
    checkboxLabelReports.textContent = 'Do you have the financial reports for this business?';

    const checkboxInputReports = document.createElement('input');
    checkboxInputReports.type = 'checkbox';
    checkboxInputReports.id = `business${uniqueId}Reports`;
    checkboxInputReports.name = `business${uniqueId}Reports`;
    checkboxContainerReports.appendChild(checkboxInputReports);
    checkboxContainerReports.appendChild(checkboxLabelReports);

    businessNameDiv.appendChild(checkboxContainerReports);

    const checkboxContainerPassive = document.createElement('div');
    checkboxContainerPassive.classList.add('checkbox-container');

    const checkboxLabelPassive = document.createElement('label');
    checkboxLabelPassive.setAttribute('for', `business${uniqueId}Passive`);
    checkboxLabelPassive.textContent = 'Is this a Passive Income/Loss Business?';

    const checkboxInputPassive = document.createElement('input');
    checkboxInputPassive.type = 'checkbox';
    checkboxInputPassive.id = `business${uniqueId}Passive`;
    checkboxInputPassive.name = `business${uniqueId}Passive`;
    checkboxContainerPassive.appendChild(checkboxInputPassive);
    checkboxContainerPassive.appendChild(checkboxLabelPassive);

    businessNameDiv.appendChild(checkboxContainerPassive);

    const checkboxContainerMedical = document.createElement('div');
    checkboxContainerMedical.classList.add('checkbox-container');
 
    const checkboxLabelMedical = document.createElement('label');
    checkboxLabelMedical.setAttribute('for', `business${uniqueId}Medical`);
    checkboxLabelMedical.textContent = 'Is this a Medical/Professional Business?';

    const checkboxInputMedical = document.createElement('input');
    checkboxInputMedical.type = 'checkbox';
    checkboxInputMedical.id = `business${uniqueId}Medical`;
    checkboxInputMedical.name = `business${uniqueId}Medical`;
    checkboxContainerMedical.appendChild(checkboxInputMedical);
    checkboxContainerMedical.appendChild(checkboxLabelMedical);

    businessNameDiv.appendChild(checkboxContainerMedical);

    const checkboxContainerRealEstate = document.createElement('div');
    checkboxContainerRealEstate.classList.add('checkbox-container');

    const checkboxLabelRealEstate = document.createElement('label');
    checkboxLabelRealEstate.setAttribute('for', `business${uniqueId}RealEstate`);
    checkboxLabelRealEstate.textContent = 'Is this a Real Estate Business?';

    const checkboxInputRealEstate = document.createElement('input');
    checkboxInputRealEstate.type = 'checkbox';
    checkboxInputRealEstate.id = `business${uniqueId}RealEstate`;
    checkboxInputRealEstate.name = `business${uniqueId}RealEstate`;
    checkboxContainerRealEstate.appendChild(checkboxInputRealEstate);
    checkboxContainerRealEstate.appendChild(checkboxLabelRealEstate);

    businessNameDiv.appendChild(checkboxContainerRealEstate);

    container.appendChild(businessNameDiv);
}

function saveBusinessNameData() {
    const container = document.getElementById('numOfBusinessesContainer');
    if (!container) return;
    const inputs = container.querySelectorAll('input[type="text"], input[type="checkbox"]');
    inputs.forEach(input => {
        const fieldId = input.id;
        if (fieldId) {
            if (input.type === 'checkbox') {
                businessNameStore[fieldId] = input.checked;
            } else {
                businessNameStore[fieldId] = input.value;
            }
        }
    });
}

function populateBusinessNameFields(index) {
    const nameFieldId = `businessName_${index}`;
    const medicalCheckboxId = `business${index}Medical`;
    const realEstateCheckboxId = `business${index}RealEstate`;
    const reportsCheckboxId = `business${index}Reports`;

    if (businessNameStore[nameFieldId]) {
        const nameField = document.getElementById(nameFieldId);
        if (nameField) {
            nameField.value = businessNameStore[nameFieldId];
        }
    }
    if (businessNameStore[medicalCheckboxId] !== undefined) {
        const medCheckbox = document.getElementById(medicalCheckboxId);
        if (medCheckbox) {
            medCheckbox.checked = businessNameStore[medicalCheckboxId];
        }
    }
    if (businessNameStore[realEstateCheckboxId] !== undefined) {
        const reCheckbox = document.getElementById(realEstateCheckboxId);
        if (reCheckbox) {
            reCheckbox.checked = businessNameStore[realEstateCheckboxId];
        }
    }
    if (businessNameStore[reportsCheckboxId] !== undefined) {
        const repCheckbox = document.getElementById(reportsCheckboxId);
        if (repCheckbox) {
            repCheckbox.checked = businessNameStore[reportsCheckboxId];
        }
    }
}

//-----------------------------------------------------//
// 8. HELPER FUNCTIONS FOR NUMBER FIELDS AND CURRENCY  //
//-----------------------------------------------------//

function getFieldValue(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = unformatCurrency(el.value || '0');
  return isNaN(raw) ? 0 : raw;
}

function formatCurrency(value) {
    // 1) Ensure we're working with a string (even if the caller passed a number or null)
    const str = value == null ? '' : String(value);

    // 2) Strip out everything except digits, dot and minus
    const numericValue = str.replace(/[^0-9.-]/g, '');
    if (numericValue === '') return '';

    let floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return '';

    // 3) Truncate to integer, format with Intl, drop “.00”
    const truncatedValue = parseInt(floatValue, 10);
    const absoluteVal = Math.abs(truncatedValue);
    let formattedVal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(absoluteVal).replace(/\.00$/, '');

    return (truncatedValue < 0)
      ? `(${formattedVal})`
      : formattedVal;
}

function unformatCurrency(value) {
    let trimmedValue = value.trim();
    // Check if the value is negative by either a leading '-' or by being enclosed in parentheses.
    let isNegative = trimmedValue.charAt(0) === '-' || 
                     (trimmedValue.charAt(0) === '(' && trimmedValue.charAt(trimmedValue.length - 1) === ')');
    // Remove any characters except digits and the decimal point.
    let numericValue = trimmedValue.replace(/[^0-9.]/g, '');
    let floatVal = parseFloat(numericValue);
    if (isNaN(floatVal)) {
        floatVal = 0;
    }
    return isNegative ? -floatVal : floatVal;
}

function createLabelAndTextField(parent, id, labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    parent.appendChild(input);
}

function createLabelAndCurrencyField(parent, id, labelText, minValue) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.classList.add('currency-field');
    parent.appendChild(input);

    input.addEventListener('blur', function() {
        if (input.value.trim() !== "") {
            let num = unformatCurrency(input.value);
            if (minValue !== undefined && num < minValue) {
                num = minValue;
            }
            num = Math.abs(num);
            input.value = formatCurrency(String(num));
        }
    });

    return input;
}

//------------------------------------------------------------//
// 9. DYNAMIC GENERATION OF BUSINESS DETAIL FIELDS + NET CALC //
//------------------------------------------------------------//

const DISCLAIMER_MAP = {};

function renderDisclaimers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimerBox = document.getElementById(`disclaimerBox-${containerId}`);
    if (!disclaimerBox) {
        disclaimerBox = document.createElement('div');
        disclaimerBox.id = `disclaimerBox-${containerId}`;
        disclaimerBox.style.marginTop = '12px';
        container.appendChild(disclaimerBox);
    }
    disclaimerBox.innerHTML = '';
    const disclaimersForThis = DISCLAIMER_MAP[containerId] || {};
    const keys = Object.keys(disclaimersForThis);
    if (!keys.length) {
        disclaimerBox.remove();
        return;
    }
    const ul = document.createElement('ul');
    ul.classList.add('red-disclaimer');
    keys.forEach(errorKey => {
        const li = document.createElement('li');
        li.textContent = disclaimersForThis[errorKey];
        ul.appendChild(li);
    });
    disclaimerBox.appendChild(ul);
}

function addDisclaimer(containerId, errorKey, message) {
    if (!DISCLAIMER_MAP[containerId]) {
        DISCLAIMER_MAP[containerId] = {};
    }
    DISCLAIMER_MAP[containerId][errorKey] = message;
    renderDisclaimers(containerId);
}

function removeDisclaimer(containerId, errorKey) {
    if (DISCLAIMER_MAP[containerId] && DISCLAIMER_MAP[containerId][errorKey]) {
        delete DISCLAIMER_MAP[containerId][errorKey];
        renderDisclaimers(containerId);
    }
}

// Returns a formatted header string for a business block
function updateBusinessHeader(uniqueId) {
    const inputId = `businessName_${uniqueId}`;
    const bNameInput = document.getElementById(inputId);
    
    // Get the value from the input; if empty, use the stored value.
    let valueFromInput = bNameInput ? bNameInput.value.trim() : '';
    if (!valueFromInput && businessNameStore[inputId]) {
      valueFromInput = businessNameStore[inputId];
    }
    // Default to "Business <uniqueId>" if no name is entered.
    const bizName = valueFromInput || `Business ${uniqueId}`;
    
    // (If you have owner names to append, leave that logic unchanged.)
    // For example:
    let ownerNames = [];
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${uniqueId}`);
    if (dynamicOwnerFieldsDiv) {
      const ownerSelects = dynamicOwnerFieldsDiv.querySelectorAll(`select[id^="business${uniqueId}OwnerName"]`);
      ownerSelects.forEach(select => {
        if (select.value && select.value !== 'Please Select') {
          ownerNames.push(select.value.trim());
        }
      });
    }
    if (ownerNames.length === 0) {
      return bizName;
    } else if (ownerNames.length === 1) {
      return `${bizName} - ${ownerNames[0]}`;
    } else {
      const last = ownerNames.pop();
      return `${bizName} - ${ownerNames.join(', ')} and ${last}`;
    }
}

function createBusinessFields(container, uniqueId) {
    const index = uniqueId;
    // Initialize tracking variables if not already set.
    if (blurredIncome[index] === undefined) {
        blurredIncome[index] = false;
    }
    if (blurredExpenses[index] === undefined) {
        blurredExpenses[index] = false;
    }

    // Create the main container for this business entry.
    const businessDiv = document.createElement('div');
    businessDiv.classList.add('business-entry');
    // Assign a permanent unique ID instead of a sequential index.
    businessDiv.dataset.uniqueId = uniqueId;
    businessDiv.id = `businessEntry_${uniqueId}`;
    container.appendChild(businessDiv);

    // Create the header for the business block.
    const header = document.createElement('h3');
    // Use the unique ID in the header's id.
    header.id = `businessNameHeading_${uniqueId}`;
    header.classList.add('dynamic-heading');
    header.style.cursor = 'pointer';
    // Set the header text using the unique ID.
    header.textContent = updateBusinessHeader(uniqueId);

    businessDiv.appendChild(header);


    // If the business name input exists, update the header when its value changes.
    const bNameInput = document.getElementById(`businessName_${uniqueId}`);
    if (bNameInput) {
        bNameInput.addEventListener('input', function() {
            header.textContent = updateBusinessHeader(uniqueId);
        });
    }

    // Create a container for all business details that can be collapsed.
    const collapsibleContent = document.createElement('div');
    collapsibleContent.classList.add('collapsible-content', 'active');

    // --- Business Type Field ---
    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
    typeLabel.setAttribute('for', `business${index}Type`);
    collapsibleContent.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.name = `business${index}Type`;
    typeSelect.id = `business${index}Type`;
    ["Please Select", "S-Corp", "Partnership", "C-Corp", "Schedule-C"].forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });
    collapsibleContent.appendChild(typeSelect);

    // --- Income, Expenses, and Net Fields ---
    createLabelAndCurrencyField(collapsibleContent, `business${index}Income`, `Income:`);
    createLabelAndCurrencyField(collapsibleContent, `business${index}Expenses`, `Expenses:`);
    createLabelAndTextField(collapsibleContent, `business${index}Net`, `Net (Income - Expenses):`);

    const incomeField = collapsibleContent.querySelector(`#business${index}Income`);
    const expensesField = collapsibleContent.querySelector(`#business${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        blurredIncome[index] = true;
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });

    expensesField.addEventListener('blur', function() {
        blurredExpenses[index] = true;
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });

    const netField = collapsibleContent.querySelector(`#business${index}Net`);
    if (netField) {
        netField.readOnly = true;
    }

    // --- Owners Section ---
    const ownersContainer = document.createElement('div');
    ownersContainer.id = `ownersContainer${index}`;
    collapsibleContent.appendChild(ownersContainer);

    const numOwnersLabel = document.createElement('label');
    numOwnersLabel.textContent = `How many owners does Business ${index} have?`;
    numOwnersLabel.setAttribute('for', `numOwnersSelect${index}`);
    numOwnersLabel.style.marginTop = '12px';
    ownersContainer.appendChild(numOwnersLabel);

    const numOwnersSelect = document.createElement('select');
    numOwnersSelect.id = `numOwnersSelect${index}`;
    numOwnersSelect.name = `numOwnersSelect${index}`;
    ownersContainer.appendChild(numOwnersSelect);
    // Options for numOwnersSelect will be populated later based on business type.

    const dynamicOwnerFieldsDiv = document.createElement('div');
    dynamicOwnerFieldsDiv.id = `dynamicOwnerFields${index}`;
    dynamicOwnerFieldsDiv.style.marginTop = '12px';
    ownersContainer.appendChild(dynamicOwnerFieldsDiv);

    // --- C-Corp Tax Due Container ---
    const cCorpTaxDueDiv = document.createElement('div');
    cCorpTaxDueDiv.id = `cCorpTaxDueContainer${index}`;
    cCorpTaxDueDiv.style.marginTop = '16px';
    cCorpTaxDueDiv.style.fontWeight = 'bold';
    cCorpTaxDueDiv.style.display = 'none';
    collapsibleContent.appendChild(cCorpTaxDueDiv);

    // --- Event Listeners for Dynamic Behavior ---
    typeSelect.addEventListener('change', function() {
        handleBusinessTypeChange(index, typeSelect.value);
    });

    numOwnersSelect.addEventListener('change', function(e) {
        saveBusinessDetailData();
        const selectedVal = parseInt(this.value, 10);
        createOwnerFields(index, selectedVal);
        populateBusinessDetailFields(index);
    });


    // Toggle the business details when the header is clicked.
    header.addEventListener('click', function() {
        collapsibleContent.classList.toggle('active');
    });

    // Add a "Remove this business?" button at the bottom
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove this business?';
    removeBtn.classList.add('remove-business-btn'); // or reuse 'remove-w2-btn'

    removeBtn.addEventListener('click', function() {
        // Get the unique ID of the business being removed.
        const removedUniqueId = businessDiv.dataset.uniqueId;
     
        // (Optional) Remove the corresponding business-name block if you have one.
        const nameBlock = document.getElementById(`businessNameEntry_${removedUniqueId}`);
        if (nameBlock) {
            nameBlock.remove();
        }
     
        // Remove the detail block.
        businessDiv.remove();
     
        // Update the "numOfBusinesses" field to reflect the remaining count.
        const currentBlocks = document.querySelectorAll('.business-entry');
        document.getElementById('numOfBusinesses').value = currentBlocks.length;
     
        // Instead of reindexing (which would change permanent IDs), simply update all headers.
        updateAllBusinessHeaders();
     
        recalculateTotals();
    });
    

    collapsibleContent.appendChild(removeBtn);

    // Append the collapsible content to the main businessDiv.
    businessDiv.appendChild(collapsibleContent);

    // Append the complete business entry to the container.
    container.appendChild(businessDiv);

    // // Increment the unique ID for the next business block.
    // businessUniqueId++;
}

function updateAllBusinessHeaders() {
    const businessEntries = document.querySelectorAll('.business-entry');
    businessEntries.forEach(entry => {
        // Use the stored permanent unique ID.
        const uniqueId = entry.dataset.uniqueId;
        const header = entry.querySelector('.dynamic-heading');
        if (header) {
            header.textContent = updateBusinessHeader(uniqueId);
        }
    });
}

function handleAddBusinessClick() {
    const numEl = document.getElementById('numOfBusinesses');
    let currentVal = parseInt(numEl.value, 10) || 0;
    currentVal++;
    numEl.value = currentVal;
    // Force the same logic that runs when the user manually edits "numOfBusinesses"
    numEl.dispatchEvent(new Event('input'));
}

function populateNumOwnersOptionsForNonPartnership(selectEl, filingStatus) {
    selectEl.innerHTML = '';
    let possibleVals;
    if (filingStatus === 'Married Filing Jointly') {
        possibleVals = [0, 1, 2, 3];
    } else {
        possibleVals = [0, 1, 2];
    }
    possibleVals.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = (v === 0) ? 'Please Select' : String(v);
        if (v === 0) {
            opt.disabled = true;
            opt.selected = true;
        }
        selectEl.appendChild(opt);
    });
}

function handleBusinessTypeChange(index, businessType) {
    const ownersContainer = document.getElementById('ownersContainer' + index);
    const numOwnersSelect = document.getElementById('numOwnersSelect' + index);
    const dynamicOwnerFieldsDiv = document.getElementById('dynamicOwnerFields' + index);

    // Clear out dynamic area
    dynamicOwnerFieldsDiv.innerHTML = '';
    // Remove any previously added "Which spouse owns Schedule‑C?" question 
    removeScheduleCQuestion(index);
    ownersContainer.style.display = 'block'; 

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';

    if (businessType === 'Please Select') {
        ownersContainer.style.display = 'none';
        numOwnersSelect.innerHTML = '';
        return;
    } else if (businessType === 'Schedule-C') {
        // Typically 1 "owner" or we skip owners entirely.
        ownersContainer.style.display = 'none';
        numOwnersSelect.innerHTML = '';
        dynamicOwnerFieldsDiv.innerHTML = '';
        // If MFJ, ask "Which spouse owns this Schedule C?"
        if (filingStatus === 'Married Filing Jointly') {
            addScheduleCQuestion(index);
        }
        return;
    } else if (businessType === 'Partnership') {
        ownersContainer.style.display = 'block';
        numOwnersSelect.innerHTML = '';

        if (filingStatus !== 'Married Filing Jointly') {
            // Force exactly 2 owners (Client, "Other")
            const opt2 = document.createElement('option');
            opt2.value = '2';
            opt2.textContent = '2';
            numOwnersSelect.appendChild(opt2);
            numOwnersSelect.value = '2';
            createOwnerFields(index, 2);

            const owner1Select = document.getElementById(`business${index}OwnerName1`);
            const owner2Select = document.getElementById(`business${index}OwnerName2`);
            if (owner1Select) {
                owner1Select.value = clientFirstName;
                owner1Select.disabled = true;
                owner1Select.style.backgroundColor = '#f0f0f0';
            }
            if (owner2Select) {
                owner2Select.value = 'Other';
                owner2Select.disabled = true;
                owner2Select.style.backgroundColor = '#f0f0f0';
            }
        } else {
            // MFJ => allow 2 or 3 owners
            numOwnersSelect.innerHTML = '';
            let pleaseOpt = document.createElement('option');
            pleaseOpt.value = '0';
            pleaseOpt.textContent = 'Please Select';
            pleaseOpt.disabled = true;
            pleaseOpt.selected = true;
            numOwnersSelect.appendChild(pleaseOpt);

            let twoOpt = document.createElement('option');
            twoOpt.value = '2';
            twoOpt.textContent = '2';
            numOwnersSelect.appendChild(twoOpt);

            let threeOpt = document.createElement('option');
            threeOpt.value = '3';
            threeOpt.textContent = '3';
            numOwnersSelect.appendChild(threeOpt);

            numOwnersSelect.value = '0'; 
        }
    } else if (businessType === 'S-Corp') {
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';
        // Populate the dropdown with options where the default is "Please Select"
        // (value 0 is disabled and selected by default)
        populateNumOwnersOptionsForNonPartnership(numOwnersSelect, filingStatus);
        // Do not set a default value or immediately create owner fields.
        // Owner fields will be generated when the user makes a selection.
        return;
    } else if (businessType === 'C-Corp') {
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';

        if (filingStatus === 'Married Filing Jointly') {
            numOwnersSelect.innerHTML = '';
            let opt0 = document.createElement('option');
            opt0.value = '0';
            opt0.textContent = 'Please Select';
            opt0.disabled = true;
            opt0.selected = true;
            numOwnersSelect.appendChild(opt0);

            let opt1 = document.createElement('option');
            opt1.value = '1';
            opt1.textContent = '1';
            numOwnersSelect.appendChild(opt1);

            let opt2 = document.createElement('option');
            opt2.value = '2';
            opt2.textContent = '2';
            numOwnersSelect.appendChild(opt2);

            let opt3 = document.createElement('option');
            opt3.value = '3';
            opt3.textContent = '3';
            numOwnersSelect.appendChild(opt3);

            numOwnersSelect.value = '0';
        } else {
            numOwnersSelect.innerHTML = '';
            let opt0 = document.createElement('option');
            opt0.value = '0';
            opt0.textContent = 'Please Select';
            opt0.disabled = true;
            opt0.selected = true;
            numOwnersSelect.appendChild(opt0);

            let opt1 = document.createElement('option');
            opt1.value = '1';
            opt1.textContent = '1';
            numOwnersSelect.appendChild(opt1);

            let opt2 = document.createElement('option');
            opt2.value = '2';
            opt2.textContent = '2';
            numOwnersSelect.appendChild(opt2);

            numOwnersSelect.value = '0';
        }
    }
    updateAllBusinessOwnerResCom();
}

function addScheduleCQuestion(businessIndex) {
    // Only add the question if filing status is MFJ.
    const filingStatus = document.getElementById('filingStatus').value;
    if (filingStatus !== 'Married Filing Jointly') return;
    
    const clientFirst = document.getElementById('firstName').value.trim() || 'Client 1';
    const spouseFirst = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
    
    // Locate the "Business X Type" select element.
    const typeSelect = document.getElementById(`business${businessIndex}Type`);
    if (!typeSelect || !typeSelect.parentNode) return;
    
    // Create the label for the Schedule-C ownership question.
    const label = document.createElement('label');
    label.setAttribute('for', `scheduleCOwner${businessIndex}`);
    label.id = `scheduleCLabel${businessIndex}`;
    label.style.marginTop = '12px';
    label.textContent = 'Which client owns this Schedule C?';
    
    // Create the dropdown for Schedule-C ownership.
    const scheduleCDropdown = document.createElement('select');
    scheduleCDropdown.id = `scheduleCOwner${businessIndex}`;
    scheduleCDropdown.name = `scheduleCOwner${businessIndex}`;
    
    // Populate the dropdown options.
    const optionsArr = ['Please Select', clientFirst, spouseFirst];
    optionsArr.forEach(function(optLabel) {
        const opt = document.createElement('option');
        opt.value = optLabel;
        opt.textContent = optLabel;
        scheduleCDropdown.appendChild(opt);
    });
    
    // Insert the label and dropdown immediately after the Business Type field.
    typeSelect.parentNode.insertBefore(label, typeSelect.nextSibling);
    typeSelect.parentNode.insertBefore(scheduleCDropdown, label.nextSibling);
}

function removeScheduleCQuestion(businessIndex) {
    const label = document.getElementById(`scheduleCLabel${businessIndex}`);
    const dropdown = document.getElementById(`scheduleCOwner${businessIndex}`);
    if (label) label.remove();
    if (dropdown) dropdown.remove();
}

function createOwnerFields(businessIndex, numOwners) {
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${businessIndex}`);
    if (!dynamicOwnerFieldsDiv) return;
    dynamicOwnerFieldsDiv.innerHTML = '';

    // Get the filing status and the relevant client/spouse names
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';

    // Determine if this business is an S‐Corp
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
    const isSCorp = (businessTypeVal === 'S-Corp');

    // Clear disclaimers for ownership if needed:
    validateTotalOwnership(businessIndex, numOwners);

    /*
      Branching logic for different business types & filing statuses:
      1) Non‑MFJ => might auto‐fill owners
      2) MFJ => might have up to 3 owners, etc.
    */
    if (filingStatus !== 'Married Filing Jointly') {
        if (numOwners === 1) {
            // Single owner, 100% read‑only.
            // Now pass "showReasonableComp: isSCorp" so that if S‑Corp, the Reasonable Compensation field is added.
            const ownerSection = buildSingleAutoFillOwner({
                businessIndex,
                ownerIndex: 1,
                ownerName: clientFirstName,
                autoPct: '100.0000',
                showReasonableComp: isSCorp
            });
            dynamicOwnerFieldsDiv.appendChild(ownerSection);
        } else if (numOwners === 2) {
            // Two owners: Client, Other
            for (let i = 1; i <= 2; i++) {
                const isClient = (i === 1);
                const ownerSection = buildTwoOwnerEntry({
                    businessIndex,
                    ownerIndex: i,
                    defaultName: isClient ? clientFirstName : 'Other',
                    isMfjDropdown: false,
                    showReasonableComp: isSCorp
                });
                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
    } else {
        // MFJ cases – unchanged from your original logic
        if (numOwners === 1) {
            const ownerSection = buildSingleOwnerDropdown({
                businessIndex,
                ownerIndex: 1,
                clientName: clientFirstName,
                spouseName: spouseFirstName,
                showReasonableComp: isSCorp
            });
            dynamicOwnerFieldsDiv.appendChild(ownerSection);
        } else if (numOwners === 2) {
            for (let i = 1; i <= 2; i++) {
                const ownerSection = buildTwoOwnerEntry({
                    businessIndex,
                    ownerIndex: i,
                    defaultName: 'Please Select',
                    isMfjDropdown: true,
                    clientName: clientFirstName,
                    spouseName: spouseFirstName,
                    showReasonableComp: isSCorp
                });
                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        } else if (numOwners === 3) {
            for (let i = 1; i <= 3; i++) {
                const ownerSection = buildThreeOwnerEntry({
                    businessIndex,
                    ownerIndex: i,
                    clientName: clientFirstName,
                    spouseName: spouseFirstName,
                    showReasonableComp: isSCorp
                });
                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
    }

    // Re‑validate ownership now that we’ve created new fields
    validateTotalOwnership(businessIndex, numOwners);
    updateOwnerApportionment(businessIndex);
}

function buildSingleAutoFillOwner({ businessIndex, ownerIndex, ownerName, autoPct, showReasonableComp = false }) {
    const container = document.createElement('section');
    container.classList.add('owner-entry');
    container.id = `ownerContainer-${businessIndex}-${ownerIndex}`;

    // Owner name label and auto‑filled select
    const nameLabel = document.createElement('label');
    nameLabel.textContent = `Owner ${ownerIndex} (Auto-Filled)`;
    container.appendChild(nameLabel);

    const nameSelect = document.createElement('select');
    nameSelect.id = `business${businessIndex}OwnerName${ownerIndex}`;
    nameSelect.name = `business${businessIndex}OwnerName${ownerIndex}`;
    const opt = document.createElement('option');
    opt.value = ownerName;
    opt.textContent = ownerName;
    nameSelect.appendChild(opt);
    nameSelect.disabled = true;
    nameSelect.style.backgroundColor = '#f0f0f0';
    container.appendChild(nameSelect);

    // Add Reasonable Compensation field if needed (for S‑Corp)
    // If needed, add the RC field with buttons.
    if (showReasonableComp) {
      const resCompSection = createResCompSection(businessIndex, ownerIndex);
      container.appendChild(resCompSection);
    }

    // Ownership % label and read‑only input
    const pctLabel = document.createElement('label');
    pctLabel.textContent = 'Ownership %:';
    container.appendChild(pctLabel);

    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.id = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.name = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.value = autoPct;
    pctInput.readOnly = true;
    pctInput.style.backgroundColor = '#f0f0f0';
    container.appendChild(pctInput);

    // Apportionment area
    const apportionmentContainer = document.createElement('div');
    apportionmentContainer.id = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    container.appendChild(apportionmentContainer);

    return container;
}

function buildTwoOwnerEntry({
    businessIndex, 
    ownerIndex, 
    defaultName, 
    isMfjDropdown = false,
    clientName = 'Client 1',
    spouseName = 'Client 2',
    showReasonableComp = false
}) {
    const container = document.createElement('section');
    container.classList.add('owner-entry');
    container.id = `ownerContainer-${businessIndex}-${ownerIndex}`;

    // 1) Owner label & dropdown
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', `business${businessIndex}OwnerName${ownerIndex}`);
    nameLabel.textContent = `Owner ${ownerIndex}`;
    container.appendChild(nameLabel);

    const nameSelect = document.createElement('select');
    nameSelect.id = `business${businessIndex}OwnerName${ownerIndex}`;
    nameSelect.name = `business${businessIndex}OwnerName${ownerIndex}`;
    
    if (!isMfjDropdown) {
        const fixedOpt = document.createElement('option');
        fixedOpt.value = defaultName;
        fixedOpt.textContent = defaultName;
        nameSelect.appendChild(fixedOpt);
        nameSelect.disabled = true;
        nameSelect.style.backgroundColor = '#f0f0f0';
    } else {
        const pleaseOpt = document.createElement('option');
        pleaseOpt.value = 'Please Select';
        pleaseOpt.textContent = 'Please Select';
        pleaseOpt.disabled = true;
        pleaseOpt.selected = true;
        nameSelect.appendChild(pleaseOpt);

        [clientName, spouseName, 'Other'].forEach(function(name) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            nameSelect.appendChild(opt);
        });
    }
    container.appendChild(nameSelect);

    // NEW: Add event listener to update RC section based on selection
    nameSelect.addEventListener('change', function() {
        const isOther = nameSelect.value.trim().toLowerCase() === 'other';
        updateRCSectionForOwner(businessIndex, ownerIndex, isOther);
        updateBusinessOwnerResCom(businessIndex);
        updateAggregateResComp(); // update the global RC field
        recalculateTotals();      // recalc taxes using the new RC value
    });    

    // 2) Reasonable Compensation field for S‑Corp
    if (showReasonableComp) {
        // For non‑MFJ, determine if default is Other; for MFJ, the change event will update it
        let isOtherOwner = (!isMfjDropdown && defaultName.trim().toLowerCase() === 'other');
        const resCompSection = createResCompSection(businessIndex, ownerIndex, isOtherOwner);
        container.appendChild(resCompSection);
    }

    // 3) Ownership % label & input
    const pctLabel = document.createElement('label');
    pctLabel.textContent = 'Ownership %:';
    container.appendChild(pctLabel);

    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.id = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.name = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.value = '';
    container.appendChild(pctInput);

    pctInput.addEventListener('input', function() {
        handleTwoOwnersInput(businessIndex, ownerIndex);
        updateOwnerApportionment(businessIndex);
    });
    pctInput.addEventListener('blur', function() {
        let value = parseFloat(pctInput.value);
        if (!isNaN(value)) {
            pctInput.value = value.toFixed(6);
        }
    });

    // 4) Apportionment display area
    const apportionmentContainer = document.createElement('div');
    apportionmentContainer.id = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    container.appendChild(apportionmentContainer);

    return container;
}

function buildSingleOwnerDropdown({ 
    businessIndex, 
    ownerIndex, 
    clientName, 
    spouseName,
    showReasonableComp = false
}) {
    const container = document.createElement('section');
    container.classList.add('owner-entry');
    container.id = `ownerContainer-${businessIndex}-${ownerIndex}`;

    // Owner name label & dropdown
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', `business${businessIndex}OwnerName${ownerIndex}`);
    nameLabel.textContent = `Owner ${ownerIndex} (Auto-Filled)`;
    container.appendChild(nameLabel);

    const nameSelect = document.createElement('select');
    nameSelect.id = `business${businessIndex}OwnerName${ownerIndex}`;
    nameSelect.name = `business${businessIndex}OwnerName${ownerIndex}`;

    const pleaseOpt = document.createElement('option');
    pleaseOpt.value = 'Please Select';
    pleaseOpt.textContent = 'Please Select';
    pleaseOpt.disabled = true;
    pleaseOpt.selected = true;
    nameSelect.appendChild(pleaseOpt);

    const optClient = document.createElement('option');
    optClient.value = clientName;
    optClient.textContent = clientName;
    nameSelect.appendChild(optClient);

    const optSpouse = document.createElement('option');
    optSpouse.value = spouseName;
    optSpouse.textContent = spouseName;
    nameSelect.appendChild(optSpouse);

    container.appendChild(nameSelect);

    // Attach event listener to update RC section if "Other" is selected.
    nameSelect.addEventListener('change', function() {
        const isOther = nameSelect.value.trim().toLowerCase() === 'other';
        // Update the RC section for this owner. This will lock/unlock the field.
        updateRCSectionForOwner(businessIndex, ownerIndex, isOther);
        // Update the RC value for this business block.
        updateBusinessOwnerResCom(businessIndex);
        // Aggregate all business RC values into the global "reasonableCompensation" field.
        updateAggregateResComp();
        // Finally, recalculate all totals so that your tax functions use the updated RC.
        recalculateTotals();
    });
    

    if (showReasonableComp) {
        const resCompSection = createResCompSection(businessIndex, ownerIndex);
        container.appendChild(resCompSection);
    }

    // Ownership % (always 100% read‑only in this scenario)
    const pctLabel = document.createElement('label');
    pctLabel.textContent = 'Ownership %:';
    container.appendChild(pctLabel);

    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.id = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.name = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.value = '100.000000';
    pctInput.readOnly = true;
    pctInput.style.backgroundColor = '#f0f0f0';
    container.appendChild(pctInput);

    const apportionmentContainer = document.createElement('div');
    apportionmentContainer.id = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    container.appendChild(apportionmentContainer);

    return container;
}

function buildThreeOwnerEntry({
    businessIndex, 
    ownerIndex, 
    clientName, 
    spouseName,
    showReasonableComp = false
}) {
    const container = document.createElement('section');
    container.classList.add('owner-entry');
    container.id = `ownerContainer-${businessIndex}-${ownerIndex}`;

    // Owner name (auto-filled)
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', `business${businessIndex}OwnerName${ownerIndex}`);
    nameLabel.textContent = `Owner ${ownerIndex} (Auto-Filled)`;
    container.appendChild(nameLabel);

    const nameSelect = document.createElement('select');
    nameSelect.id = `business${businessIndex}OwnerName${ownerIndex}`;
    nameSelect.name = `business${businessIndex}OwnerName${ownerIndex}`;

    let fillName;
    if (ownerIndex === 1) {
        fillName = clientName || 'Client 1';
    } else if (ownerIndex === 2) {
        fillName = spouseName || 'Client 2';
    } else {
        fillName = 'Other';
    }

    nameSelect.addEventListener('change', function() {
        const isOther = nameSelect.value.trim().toLowerCase() === 'other';
        // Update the RC section (lock/unlock field) based on the owner selection.
        updateRCSectionForOwner(businessIndex, ownerIndex, isOther);
        // Transfer the W‑2 “Res Comp” value into this business block’s RC field.
        updateBusinessOwnerResCom(businessIndex);
        // Recalculate the global RC field from all business blocks.
        updateAggregateResComp();
        // Recalculate all totals so that employer taxes are calculated with the new RC value.
        recalculateTotals();
    });
    

    const opt = document.createElement('option');
    opt.value = fillName;
    opt.textContent = fillName;
    nameSelect.appendChild(opt);

    // For auto-filled fields, disable selection
    nameSelect.disabled = true;
    nameSelect.style.backgroundColor = '#f0f0f0';
    container.appendChild(nameSelect);

    // Reasonable Compensation if S-Corp
    if (showReasonableComp) {
        // For the third owner (which is "Other") we want it unlocked
        let isOtherOwner = (ownerIndex === 3);
        const resCompSection = createResCompSection(businessIndex, ownerIndex, isOtherOwner);
        container.appendChild(resCompSection);
    }

    // Ownership % label & input
    const pctLabel = document.createElement('label');
    pctLabel.textContent = 'Ownership %:';
    container.appendChild(pctLabel);

    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.id = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.name = `business${businessIndex}OwnerPercent${ownerIndex}`;
    pctInput.value = ''; // blank initially

    if (ownerIndex < 3) {
        // Allow user input for owners 1 and 2
        pctInput.readOnly = false;
        pctInput.addEventListener('input', function() {
            autoCalculateLastOwner(businessIndex);
            updateOwnerApportionment(businessIndex);
        });
    } else {
        // Owner 3 is auto-calculated so keep it read-only
        pctInput.readOnly = true;
        pctInput.style.backgroundColor = '#f0f0f0';
    }
    container.appendChild(pctInput);

    // Apportionment display area
    const apportionmentContainer = document.createElement('div');
    apportionmentContainer.id = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    container.appendChild(apportionmentContainer);

    return container;
}

function handleTwoOwnersInput(businessIndex, ownerIndex) {
    const owner1Input = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const owner2Input = document.getElementById(`business${businessIndex}OwnerPercent2`);

    const val1 = parseFloat(owner1Input.value || '0');
    const val2 = parseFloat(owner2Input.value || '0');

    if (ownerIndex === 1) {
        if (!isNaN(val1)) {
            owner2Input.value = (100 - val1).toFixed(6);
        } else {
            owner2Input.value = '';
        }
    } else {
        if (!isNaN(val2)) {
            owner1Input.value = (100 - val2).toFixed(6);
        } else {
            owner1Input.value = '';
        }
    }

    validateTotalOwnership(businessIndex, 2);
    updateOwnerApportionment(businessIndex);
}

function autoCalculateLastOwner(businessIndex) {
    const owner1Input = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const owner2Input = document.getElementById(`business${businessIndex}OwnerPercent2`);
    const owner3Input = document.getElementById(`business${businessIndex}OwnerPercent3`);

    const val1 = parseFloat(owner1Input.value || '0');
    const val2 = parseFloat(owner2Input.value || '0');

    if (!isNaN(val1) && !isNaN(val2)) {
        const remaining = 100 - (val1 + val2);
        owner3Input.value = remaining.toFixed(6);
    } else {
        owner3Input.value = '';
    }

    validateTotalOwnership(businessIndex, 3);
    updateOwnerApportionment(businessIndex);
}

function validateTotalOwnership(businessIndex, numOwners) {
    let totalOwnership = 0;
    let anyValueEntered = false;

    for (let i = 1; i <= numOwners; i++) {
        const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerInput) continue;
        const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
        removeDisclaimer(ownerContainerId, 'OWNERSHIP_SUM');
        ownerInput.classList.remove('input-error');
        
        const val = parseFloat(ownerInput.value.trim() || '0');
        if (val !== 0) anyValueEntered = true;
        totalOwnership += (isNaN(val) ? 0 : val);
    }

    if (!anyValueEntered) {
        // If no ownership entered at all, skip disclaimers. 
        return;
    }

    // Must be exactly 100
    const diff = Math.abs(totalOwnership - 100);
    if (diff > 0.0001) {
        for (let i = 1; i <= numOwners; i++) {
            const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
            addDisclaimer(
                ownerContainerId,
                'OWNERSHIP_SUM',
                `Total ownership must equal 100%. Currently it is ${totalOwnership.toFixed(6)}%.`
            );
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.add('input-error');
            }
        }
    } else {
        // If good, remove disclaimers
        for (let i = 1; i <= numOwners; i++) {
            const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
            removeDisclaimer(ownerContainerId, 'OWNERSHIP_SUM');
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.remove('input-error');
            }
        }
    }
}

function updateBusinessNet(index) {
    // 1. Calculate Net (Income - Expenses)
    const incomeField = document.getElementById(`business${index}Income`);
    const expensesField = document.getElementById(`business${index}Expenses`);
    const incomeVal = unformatCurrency(incomeField?.value || '0');
    const expensesVal = unformatCurrency(expensesField?.value || '0');
    const netVal = incomeVal - expensesVal;
    
    const netField = document.getElementById(`business${index}Net`);
    if (netField) {
        netField.value = formatCurrency(String(netVal));
        netField.style.color = (netVal < 0) ? 'red' : 'black';
    }
    
    // 2. Clear any overrides and remove previous disclaimers
    for (let key in apportionmentOverrides) {
        delete apportionmentOverrides[key];
    }
    removeDisclaimer(`businessEntry_${index}`, 'DEPENDENT_WAGE');
    removeDisclaimer(`businessEntry_${index}`, 'SCORP_DEPENDENT_WAGE');
    
    // 3. Compute total dependent wages for this business
    let totalDependentWages = 0;
    for (let depIndex in dependentBizMap) {
        const entry = dependentBizMap[depIndex];
        if (entry && entry.businessIndex === index) {
            totalDependentWages += entry.wage;
        }
    }
    
    // 4. For S‑Corp, compute total Reasonable Compensation from owner fields
    let totalReasonableComp = 0;
    const businessTypeVal = document.getElementById(`business${index}Type`)?.value || '';
    if (businessTypeVal === 'S-Corp') {
        const numOwnersSelect = document.getElementById(`numOwnersSelect${index}`);
        if (numOwnersSelect) {
            const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
            for (let i = 1; i <= numOwners; i++) {
                const compStr = document.getElementById(`business${index}OwnerComp${i}`)?.value || '0';
                totalReasonableComp += unformatCurrency(compStr);
            }
        }
    }
    
    // 5. Check if dependent wages exceed expenses (if the expenses field has been blurred)
    if (blurredExpenses[index] && expensesVal > 0) {
        if (totalDependentWages > expensesVal) {
            addDisclaimer(
                `businessEntry_${index}`,
                'DEPENDENT_WAGE',
                `Dependent Wages (${formatCurrency(String(totalDependentWages))}) Exceeds Expenses`
            );
        }
    }
    
// 6. For S‑Corp: if (dependent wages + reasonable compensation) exceed expenses, show combined disclaimer
if (businessTypeVal === 'S-Corp') {
    const combined = totalDependentWages + totalReasonableComp;
    // Only show error if there is any reasonable compensation,
    // dependent wages are at least $1, and the combined total exceeds expenses.
    if (totalReasonableComp > 0 && totalDependentWages >= 1 && combined > expensesVal) {
        addDisclaimer(
            `businessEntry_${index}`,
            'SCORP_DEPENDENT_WAGE',
            `Dependent Wages (${formatCurrency(String(totalDependentWages))}) + Reasonable Compensation (${formatCurrency(String(totalReasonableComp))}) exceeds this S‑Corp's Expenses (${formatCurrency(String(expensesVal))}).`
        );
    }
}
    
    // 7. Update apportionment and other totals
    updateOwnerApportionment(index);
    checkSCorpReasonableComp(index);
    if (businessTypeVal === 'C-Corp') {
        showCcorpTaxDue(index);
    }
    recalculateTotals();
}

const apportionmentOverrides = {};

function updateOwnerApportionment(businessIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 1) return;

    // getCurrentPortions => returns the array of portion amounts
    const portions = getCurrentPortions(businessIndex, netVal, numOwners);
    for (let i = 1; i <= numOwners; i++) {
        showApportionment(businessIndex, i, portions[i - 1]);
    }

    // If C‑Corp => also show tax due (only if ownership=100)
    const bizTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (bizTypeVal === 'C-Corp') {
        showCcorpTaxDue(businessIndex);
    }

    // S‑Corp => re‑check reasonable comp disclaimers
    checkSCorpReasonableComp(businessIndex);
    recalculateTotals();
}

function showApportionment(businessIndex, ownerIndex, portion) {
    const bizTypeSelect = document.getElementById(`business${businessIndex}Type`);
    if (!bizTypeSelect) return;
    const bizType = bizTypeSelect.value.trim();

    // For Schedule‑C, skip apportionment statements.
    if (bizType === 'Schedule-C' || bizType === 'C-Corp') {
        return;
    }

    // Retrieve the net value of the business.
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);

    // If the net amount is negative and the calculated portion is positive, force it negative.
    if (netVal < 0 && portion > 0) {
        portion = -portion;
    }
    
    const containerId = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    let apportionmentEl = document.getElementById(`apportionment-${containerId}`);
    if (!apportionmentEl) {
        apportionmentEl = document.createElement("div");
        apportionmentEl.id = `apportionment-${containerId}`;
        apportionmentEl.style.fontWeight = "bold";
        apportionmentEl.style.marginTop = "8px";
        const container = document.getElementById(containerId);
        if (container) container.appendChild(apportionmentEl);
    }
    apportionmentEl.innerHTML = "";

    if (portion === null) return;

    // Determine the prefix text based on business type.
    const businessTypeLower = (document.getElementById(`business${businessIndex}Type`)?.value || '').trim().toLowerCase();
    let prefixText = '';
    if (businessTypeLower === 'partnership') {
        prefixText = `Apportionment of Self-Employment for Owner ${ownerIndex} is `;
    } else {
        prefixText = `Apportionment of Owner ${ownerIndex} is `;
    }

    const prefixSpan = document.createElement("span");
    prefixSpan.textContent = prefixText;
    prefixSpan.classList.add("apportionment-text");
    apportionmentEl.appendChild(prefixSpan);

    const amountSpan = document.createElement("span");
    // Use formatCurrency to format the amount. Note that formatCurrency returns a parenthesized string for negatives.
    if (portion < 0) {
        amountSpan.textContent = `${formatCurrency(String(portion))} (Loss)`;
        amountSpan.style.color = "red";
    } else {
        amountSpan.textContent = `${formatCurrency(String(portion))} (Income)`;
        amountSpan.style.color = "green";
    }
    apportionmentEl.appendChild(amountSpan);

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    const numOwners = numOwnersSelect ? parseInt(numOwnersSelect.value, 10) : 0;
    if (numOwners > 1) {
        const upBtn = document.createElement("button");
        upBtn.textContent = "▲";
        upBtn.classList.add("arrow-btn");
        upBtn.addEventListener("click", (e) => {
            e.preventDefault();
            incrementApportionment(businessIndex, ownerIndex);
        });
        apportionmentEl.appendChild(upBtn);

        const downBtn = document.createElement("button");
        downBtn.textContent = "▼";
        downBtn.classList.add("arrow-btn");
        downBtn.addEventListener("click", (e) => {
            e.preventDefault();
            decrementApportionment(businessIndex, ownerIndex);
        });
        apportionmentEl.appendChild(downBtn);
    }
}

function incrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);  // Could be positive, zero, or negative
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 2) return;  // No increment if only 1 owner

    // 1) Get the current portion array (or generate from ownership % + overrides).
    let portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // 2) Increase the chosen owner's portion by 1
    portions[ownerIndex - 1] += 1;

    // 3) Now the sum may exceed (or be greater/less) the net. Let's fix leftover:
    let leftover = netVal - portions.reduce((a, b) => a + b, 0);

    // 4) Redistribute leftover among other owners
    //    - If leftover is positive, we add +1 to other owners until leftover = 0
    //    - If leftover is negative, we subtract -1 from other owners until leftover = 0
    //    (We do up to 100 passes to avoid infinite loops).
    let maxPasses = 100;
    outerLoop: while (leftover !== 0 && maxPasses > 0) {
        for (let i = 0; i < numOwners; i++) {
            if (i === (ownerIndex - 1)) continue; // skip the just-incremented owner
            if (leftover === 0) break outerLoop;

            if (leftover > 0) {
                portions[i] += 1;
                leftover--;
            } else {
                // leftover < 0
                portions[i] -= 1;
                leftover++;
            }
        }
        maxPasses--;
    }

    // 5) Store these portions as overrides (so they persist).
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }

    // 6) Now re-display with updated overrides
    updateOwnerApportionment(businessIndex);
}

function decrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 2) return;

    let portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // 1) Decrease the chosen owner's portion by 1
    portions[ownerIndex - 1] -= 1;

    // 2) Fix leftover
    let leftover = netVal - portions.reduce((a, b) => a + b, 0);

    // 3) Redistribute leftover among other owners
    let maxPasses = 100;
    outerLoop: while (leftover !== 0 && maxPasses > 0) {
        for (let i = 0; i < numOwners; i++) {
            if (i === (ownerIndex - 1)) continue;
            if (leftover === 0) break outerLoop;

            if (leftover > 0) {
                portions[i] += 1;
                leftover--;
            } else {
                portions[i] -= 1;
                leftover++;
            }
        }
        maxPasses--;
    }

    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }

    updateOwnerApportionment(businessIndex);
}

function showCcorpTaxDue(businessIndex) {
    const container = document.getElementById(`cCorpTaxDueContainer${businessIndex}`);
    if (!container) return;

    const bizType = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (bizType !== 'C-Corp') {
        container.style.display = 'none';
        container.innerHTML = '';
        container.classList.remove('ccorp-tax-due');
        return;
    }

    // If ownership not complete, hide the box and exit
    if (!isCcorpOwnershipComplete(businessIndex)) {
        container.style.display = 'none';
        container.innerHTML = '';
        container.classList.remove('ccorp-tax-due');
        return;
    }

    // Show container for C-Corp
    container.style.display = 'block';
    container.classList.add('ccorp-tax-due');
    container.innerHTML = ''; // Clear previous content

    // 1. Get net value:
    const netVal = unformatCurrency(
        document.getElementById(`business${businessIndex}Net`)?.value || '0'
    );

    // 2. Calculate tax due based on client's ownership fraction
    let clientFractionOfNet = getClientOwnershipPortionForCcorp(businessIndex, netVal);
    if (netVal <= 0) {
        clientFractionOfNet = 0;
    }
    let rawTaxDue = Math.round(0.21 * clientFractionOfNet);
    const overrideKey = `ccorpTaxDue-biz${businessIndex}`;
    let finalTaxDue = (apportionmentOverrides[overrideKey] !== undefined)
        ? apportionmentOverrides[overrideKey]
        : rawTaxDue;

    // 5. Attach listeners to each owner field so that only Client 1 and Client 2 are included:
    if (bizType === 'C-Corp') {
        const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
        const numOwners = numOwnersSelect ? parseInt(numOwnersSelect.value, 10) || 0 : 0;

        // Define update function using getClientOwnershipPortionForCcorp:
        const updateCombinedClientAmount = () => {
            const netVal = unformatCurrency(
                document.getElementById(`business${businessIndex}Net`)?.value || '0'
            );
            const clientAmount = getClientOwnershipPortionForCcorp(businessIndex, netVal);
            showBlackDisclaimer(
                `Our client's apportionment of income: ${formatCurrency(clientAmount.toString())}`,
                `cCorpTaxDueContainer${businessIndex}`
            );
        };

        // Attach 'input' listeners to all owner percentage inputs and 'change' listeners to the owner name selects.
        for (let i = 1; i <= numOwners; i++) {
            const ownerPctInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            const ownerNameSelect = document.getElementById(`business${businessIndex}OwnerName${i}`);
            if (ownerPctInput) {
                ownerPctInput.addEventListener('input', updateCombinedClientAmount);
            }
            if (ownerNameSelect) {
                ownerNameSelect.addEventListener('change', updateCombinedClientAmount);
            }
        }
        // Call once immediately so the disclaimer shows up.
        updateCombinedClientAmount();
    }

    // 3. Display Tax Due information:
    const bizName = document.getElementById(`businessName_${businessIndex}`)?.value || `Business ${businessIndex}`;
    const labelSpan = document.createElement('span');
    labelSpan.textContent = `Tax Due for Client's portion of ${bizName}: `;
    container.appendChild(labelSpan);

    const amountSpan = document.createElement('span');
    amountSpan.id = `ccorpTaxDueAmount-biz${businessIndex}`;
    amountSpan.textContent = formatCurrency(finalTaxDue.toString());
    amountSpan.style.color = '#ff4f4f';
    amountSpan.style.fontWeight = 'bold';
    amountSpan.style.fontSize = '21px';
    amountSpan.style.textDecoration = 'underline double';
    container.appendChild(amountSpan);

    // 4. Up/down arrow buttons:
    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';
    upBtn.classList.add('arrow-btn');
    upBtn.addEventListener('click', (e) => {
        e.preventDefault();
        incrementCcorpTaxDue(businessIndex);
    });
    container.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';
    downBtn.classList.add('arrow-btn');
    downBtn.addEventListener('click', (e) => {
        e.preventDefault();
        decrementCcorpTaxDue(businessIndex);
    });
    container.appendChild(downBtn);

}

function getClientOwnershipPortionForCcorp(businessIndex, netVal) {
    // netVal is the total net, but we only want the slice belonging to the couple.
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return 0;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    
    let totalClientOwnershipPercent = 0;

    // Loop through each owner, check if the "ownerName" is client or spouse (when MFJ).
    for (let i = 1; i <= numOwners; i++) {
        const ownerNameEl = document.getElementById(`business${businessIndex}OwnerName${i}`);
        const ownerPctEl = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerNameEl || !ownerPctEl) continue;

        const ownerNameVal = ownerNameEl.value.trim();
        const pctVal = parseFloat(ownerPctEl.value.trim() || '0');
        if (isNaN(pctVal)) continue;

        if (filingStatus === 'Married Filing Jointly') {
            // If ownerNameVal is either clientFirstName or spouseFirstName, add it in
            if (ownerNameVal === clientFirstName || ownerNameVal === spouseFirstName) {
                totalClientOwnershipPercent += pctVal;
            }
        } else {
            // Non-MFJ => only add if it's the main client’s name
            if (ownerNameVal === clientFirstName) {
                totalClientOwnershipPercent += pctVal;
            }
        }
    }

    // Convert percent to fraction of net
    let clientFractionOfNet = netVal * (totalClientOwnershipPercent / 100);
    if (clientFractionOfNet < 0) {
        // If net is negative, we ultimately set tax due to 0 anyway,
        // but let's keep the fraction as is if you need it.
    }
    return clientFractionOfNet;
}

function isCcorpOwnershipComplete(businessIndex) {
    const bizType = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (bizType !== 'C-Corp') return false;

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return false;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 1) return false;

    let total = 0;
    for (let i = 1; i <= numOwners; i++) {
        const pctInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!pctInput) return false;
        const val = parseFloat(pctInput.value.trim() || '0');
        total += val;
    }
    return (Math.abs(total - 100) < 0.0001);
}

function getCurrentPortions(businessIndex, netVal, numOwners) {
    let percentages = [];
    let totalEntered = 0;
    let blankCount = 0;

    for (let i = 1; i <= numOwners; i++) {
        const input = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        const valStr = input ? input.value.trim() : "";
        if (valStr === "") {
            percentages.push(null);
            blankCount++;
        } else {
            const num = parseFloat(valStr);
            if (isNaN(num)) {
                percentages.push(null);
                blankCount++;
            } else {
                percentages.push(num);
                totalEntered += num;
            }
        }
    }

    if (blankCount === numOwners) {
        return new Array(numOwners).fill(0).map((_, i) => {
            const overrideKey = `biz${businessIndex}-owner${i+1}`;
            return apportionmentOverrides[overrideKey] ?? 0;
        });
    }

    const remaining = 100 - totalEntered;
    const equalShare = (blankCount > 0) ? remaining / blankCount : 0;
    for (let i = 0; i < numOwners; i++) {
        if (percentages[i] === null) {
            percentages[i] = equalShare;
        }
    }

    let basePortions = percentages.map(pct => Math.round(netVal * (pct / 100)));
    const allocated = basePortions.reduce((a, b) => a + b, 0);
    const diff = netVal - allocated;
    if (diff !== 0 && basePortions.length) {
        basePortions[0] += diff;
    }

    let finalPortions = [...basePortions];
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        if (overrideKey in apportionmentOverrides) {
            finalPortions[i - 1] = apportionmentOverrides[overrideKey];
        }
    }
    let finalSum = finalPortions.reduce((a, b) => a + b, 0);
    let leftover = netVal - finalSum;

    if (leftover !== 0) {
        let idxToFix = finalPortions.findIndex((amt, idx) => {
            const overrideKey = `biz${businessIndex}-owner${idx+1}`;
            return !(overrideKey in apportionmentOverrides);
        });
        if (idxToFix === -1) idxToFix = 0;
        finalPortions[idxToFix] += leftover;
    }
    return finalPortions;
}

function checkSCorpReasonableComp(businessIndex) {
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (businessTypeVal !== 'S-Corp') return;

    const expensesVal = unformatCurrency(
        document.getElementById(`business${businessIndex}Expenses`)?.value || '0'
    );

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;

    const numOwners = parseInt(numOwnersSelect.value, 10);
    if (isNaN(numOwners) || numOwners < 1) return;

    let totalComp = 0;
    let compFields = [];

    for (let i = 1; i <= numOwners; i++) {
        const compEl = document.getElementById(`business${businessIndex}OwnerComp${i}`);
        if (!compEl) continue;
        const compVal = unformatCurrency(compEl.value || '0');
        totalComp += compVal;
        compFields.push(compEl);
    }

    // Remove old disclaimers
    removeDisclaimer(`dynamicOwnerFields${businessIndex}`, 'SCORP_COMP');
    compFields.forEach(f => f.classList.remove('input-error'));

    // Show a disclaimer if total comp is bigger than total expenses
    if (totalComp > expensesVal) {
        addDisclaimer(
            `dynamicOwnerFields${businessIndex}`,
            'SCORP_COMP',
            `Total owners' Reasonable Compensation (${formatCurrency(totalComp.toString())}) 
             exceeds this S-Corp's Expenses (${formatCurrency(expensesVal.toString())}).`
        );
        compFields.forEach(f => f.classList.add('input-error'));
    }
}

function updateBusinessOwnerDropdowns(businessIndex) {
    const ownerSelects = document.querySelectorAll(
      `#dynamicOwnerFields${businessIndex} select[id^="business${businessIndex}OwnerName"]`
    );
    if (!ownerSelects.length) return;
  
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
  
    let baseOptions;
    if (filingStatus === 'Married Filing Jointly') {
      baseOptions = [clientFirstName, spouseFirstName, 'Other'];
    } else {
      baseOptions = [clientFirstName, 'Other'];
    }
  
    // Gather selected names from the dropdowns
    const selectedNames = [];
    ownerSelects.forEach(select => {
      if (select.value && baseOptions.includes(select.value)) {
        selectedNames.push(select.value);
      }
    });
  
    ownerSelects.forEach(select => {
      // Skip auto‐filled dropdown for Client 1 (assumed to be owner 1)
      if (select.id.endsWith('OwnerName1')) return;
  
      const currentVal = select.value;
      while (select.firstChild) {
        select.removeChild(select.firstChild);
      }
      const pleaseOpt = document.createElement('option');
      pleaseOpt.value = 'Please Select';
      pleaseOpt.textContent = 'Please Select';
      pleaseOpt.disabled = true;
      select.appendChild(pleaseOpt);
  
      baseOptions.forEach(name => {
        const isTakenElsewhere = (selectedNames.includes(name) && name !== currentVal);
        if (!isTakenElsewhere) {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        }
      });
  
      if ([...select.options].some(opt => opt.value === currentVal)) {
        select.value = currentVal;
      } else {
        select.value = 'Please Select';
        select.disabled = true;
      }
    });
  
    // Optionally update the business header as well
    const header = document.getElementById(`businessNameHeading${businessIndex}`);
    if (header) {
      header.textContent = updateBusinessHeader(businessIndex);
    }
}

function incrementCcorpTaxDue(businessIndex) {
    const key = `ccorpTaxDue-biz${businessIndex}`;
    const baseAmount = getBaseCcorpTaxDue(businessIndex);
    
    // if no override yet, default to base
    let current = (apportionmentOverrides[key] !== undefined)
        ? apportionmentOverrides[key]
        : baseAmount;
    current += 1; // increment by 1
    apportionmentOverrides[key] = current;
    showCcorpTaxDue(businessIndex);
}

function decrementCcorpTaxDue(businessIndex) {
    const key = `ccorpTaxDue-biz${businessIndex}`;
    const baseAmount = getBaseCcorpTaxDue(businessIndex);

    let current = (apportionmentOverrides[key] !== undefined)
        ? apportionmentOverrides[key]
        : baseAmount;
    // If you want to allow it to go negative, you can do so, but presumably 0 is the floor:
    current -= 1;
    if (current < 0) {
        current = 0; // if you prefer no negative overrides for tax due
    }
    apportionmentOverrides[key] = current;
    showCcorpTaxDue(businessIndex);
}

function getBaseCcorpTaxDue(businessIndex) {
    const netVal = unformatCurrency(
        document.getElementById(`business${businessIndex}Net`)?.value || '0'
    );
    if (netVal <= 0) return 0;

    let clientFraction = getClientOwnershipPortionForCcorp(businessIndex, netVal);
    if (clientFraction < 0) clientFraction = 0;

    let rawTaxDue = 0.21 * clientFraction;
    return Math.round(rawTaxDue);
}

function updateBusinessOwnerResCom(businessIndex) {
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    let numOwners = numOwnersSelect ? parseInt(numOwnersSelect.value, 10) : 1;
    if (!numOwners || numOwners < 1) { numOwners = 1; }
    
    const ownerTotals = {};
    for (let i = 1; i <= numOwners; i++) {
      const ownerSelect = document.getElementById(`business${businessIndex}OwnerName${i}`);
      if (ownerSelect) {
        ownerTotals[ownerSelect.value.trim()] = 0;
      }
    }
    
    // Sum wages for this business from the global w2WageMap.
    for (let key in w2WageMap) {
      if (w2WageMap.hasOwnProperty(key)) {
        const mapping = w2WageMap[key];
        if (mapping.businessIndex === businessIndex) {
          const clientName = mapping.client || (document.getElementById('firstName').value.trim() || 'Client 1');
          if (ownerTotals.hasOwnProperty(clientName)) {
            ownerTotals[clientName] += mapping.wage;
          } else {
            ownerTotals[clientName] = mapping.wage;
          }
        }
      }
    }
        
    for (let i = 1; i <= numOwners; i++) {
      const ownerSelect = document.getElementById(`business${businessIndex}OwnerName${i}`);
      const compField = document.getElementById(`business${businessIndex}OwnerComp${i}`);
      if (ownerSelect && compField) {
        const ownerName = ownerSelect.value.trim();
        const computedValue = formatCurrency(String(ownerTotals[ownerName] || 0));
        
        // If the field is NOT in override mode, update its value and default.
        if (compField.readOnly) {
          compField.value = computedValue;
          compField.dataset.defaultValue = computedValue;
        } else {
          // In override mode, we want to update the stored default
          // so that when override is toggled off, it reverts to the current computed value.
          // If the user hasn't manually changed it (i.e. it still matches the stored default),
          // then update the stored default.
          if (compField.value === compField.dataset.defaultValue) {
            compField.value = computedValue;
            compField.dataset.defaultValue = computedValue;
          } else {
            // Alternatively, always update the stored default even if the user has changed the field.
            // Uncomment the following line if you prefer that behavior:
            compField.dataset.defaultValue = computedValue;
          }
        }
      } else {
        //console.warn(`[updateBusinessOwnerResCom] Missing element for owner ${i} in business ${businessIndex}`);
      }
    }
    updateAggregateResComp();
}

function updateAllBusinessOwnerResCom() {
    const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    for (let i = 1; i <= numBusinesses; i++) {
      updateBusinessOwnerResCom(i);
    }
}
  
//---------------------------------------------------//
// 10. DYNAMIC GENERATION OF SCHEDULE E FIELDS + NET //
//---------------------------------------------------//

document.getElementById('numScheduleEs').addEventListener('input', function() {
    const eCount = parseInt(this.value, 10);
    const container = document.getElementById('scheduleEsContainer');
    container.innerHTML = '';
    if (!isNaN(eCount) && eCount > 0) {
        for (let i = 1; i <= eCount; i++) {
            createScheduleEFields(container, i);
        }
    }
});

function createScheduleEFields(container, index) {
    const scheduleEDiv = document.createElement('div');
    scheduleEDiv.classList.add('schedule-e-entry');

    const heading = document.createElement('h3');
    heading.textContent = `Schedule-E ${index}`;
    scheduleEDiv.appendChild(heading);

    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Income`, `Schedule E-${index} Income:`);
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Expenses`, `Schedule E-${index} Expenses:`);
    createLabelAndTextField(scheduleEDiv, `scheduleE${index}Net`, `Schedule E-${index} Net (Income - Expenses):`);

    container.appendChild(scheduleEDiv);

    const netField = document.getElementById(`scheduleE${index}Net`);
    netField.readOnly = true;

    const incomeField = document.getElementById(`scheduleE${index}Income`);
    const expensesField = document.getElementById(`scheduleE${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        updateScheduleENet(index);
        recalculateTotals();
    });

    expensesField.addEventListener('blur', function() {
        updateScheduleENet(index);
        recalculateTotals();
    });
}

function updateScheduleENet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`scheduleE${index}Income`).value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`scheduleE${index}Expenses`).value || '0');
    const netVal = incomeVal - expensesVal;
    document.getElementById(`scheduleE${index}Net`).value = formatCurrency(netVal.toString());
}

function calcAutoUnrecaptured1250() {
  let total = 0;
  const dispCount = parseInt(document.getElementById('numPropertyDisps')?.value || '0', 10);
  for (let i = 1; i <= dispCount; i++) {
    const ltGain  = unformatCurrency(document.getElementById(`disp${i}LTGain`)?.value || '0');
    const deprec  = unformatCurrency(document.getElementById(`disp${i}AccumDep`)?.value || '0');
    total += Math.max(0, Math.min(ltGain, deprec));
  }
  return total;
}

/**
 * Computes your 3.8% Net Investment Income Tax.
 * NIIT = 3.8% × min( netInvIncome, max(0, MAGI − threshold) )
 */
function updateNetInvestmentTax() {
  
  // 1a) Sum *all* Schedule E “Net” fields (rental real estate, royalties, etc.)
  let scheduleENetTotal = 0;
  const eCount = parseInt(document.getElementById('numScheduleEs')?.value || '0', 10);
  for (let i = 1; i <= eCount; i++) {
    const netStr = document.getElementById(`scheduleE${i}Net`)?.value || '0';
    scheduleENetTotal += unformatCurrency(netStr);
  }
  
  // 1b) Any manual “Adjustments” you’ve entered (e.g. passive-loss carryforwards)
  const adjustments      = getFieldValue('passiveActivityLossAdjustments') 
                         + getFieldValue('otherIncome'); // change/add fields here if you need

  // — only count **positive** net capital gains for NIIT —
  const netCap = getFieldValue('longTermCapitalGains')
               + getFieldValue('shortTermCapitalGains');
  const positiveNetCapGain = Math.max(0, netCap);

  // build your investment income bundle *without* letting losses drive it negative
  const totalInvestmentIncome =
        getFieldValue('taxableInterest')
      + getFieldValue('taxableDividends')      // ordinary dividends
      + getFieldValue('pensions')
      + scheduleENetTotal
      + adjustments;

  // 2) MAGI & threshold
  const magi    = getFieldValue('totalAdjustedGrossIncome');
  const status  = document.getElementById('filingStatus').value;
  const THRESHOLDS = {
    "Single":                 200000,
    "Head of Household":      200000,
    "Married Filing Jointly": 250000,
    "Married Filing Separately":125000
  };
  const threshold = THRESHOLDS[status] || THRESHOLDS["Single"];
  
  // 3) Compute the smaller of (a) totalInvestmentIncome or (b) MAGI–threshold
  const excess      = Math.max(0, magi - threshold);
  // never let the NIIT base go below zero
  const taxableBase = Math.max(0, Math.min(totalInvestmentIncome, excess));

  // 4) NIIT = 3.8% of that base, rounded to the dollar
  const niit = Math.round(taxableBase * 0.038);
  document.getElementById('netInvestmentTax').value = formatCurrency(String(niit));
}

//---------------------------------------------------//
// 11. REAL-TIME CALCULATIONS FOR INCOME/ADJUSTMENTS //
//---------------------------------------------------//

// Calculates the client portion for non–C-Corp businesses
function getClientOwnershipPortion(businessIndex, netVal) {
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
    
    // For Single (or any non‑MFJ filer), assume the first owner is the client.
    if (filingStatus !== 'Married Filing Jointly') {
        const ownerPctEl = document.getElementById(`business${businessIndex}OwnerPercent1`);
        const pctVal = ownerPctEl ? parseFloat(ownerPctEl.value.trim() || "0") : 100;
        return netVal * (pctVal / 100);
    }
    
    // For Married Filing Jointly, sum the percentages for both client and spouse.
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) {
        return netVal;
    }
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    let totalClientOwnershipPercent = 0;
    for (let i = 1; i <= numOwners; i++) {
        const ownerNameEl = document.getElementById(`business${businessIndex}OwnerName${i}`);
        const ownerPctEl = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerNameEl || !ownerPctEl) continue;
        const ownerNameVal = ownerNameEl.value.trim();
        const pctVal = parseFloat(ownerPctEl.value.trim() || "0");
        if (ownerNameVal === clientFirstName || ownerNameVal === spouseFirstName) {
            totalClientOwnershipPercent += pctVal;
        }
    }
    return netVal * (totalClientOwnershipPercent / 100);
}

// Sums up the wages from all dynamic W-2 blocks
function sumW2Wages() {
  const w2Container = document.getElementById('w2sContainer');
  let totalW2Wages      = 0;
  let totalMedicareWages= 0;
  let totalSSWages      = 0;

  if (w2Container) {
    Object.values(w2WageMap).forEach(mapping => {
      // Box 1
      totalW2Wages       += mapping.wage;
      // Box 5 override
      totalMedicareWages += mapping.medicareWages  > 0
                             ? mapping.medicareWages
                             : mapping.wage;
      // Box 3 override
      totalSSWages       += mapping.socialSecurityWages > 0
                             ? mapping.socialSecurityWages
                             : mapping.wage;
    });
  }

  return { totalW2Wages, totalMedicareWages, totalSSWages };
}

let isRecalculating = false;

function recalculateTotals() {

    if (isRecalculating) return;
    isRecalculating = true;
    
    // ensure every W-2 block has been pushed into the map
    document.querySelectorAll('.w2-block').forEach(block => updateW2Mapping(block.id));

    recalculateDeductions();

    // 1. Get updated wage values.
    let {totalW2Wages} = sumW2Wages();

    // 2. If any W-2 has Medicare Wages, override total Wages with the Medicare total.
    let finalWages = totalW2Wages;

    // 3. Update the "Wages, Salaries, Tips:" field in the main summary
    document.getElementById('wages').value = formatCurrency(String(parseInt(finalWages)));

    updateAllBusinessOwnerResCom();

    // *** NEW: Update FUTA and Unemployment fields ***
    updateStaticUnemploymentFields();

    const reasonableCompensation = getFieldValue('reasonableCompensation');
    const taxableInterest = getFieldValue('taxableInterest');
    const taxableIRA = getFieldValue('taxableIRA');
    const taxableDividends = getFieldValue('taxableDividends');
    const iraDistributions = getFieldValue('iraDistributions');
    const pensions = getFieldValue('pensions');
    const longTermCapitalGains = getFieldValue('longTermCapitalGains');
    const shortTermCapitalGains = getFieldValue('shortTermCapitalGains');
    const otherIncome = getFieldValue('otherIncome');
    const interestPrivateBonds = getFieldValue('interestPrivateBonds');
    const passiveActivityLossAdjustments = getFieldValue('passiveActivityLossAdjustments');

    let businessesNetTotal = 0;
    const numBusinessesVal = parseInt(
      document.getElementById('numOfBusinesses').value || '0',
      10
    );

    for (let i = 1; i <= numBusinessesVal; i++) {
      // grab this business’s net
      const netVal = unformatCurrency(
        document.getElementById(`business${i}Net`)?.value || '0'
      );

        const type = document
          .getElementById(`business${i}Type`)?.value
          .trim() || '';

        if (type === 'C-Corp') {
          continue;
        } 
        else if (type === 'Schedule-C') {
          businessesNetTotal += netVal;
        } 
        else if (type === 'S-Corp' || type === 'Partnership') {
          businessesNetTotal += getClientOwnershipPortion(i, netVal);
        }
    }

    // Update the new "Net Total of All Businesses" field
    const netTotalBusinessesInput = document.getElementById('netTotalBusinesses');
    if (netTotalBusinessesInput) {
        netTotalBusinessesInput.value = formatCurrency(String(businessesNetTotal));
    }

    let scheduleEsNetTotal = 0;
    const numScheduleEsVal = parseInt(document.getElementById('numScheduleEs')?.value || '0', 10);
    for (let i = 1; i <= numScheduleEsVal; i++) {
        const netValStr = document.getElementById(`scheduleE${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        scheduleEsNetTotal += netVal;
    }

    const totalIncomeVal = 
        finalWages +
        taxableInterest +
        taxableIRA +
        taxableDividends +
        iraDistributions +
        pensions +
        longTermCapitalGains +
        shortTermCapitalGains +
        businessesNetTotal +
        scheduleEsNetTotal +
        otherIncome +
        interestPrivateBonds +
        passiveActivityLossAdjustments;

    document.getElementById('totalIncome').value = 
        isNaN(totalIncomeVal) 
            ? '' 
            : formatCurrency(String(parseInt(totalIncomeVal)));
    
        const totalOfAllIncomeVal = totalIncomeVal;
        document.getElementById('totalOfAllIncome').value = isNaN(totalOfAllIncomeVal) 
            ? '' 
            : formatCurrency(String(parseInt(totalOfAllIncomeVal)));

    updateSelfEmploymentTax();

    const halfSETax = getFieldValue('halfSETax');
    const retirementDeduction = getFieldValue('retirementDeduction');
    const medicalReimbursementPlan = getFieldValue('medicalReimbursementPlan');
    const SEHealthInsurance = getFieldValue('SEHealthInsurance');
    const alimonyPaid = getFieldValue('alimonyPaid');
    const otherAdjustments = getFieldValue('otherAdjustments');

    const totalAdjustedGrossIncomeVal =
        totalOfAllIncomeVal -
        halfSETax -
        retirementDeduction -
        medicalReimbursementPlan -
        SEHealthInsurance -
        alimonyPaid -
        otherAdjustments;

        document.getElementById('totalAdjustedGrossIncome').value = formatCurrency(String(parseInt(totalAdjustedGrossIncomeVal)));

        // *** Calculate Child Tax Credit based on AGI and dependent information ***
        recalculateChildTaxCredit();

        updateTaxableIncome();
        updateNetInvestmentTax();
        updateAggregateResComp();
        calculateEmployerEmployeeTaxes();
        updateTotalTax();

        isRecalculating = false;
}

//-----------------------------------------------------//
// 12. REAL-TIME CALCULATIONS FOR DEDUCTIONS + TAXABLE //
//-----------------------------------------------------//

function recalculateDeductions() {
   // 1) Grab the RAW inputs
   const medical                    = getFieldValue('medical');
   const stateAndLocalTaxes         = getFieldValue('stateAndLocalTaxes');
   const otherTaxesFromSchK1        = getFieldValue('otherTaxesFromSchK-1');
   const interest                   = getFieldValue('interest');
   const contributions              = getFieldValue('contributions');
   const otherDeductions            = getFieldValue('otherDeductions');
   const carryoverLoss              = getFieldValue('carryoverLoss');
   const casualtyAndTheftLosses     = getFieldValue('casualtyAndTheftLosses');
   const miscellaneousDeductions    = getFieldValue('miscellaneousDeductions');
   const standardOrItemizedDeduction= getFieldValue('standardOrItemizedDeduction');

   // 2) Sum _just_ the itemized detail fields
   const detailSum =
       medical
     + stateAndLocalTaxes
     + otherTaxesFromSchK1
     + interest
     + contributions
     + otherDeductions
     + carryoverLoss
     + casualtyAndTheftLosses
     + miscellaneousDeductions;

    // 3) Pick between detail or standard deduction
    const year   = parseInt(document.getElementById('year').value, 10);
    const status = document.getElementById('filingStatus').value;
     const STD = {
        2022: {
            "Single":                   12950,
            "Married Filing Jointly":   25900,
            "Married Filing Separately":12950,
            "Head of Household":        19400,
            "Qualifying Widow(er)":     25900
          },
        2023: {
          "Single":                   13850,
          "Married Filing Jointly":   27700,
          "Married Filing Separately":13850,
          "Head of Household":        20800,
          "Qualifying Widow(er)":     27700
        },
        2024: {
          "Single":                   14600,
          "Married Filing Jointly":   29200,
          "Married Filing Separately":14600,
          "Head of Household":        21900,
          "Qualifying Widow(er)":     29200
        },
        2025: {
            "Single":                   15000,
            "Married Filing Jointly":   30000,
            "Married Filing Separately":15000,
            "Head of Household":        22500,
            "Qualifying Widow(er)":     30000
        }
        
      };
    const baseStd = STD[year]?.[status] || 0;

    // how many are 65 or older?

    const count65 = parseInt(document.getElementById('olderthan65').value, 10) || 0;

    // how many are blind? (your dropdown uses "Zero","One","Two")
    const blindVal = document.getElementById('blind').value;
    const countBlind =
      blindVal === 'One' ? 1 :
      blindVal === 'Two' ? 2 :
      0;

    // extra $500 per person
    const extraStd = 500 * (count65 + countBlind);

    // adjusted standard deduction
    const adjustedStd = baseStd + extraStd;

    // 4) Choose the greater of itemized vs. adjusted standard
    const totalDeductionsVal = Math.max(detailSum, adjustedStd);

    formatCurrency(totalDeductionsVal);

    // 5) Write it back
    document.getElementById('totalDeductions').value = formatCurrency(totalDeductionsVal);

    // 6) And recalc taxable income & state tax
    updateTaxableIncome();
}

function updateTaxableIncome() {
    // 1. AGI as raw number
    const agi = getFieldValue('totalAdjustedGrossIncome');

    // 2. Total deductions (standard or itemized)
    const totalDeductions = getFieldValue('totalDeductions');

    // 3. Qualified Business Deduction ONLY pulled here
    const qbd = getFieldValue('qualifiedBusinessDeduction');

    // 4. Final taxable income
    const taxableIncome = agi - totalDeductions - qbd;

    // 5. Display as integer
    document.getElementById('taxableIncome').value =
        isNaN(taxableIncome)
            ? ''
            : formatCurrency(String(parseInt(taxableIncome, 10)));

    // 6. Now that taxable income changed, recalculate all the taxes
    updateTotalTax();
}

//-----------------------------------------------------------//
// 13. ATTACHING EVENT LISTENERS FOR REAL-TIME CALCULATIONS  //
//-----------------------------------------------------------//

const fieldsToWatch = [
    'wages',
    'reasonableCompensation',
    'taxExemptInterest',
    'taxableInterest',
    'taxableIRA',
    'taxableDividends',
    'qualifiedDividends',
    'iraDistributions',
    'pensions',
    'longTermCapitalGains',
    'shortTermCapitalGains',
    'unrecapturedSection1250Gain',
    'collectiblesGain',
    'otherIncome',
    'interestPrivateBonds',
    'passiveActivityLossAdjustments',
    'qualifiedBusinessDeduction',
    'halfSETax',
    'retirementDeduction',
    'medicalReimbursementPlan',
    'SEHealthInsurance',
    'alimonyPaid',
    'otherAdjustments'
];

fieldsToWatch.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateTotals);
        field.addEventListener('change', recalculateTotals);
    }
});

// Tax & Credit inputs that feed directly into updateTotalTax
const taxCreditFields = [
  'AMT',
  'otherTaxes',
  'foreignTaxCredit',
  'creditForChildAndDependentCareExpenses',
  'generalBusinessCredit',
  'childTaxCredit',
  'otherCredits',
  'additionalMedicareTax',
  'netInvestmentTax',
  'selfEmploymentTax',
  'educationCredits'
];

taxCreditFields.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateTotalTax);
    el.addEventListener('change', updateTotalTax);
  }
});

// Payments inputs that drive refund/balance due
const paymentsFields = [
  'withholdings',
  'withholdingsOnAdditionalMedicareWages',
  'estimatedTaxPayments',
  'otherPaymentsAndCredits',
  'penalty'
];

paymentsFields.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateFederalPayments);
    el.addEventListener('change', updateFederalPayments);
  }
});

// Add specific listener for year changes to recalculate Child Tax Credit
const yearField = document.getElementById('year');
if (yearField) {
    yearField.addEventListener('change', function() {
        recalculateChildTaxCredit();
    });
}

const deductionFields = [
    'medical',
    'stateAndLocalTaxes',
    'otherTaxesFromSchK-1',
    'interest',
    'contributions',
    'otherDeductions',
    'carryoverLoss',
    'casualtyAndTheftLosses',
    'miscellaneousDeductions',
    'standardOrItemizedDeduction'
];

deductionFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateDeductions);
        field.addEventListener('change', recalculateDeductions);
    }
});

document.querySelectorAll("input[id*='OwnerComp']").forEach(input => {
    input.addEventListener('blur', () => {
         updateAggregateResComp();
         recalculateTotals();
    });
});

//-----------------------------------------------------------//
// 14. TURNS INPUT FIELD BORDER COLOR GREEN TO CONFIRM INPUT //
//-----------------------------------------------------------//

document.addEventListener('blur', function(event) {
    if (event.target.matches('input, select')) {
        if (event.target.value.trim() !== '') {
            event.target.classList.add('input-completed');
        } else {
            event.target.classList.remove('input-completed');
        }
    }
}, true);

//------------------------------------------//
// 15. INITIALIZE CALCULATIONS ON PAGE LOAD //
//------------------------------------------//

document.addEventListener('DOMContentLoaded', function() {

    recalculateTotals();
    recalculateDeductions();
    updateBlindOptions();
    updateOlderThan65Options();
    undoStack.push(getFormSnapshot());

    // Open the W-2 collapsible by adding the "active" class
    const w2Container = document.getElementById('w2sContainer');
    if (w2Container) {
      w2Container.classList.add('active');
    }

    document.getElementById('addW2Btn').addEventListener('click', addW2Block);

    const addBizBtn = document.getElementById('addBusinessBtn');
    if (addBizBtn) {
        addBizBtn.addEventListener('click', handleAddBusinessClick);
    }

    const allCurrencyFields = document.querySelectorAll('.currency-field');
    allCurrencyFields.forEach((field) => {
        field.addEventListener('blur', () => {
            field.value = formatCurrency(field.value);
        });
    });
});

//--------------------------------------//
// 16. AUTO-COPY STATE TO "SELECTSTATE" //
//--------------------------------------//

document.getElementById('state').addEventListener('input', function() {
    const selectStateEl = document.getElementById('selectState');
    selectStateEl.value = this.value;
    selectStateEl.classList.add('auto-copied');
    
    // NEW: Trigger update on all W-2 blocks so FUTA and "Unemployment 2022 - 2025:" update automatically
    const w2Blocks = document.querySelectorAll('.w2-block');
    w2Blocks.forEach(block => {
      // Find the wages input field in each W-2 block
      const wagesInput = block.querySelector("input[id^='w2Wages_']");
      if (wagesInput) {
        // Dispatch a "blur" event so updateW2Mapping() is re-run for that block
        wagesInput.dispatchEvent(new Event('blur'));
      }
    });
});

//-----------------------------//
// 17. HANDLE "ENTER" AS "TAB" //
//-----------------------------//

document.getElementById('taxForm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
  
      let allElements = Array.from(this.elements).filter(el =>
        el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
      );
      let visibleElements = allElements.filter(el => el.offsetParent !== null);
      let index = visibleElements.indexOf(document.activeElement);
  
      if (index > -1 && index < visibleElements.length - 1) {
        visibleElements[index + 1].focus();
      } else if (index === visibleElements.length - 1) {
        visibleElements[0].focus();
      }
    }
});

//--------------------------//
// 18. COLLAPSIBLE SECTIONS //
//--------------------------//

function toggleCollapsible(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('active');
}

//-------------------//
// 19. SHOW RED DISCLAIMER //
//-------------------//

function showRedDisclaimer(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimer = document.getElementById(`disclaimer-${containerId}`);
    if (!disclaimer) {
      disclaimer = document.createElement('div');
      disclaimer.id = `disclaimer-${containerId}`;
      disclaimer.classList.add('red-disclaimer');
      container.appendChild(disclaimer);
    }
    disclaimer.textContent = message;
}
  
function showBlackDisclaimer(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimer = document.getElementById(`black-disclaimer-${containerId}`);
    if (!disclaimer) {
        disclaimer = document.createElement('div');
        disclaimer.id = `black-disclaimer-${containerId}`;
        disclaimer.classList.add('black-disclaimer');  // add our CSS class
        disclaimer.style.fontWeight = 'bold';
        disclaimer.style.marginTop = '0px';
        container.appendChild(disclaimer);
    }
    disclaimer.textContent = message;
}

//-------------------//
// 20. NOTES FEATURE //
//-------------------//

const notesButton = document.getElementById('notesButton');
const notesContainer = document.getElementById('notesContainer');
const boldBtn = document.getElementById('notesBoldBtn');
const highlightBtn = document.getElementById('notesHighlightBtn');

notesButton.addEventListener('click', (e) => {
  e.stopPropagation();
  notesContainer.classList.toggle('hidden');
});

document.addEventListener('click', function(event) {
  if (!notesContainer.contains(event.target) && event.target !== notesButton) {
    if (!notesContainer.classList.contains('hidden')) {
      notesContainer.classList.add('hidden');
    }
  }
});

boldBtn.addEventListener('click', () => {
  document.execCommand('bold', false, null);
});

highlightBtn.addEventListener('click', () => {
    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.isCollapsed) {
      return;
    }
    const highlightColor = document.body.classList.contains('dark-mode')
      ? 'fuchsia'
      : 'yellow';
    let isHighlighted = false;
    if (currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentNode;
      if (parent && parent.style && parent.style.backgroundColor === highlightColor) {
        isHighlighted = true;
      }
    }
    if (isHighlighted) {
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand('hiliteColor', false, highlightColor);
    }
});

//----------------------//
// 21. UNDO/REDO BUTTON //
//----------------------//

let undoStack = [];
let redoStack = [];

function getFormSnapshot() {
    const form = document.getElementById('taxForm');
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());
    return JSON.stringify(dataObj);
}

// Given a JSON snapshot string, restore all fields
function restoreFormSnapshot(snapshot) {
    // (All your existing restore logic is unchanged)
    const dataObj = JSON.parse(snapshot);

    if (dataObj.filingStatus !== undefined) {
        const filingStatusEl = document.getElementById('filingStatus');
        filingStatusEl.value = dataObj.filingStatus;
        filingStatusEl.dispatchEvent(new Event('change'));
    }
    if (dataObj.numOfBusinesses !== undefined) {
        document.getElementById('numOfBusinesses').value = dataObj.numOfBusinesses;
    }
    if (dataObj.numScheduleEs !== undefined) {
        document.getElementById('numScheduleEs').value = dataObj.numScheduleEs;
    }
    if (dataObj.numberOfDependents !== undefined) {
        document.getElementById('numberOfDependents').value = dataObj.numberOfDependents;
    }

    // Rebuild dynamic sections
    // (businessContainer, scheduleEsContainer, dependentsContainer)
    // Then re-populate each field
    for (let key in dataObj) {
        const fields = document.getElementsByName(key);
        if (fields && fields.length > 0) {
            fields[0].value = dataObj[key];
        }
    }

    const numBiz = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    for (let i = 1; i <= numBiz; i++) {
        const ownersSelect = document.getElementById(`numOwnersSelect${i}`);
        if (ownersSelect) {
            ownersSelect.dispatchEvent(new Event('change'));
        }
    }

    for (let i = 1; i <= numBiz; i++) {
        updateBusinessNet(i);
        checkSCorpReasonableComp(i);
    }
    const eCount = parseInt(document.getElementById('numScheduleEs').value || '0', 10);
    for (let i = 1; i <= eCount; i++) {
        updateScheduleENet(i);
    }
    recalculateTotals();
    recalculateDeductions();
}

document.getElementById('undoButton').addEventListener('click', function() {
    if (undoStack.length > 1) {
        const current = undoStack.pop();
        redoStack.push(current);
        const previous = undoStack[undoStack.length - 1];
        restoreFormSnapshot(previous);
    }
});

document.getElementById('redoButton').addEventListener('click', function() {
    if (redoStack.length > 0) {
        const snapshot = redoStack.pop();
        undoStack.push(snapshot);
        restoreFormSnapshot(snapshot);
    }
});

(function() {
    document.getElementById('taxForm').addEventListener('change', function(e) {
        if (e.target.matches('select')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    });
    document.getElementById('taxForm').addEventListener('blur', function(e) {
        if (e.target.matches('input, textarea')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    }, true);
})();

document.addEventListener('DOMContentLoaded', function() {
    undoStack.push(getFormSnapshot());
});

//-----------------------------------------//
// 22. PLACEHOLDERS TO AVOID BREAKING CODE //
//-----------------------------------------//

function saveBusinessDetailData() {
    const container = document.getElementById('businessContainer');
    if (!container) return;
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
        const fieldId = input.id;
        if (fieldId) {
            businessDetailStore[fieldId] = input.value;
        }
    });
}

function populateBusinessDetailFields(index) {
    const fields = [
      `business${index}Type`,
      `business${index}Income`,
      `business${index}Expenses`,
      `business${index}Net`,
      `numOwnersSelect${index}`,
      `scheduleCLabel${index}`,
      `scheduleCOwner${index}`
    ];
  
    fields.forEach(f => {
      if (businessDetailStore[f] !== undefined) {
        const el = document.getElementById(f);
        if (el) {
          el.value = businessDetailStore[f];
          if (f === `business${index}Type`) {
            el.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  
    const numOwnersSelectEl = document.getElementById(`numOwnersSelect${index}`);
    if (numOwnersSelectEl) {
      if (businessDetailStore[`numOwnersSelect${index}`]) {
        numOwnersSelectEl.value = businessDetailStore[`numOwnersSelect${index}`];
      }
      const numOwners = parseInt(numOwnersSelectEl.value, 10) || 0;
      createOwnerFields(index, numOwners);
  
      for (let i = 1; i <= numOwners; i++) {
        const nameFieldId = `business${index}OwnerName${i}`;
        if (businessDetailStore[nameFieldId] !== undefined) {
          const nameFieldEl = document.getElementById(nameFieldId);
          if (nameFieldEl) {
            nameFieldEl.value = businessDetailStore[nameFieldId];
          }
        }
        const pctFieldId = `business${index}OwnerPercent${i}`;
        if (businessDetailStore[pctFieldId] !== undefined) {
          const pctFieldEl = document.getElementById(pctFieldId);
          if (pctFieldEl) {
            pctFieldEl.value = businessDetailStore[pctFieldId];
          }
        }
        const compFieldId = `business${index}OwnerComp${i}`;
        if (businessDetailStore[compFieldId] !== undefined) {
          const compFieldEl = document.getElementById(compFieldId);
          if (compFieldEl) {
            compFieldEl.value = businessDetailStore[compFieldId];
          }
        }
        
        // Validate total ownership for each owner if numOwnersSelectEl exists.
        validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);
      }
    }
    
    updateBusinessNet(index);
    checkSCorpReasonableComp(index);
    // Alternatively, if you need to call validateTotalOwnership outside the loop,
    // check that numOwnersSelectEl is not null:
    if (numOwnersSelectEl) {
      validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);
    }
}  

//----------------------//
// 23. DARK MODE TOGGLE //
//----------------------//

const darkModeCheckbox = document.getElementById('darkModeToggle');

darkModeCheckbox.addEventListener('change', () => {
  if (darkModeCheckbox.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('preferred-theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('preferred-theme', 'light');
  }
});

//-------------------//
// 24. W2 CODE BOXES //
//-------------------//

// Define the available IRS code options
const w2CodeOptions = [
    { value: "A", text: "A - Uncollected Social Security tax or Railroad Retirement Tax Act (RRTA) tax on tips" },
    { value: "B", text: "B - Uncollected Medicare tax on tips" },
    { value: "C", text: "C - Taxable costs of group-term life insurance over $50,000" },
    { value: "D", text: "D - Elective deferral under a Section 401(k) cash or arrangement plan" },
    { value: "E", text: "E - Elective deferral under a Section 403(b) salary reduction agreement" },
    { value: "F", text: "F - Elective deferral under a Section 408(k)(6) salary reduction SEP" },
    { value: "G", text: "G - Elective deferrals and employer contributions (including nonelective deferrals) to a Section 457(b) deferred compensation plan" },
    { value: "H", text: "H - Elective deferrals and employer contributions (including nonelective deferrals) to a Section 501(c)(18)(D) tax-exempt organization plan" },
    { value: "J", text: "J - Nontaxable sick pay" },
    { value: "K", text: "K - 20% excise tax on excess golden parachute payments" },
    { value: "L", text: "L - Substantiated employee business expense reimbursements" },
    { value: "M", text: "M - Uncollected Social Security or RRTA tax on taxable cost of group-term life insurance over $50,000 (former employees only)" },
    { value: "N", text: "N - Uncollected Medicare tax on taxable cost of group-term life insurance over $50,000 (former employees only)" },
    { value: "P", text: "P - Excludable moving expense reimbursements paid directly to a member of the U.S. Armed Forces" },
    { value: "Q", text: "Q - Nontaxable combat pay for military personnel" },
    { value: "R", text: "R - Employer contributions to an Archer medical savings account (MSA)" },
    { value: "S", text: "S - Employee salary reduction contributions under a Section 408(p) SIMPLE plan" },
    { value: "T", text: "T - Adoption benefits" },
    { value: "V", text: "V - Income from exercise of nonstatutory stock option(s)" },
    { value: "W", text: "W - Employer contributions (including amounts the employee elected to contribute using a Section 125 (cafeteria) plan) to an employee's health savings account (HSA)" },
    { value: "Y", text: "Y - Deferrals under a Section 409A nonqualified deferred compensation plan" },
    { value: "Z", text: "Z - Income under a nonqualified deferred compensation plan that fails to satisfy Section 409A" },
    { value: "AA", text: "AA - Designated Roth contributions under a Section 401(k) plan" },
    { value: "BB", text: "BB - Designated Roth contributions under a Section 403(b) plan" },
    { value: "DD", text: "DD - Cost of employer-sponsored health coverage" },
    { value: "EE", text: "EE - Designated Roth contributions under a governmental Section 457(b) plan" },
    { value: "FF", text: "FF - Permitted benefits under a qualified small employer health reimbursement arrangement" },
    { value: "GG", text: "GG - Income from qualified equity grants under Section 83(i)" },
    { value: "HH", text: "HH - Aggregate deferrals under Section 83(i) elections as of the close of the calendar year" },
    { value: "II", text: "II - Medicaid waiver payments excluded from gross income under Notice 2014-7" }
];

// Creates the dynamic code boxes inside the W2 container.
function createW2CodeBoxes(numCodes, container) {
    container.innerHTML = ""; // Clear any existing boxes in this container
    for (let i = 0; i < numCodes; i++) {
      // Create a wrapper div for each W-2 code box
      const boxDiv = document.createElement("div");
      boxDiv.classList.add("w2-code-box");
  
      // --- "Select Code" field group ---
      const selectGroup = document.createElement("div");
      selectGroup.classList.add("form-group");
  
      const codeLabel = document.createElement("label");
      // Use a unique id that combines the container id and code index
      codeLabel.setAttribute("for", "W2Code_" + container.id + "_" + (i + 1));
      codeLabel.textContent = "Please Select Code from Dropdown:";
      selectGroup.appendChild(codeLabel);
  
      const dropdown = document.createElement("select");
      dropdown.name = "W2Code_" + container.id + "_" + (i + 1);
      dropdown.id = "W2Code_" + container.id + "_" + (i + 1);
      dropdown.classList.add("w2-code-dropdown");
      populateW2Dropdown(dropdown);
      dropdown.addEventListener("change", updateW2CodeDropdowns);
      selectGroup.appendChild(dropdown);
      boxDiv.appendChild(selectGroup);
  
      // --- "Enter Dollar ($) Amount" field group ---
      const amountGroup = document.createElement("div");
      amountGroup.classList.add("form-group");
  
      const amountLabel = document.createElement("label");
      amountLabel.setAttribute("for", "W2CodeAmount_" + container.id + "_" + (i + 1));
      amountLabel.textContent = "Enter Dollar ($) Amount:";
      amountGroup.appendChild(amountLabel);
  
      const amountInput = document.createElement("input");
      amountInput.type = "text";
      amountInput.name = "W2CodeAmount_" + container.id + "_" + (i + 1);
      amountInput.id = "W2CodeAmount_" + container.id + "_" + (i + 1);
      amountInput.classList.add("w2-code-amount");
  
      // On blur, format the input and enforce a minimum value of 1
      amountInput.addEventListener("blur", function() {
        const rawValue = unformatCurrency(amountInput.value);
        if (rawValue < 1) {
          amountInput.value = formatCurrency("1");
        } else {
          amountInput.value = formatCurrency(String(rawValue));
        }
      });
      amountGroup.appendChild(amountInput);
      boxDiv.appendChild(amountGroup);
  
      container.appendChild(boxDiv);
    }
}

// Helper function to populate a given dropdown with the available IRS code options.
function populateW2Dropdown(dropdown) {
    dropdown.innerHTML = "";
  
    // Add a default "Please Select" option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Please Select";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    dropdown.appendChild(defaultOpt);
  
    w2CodeOptions.forEach(function(option) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.text;
      dropdown.appendChild(opt);
    });
}

// Update all dropdowns so that codes chosen in one are removed from the others.
function updateW2CodeDropdowns() {
    const dropdowns = document.querySelectorAll(".w2-code-dropdown");
    const selectedCodes = [];
  
    // Gather selected values from each dropdown
    dropdowns.forEach(function(dd) {
      if (dd.value) {
        selectedCodes.push(dd.value);
      }
    });
  
    // Update each dropdown's options based on other selections.
    dropdowns.forEach(function(dd) {
      const currentSelection = dd.value;
      dd.innerHTML = "";
  
      // Add the default option first.
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "Please Select";
      defaultOpt.disabled = true;
      defaultOpt.selected = (currentSelection === "");
      dd.appendChild(defaultOpt);
  
      w2CodeOptions.forEach(function(option) {
        // Skip this option if it's selected in another dropdown (unless it's the current selection)
        if (selectedCodes.indexOf(option.value) > -1 && option.value !== currentSelection) {
          return;
        }
  
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        if (option.value === currentSelection) {
          opt.selected = true;
        }
        dd.appendChild(opt);
      });
    });
}

function updateAllW2BusinessDropdowns() {
    const businessNameDropdowns = document.querySelectorAll("select[id^='w2BusinessName_']");
    businessNameDropdowns.forEach(dropdown => {
        // Only update dropdowns that are visible.
        if (dropdown.parentElement && dropdown.parentElement.style.display !== 'none') {
            populateBusinessNameDropdown(dropdown);
        }
    });
}

function populateBusinessNameDropdown(dropdown) {
    // Remember the current selected value.
    const currentValue = dropdown.value;
    dropdown.innerHTML = '';
    
    // Create the default option.
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Please Select';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    
    const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    let optionExists = false;
    for (let i = 1; i <= numBusinesses; i++) {
        const businessName = document.getElementById(`businessName_${i}`)?.value || `Business ${i}`;
        const option = document.createElement('option');
        option.value = businessName;
        option.textContent = businessName;
        dropdown.appendChild(option);
        
        // Check if the current option matches the stored value.
        if (businessName === currentValue) {
            optionExists = true;
        }
    }
    
    // Restore previous selection if it still exists.
    if (optionExists) {
        dropdown.value = currentValue;
    }
}   

function addW2Block() {
    w2Counter++;
    // Create container for one W-2 block
    const w2Block = document.createElement('div');
    w2Block.classList.add('w2-block');
    w2Block.id = 'w2Block_' + w2Counter;    

    // Header for this W-2
    const header = document.createElement('h3');
    header.textContent = 'W-2 #' + w2Counter;
    header.style.cursor = 'pointer';
    w2Block.appendChild(header);  

    // Create a container for the collapsible content
    const collapsibleContent = document.createElement('div');
    collapsibleContent.classList.add('collapsible-content', 'active');
    w2Block.appendChild(collapsibleContent);

    // --- W-2 Name ---
    const nameGroup = document.createElement('div');
    nameGroup.classList.add('form-group');
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'w2Name_' + w2Counter);
    nameLabel.textContent = 'W-2 Name:';
    nameGroup.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'w2Name_' + w2Counter;
    nameInput.name = 'w2Name_' + w2Counter;
    nameGroup.appendChild(nameInput);
    collapsibleContent.appendChild(nameGroup);

    // Function to update header text based on W-2 Name and dropdown selection
    function updateHeader() {
        let companyName = nameInput.value.trim();
        if (companyName === '') {
            companyName = 'W-2 #' + w2Counter;
        }
        if (document.getElementById('filingStatus').value === 'Married Filing Jointly' && whoseW2Select) {
            const selectedName = whoseW2Select.value;
            if (selectedName) {
                header.textContent = companyName + ' - ' + selectedName;
                return;
            }
        }
        header.textContent = companyName;
    }

    // Update header when name input loses focus
    nameInput.addEventListener('blur', updateHeader);

    // Declare dropdown variable so it can be used in updateHeader
    let whoseW2Select = null;

    // If filing status is "Married Filing Jointly", add the dropdown for "Whose W-2 is this?"
    if (document.getElementById('filingStatus').value === 'Married Filing Jointly') {
        const whoseW2Group = document.createElement('div');
        whoseW2Group.classList.add('form-group');

        const whoseW2Label = document.createElement('label');
        whoseW2Label.setAttribute('for', 'w2WhoseW2_' + w2Counter);
        whoseW2Label.textContent = 'Whose W-2 is this?:';
        whoseW2Group.appendChild(whoseW2Label);

        const whoseW2Select = document.createElement('select');
        whoseW2Select.id = 'w2WhoseW2_' + w2Counter;
        whoseW2Select.name = 'w2WhoseW2_' + w2Counter;
        whoseW2Select.required = true;

        // Add a "Please Select" option
        const pleaseSelectOption = document.createElement('option');
        pleaseSelectOption.value = '';
        pleaseSelectOption.textContent = 'Please Select';
        pleaseSelectOption.disabled = true;
        pleaseSelectOption.selected = true;
        whoseW2Select.appendChild(pleaseSelectOption);

        // Retrieve names from the form fields;
        // if the spouse field is blank, default its value to "Client 2"
        const clientFirstName = document.getElementById('firstName').value.trim() || 'Client 1';
        const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';

        // Add both options
        const clientOption = document.createElement('option');
        clientOption.value = clientFirstName;
        clientOption.textContent = clientFirstName;
        whoseW2Select.appendChild(clientOption);

        const spouseOption = document.createElement('option');
        spouseOption.value = spouseFirstName;
        spouseOption.textContent = spouseFirstName;
        whoseW2Select.appendChild(spouseOption);

        whoseW2Group.appendChild(whoseW2Select);
        collapsibleContent.appendChild(whoseW2Group);

        // Update header when the dropdown changes
        whoseW2Select.addEventListener('change', updateHeader);
        
        whoseW2Select.addEventListener('change', () => {
        updateW2Mapping();
        recalculateTotals();
        });
    }

    // --- Is This W-2 Compensation from Client's Business? ---
    const isClientBusinessGroup = document.createElement('div');
    isClientBusinessGroup.classList.add('form-group');
    const isClientBusinessLabel = document.createElement('label');
    isClientBusinessLabel.setAttribute('for', 'w2IsClientBusiness_' + w2Counter);
    isClientBusinessLabel.textContent = 'Is This W-2 Compensation from Client\'s Business?';
    isClientBusinessGroup.appendChild(isClientBusinessLabel);

    const isClientBusinessSelect = document.createElement('select');
    isClientBusinessSelect.id = 'w2IsClientBusiness_' + w2Counter;
    isClientBusinessSelect.name = 'w2IsClientBusiness_' + w2Counter;
    isClientBusinessSelect.required = true;

    const isClientBusinessOptionDefault = document.createElement('option');
    isClientBusinessOptionDefault.value = '';
    isClientBusinessOptionDefault.textContent = 'Please Select';
    isClientBusinessOptionDefault.disabled = true;
    isClientBusinessOptionDefault.selected = true;
    isClientBusinessSelect.appendChild(isClientBusinessOptionDefault);

    const isClientBusinessOption1 = document.createElement('option');
    isClientBusinessOption1.value = 'Yes';
    isClientBusinessOption1.textContent = 'Yes';
    isClientBusinessSelect.appendChild(isClientBusinessOption1);

    const isClientBusinessOption2 = document.createElement('option');
    isClientBusinessOption2.value = 'No';
    isClientBusinessOption2.textContent = 'No';
    isClientBusinessSelect.appendChild(isClientBusinessOption2);
    isClientBusinessGroup.appendChild(isClientBusinessSelect);
    collapsibleContent.appendChild(isClientBusinessGroup);

        // Add this to the section where you handle the "Is This W-2 Compensation from Client's Business?" field
        isClientBusinessSelect.addEventListener('change', function () {
            updateW2Mapping();  // Recalculate W-2 mapping, including unemployment tax, based on the selected value
            recalculateTotals(); // Update totals after recalculation
        });

    const businessNameGroup = document.createElement('div');
    businessNameGroup.classList.add('form-group');
    businessNameGroup.style.display = 'none';

    const businessNameLabel = document.createElement('label');
    businessNameLabel.setAttribute('for', 'w2BusinessName_' + w2Counter);
    businessNameLabel.textContent = 'Please Select Business Name:';
    businessNameGroup.appendChild(businessNameLabel);

    const businessNameSelect = document.createElement('select');
    businessNameSelect.id = 'w2BusinessName_' + w2Counter;
    businessNameSelect.name = 'w2BusinessName_' + w2Counter;
    businessNameGroup.appendChild(businessNameSelect);
    collapsibleContent.appendChild(businessNameGroup);

    isClientBusinessSelect.addEventListener('change', function() {
        if (this.value === 'Yes') {
            businessNameGroup.style.display = 'block';
            populateBusinessNameDropdown(businessNameSelect);
        } else {
            businessNameGroup.style.display = 'none';
        }
    });

    document.getElementById('numOfBusinesses').addEventListener('input', function() {
        updateAllW2BusinessDropdowns();
    });
    
    // --- Wages, Salaries, Tips, and Other Compensation ---
    const wagesGroup = document.createElement('div');
    wagesGroup.classList.add('form-group');
    const wagesLabel = document.createElement('label');
    wagesLabel.setAttribute('for', 'w2Wages_' + w2Counter);
    wagesLabel.textContent = 'Wages, Salaries, Tips, and Other Compensation:';
    wagesGroup.appendChild(wagesLabel);
    const wagesInput = document.createElement('input');
    wagesInput.type = 'text';
    wagesInput.id = 'w2Wages_' + w2Counter;
    wagesInput.name = 'w2Wages_' + w2Counter;
    wagesInput.classList.add('currency-field');
    wagesGroup.appendChild(wagesInput);
    collapsibleContent.appendChild(wagesGroup);

    // When the wage input loses focus, format its value and update the mapping
    wagesInput.addEventListener('blur', function() {
        let value = unformatCurrency(wagesInput.value || '0');
        if (value < 0) { value = 0; }
        wagesInput.value = formatCurrency(String(value));
        updateW2Mapping();
    });

     // Also update mapping when the business name dropdown changes
     businessNameSelect.addEventListener('change', updateW2Mapping);
     isClientBusinessSelect.addEventListener('change', updateW2Mapping);

     // This function checks that both a positive wage and a valid business selection exist
     // before storing the mapping.
     function updateW2Mapping() {

        const isClientBus = document.getElementById('w2IsClientBusiness_' + w2Counter).value;
        const isBusinessRelated = (isClientBus === 'Yes');
        
        let wageVal = unformatCurrency(wagesInput.value || '0');
        let medicareWagesVal = unformatCurrency(medicareWagesInput.value || '0');
        let finalWage = (medicareWagesVal > 0) ? medicareWagesVal : wageVal;
        let ssWagesVal = unformatCurrency(ssWagesInput.value || '0');
        let finalSSWage = (ssWagesVal > 0) ? ssWagesVal : wageVal;

        if (finalWage <= 0) {
            delete w2WageMap[w2Block.id];
            return;
        }
        
        // Build or update the mapping object
        let mapping = {
            wage: wageVal,
            medicareWages: medicareWagesVal,
            socialSecurityWages: finalSSWage,
            isBusinessRelated: isBusinessRelated,
            futaValue: 0,
            unemploymentTax: 0
        };
        if (isBusinessRelated) {
            const stateTaxSelect = document.getElementById('w2StateUnemploymentTax_' + w2Counter);
            // FUTA: calculate and assign
            mapping.futaValue = calculateFUTA(finalWage, stateTaxSelect.value);
        
            // Unemployment 2022-2025: calculate and assign
            const taxYear = document.getElementById('year').value;
            const stateAbbrev = document.getElementById('state').value;
            const stateTaxKey = getStateTaxKey(stateAbbrev);
            mapping.unemploymentTax = calculateUnemploymentTax(taxYear, stateTaxKey, finalWage, "Yes");
        }
        // ── Determine whose W-2 this is (only if MFJ and a valid selection) ──
        const client1 = document.getElementById('firstName').value.trim() || 'Client 1';
        const client2 = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
        let who = client1;
        if (document.getElementById('filingStatus').value === 'Married Filing Jointly') {
          const sel = document.getElementById('w2WhoseW2_' + w2Counter).value.trim();
          if (sel === client1 || sel === client2) who = sel;
        }
        mapping.client = who;

        if (isBusinessRelated) {
            let businessName = businessNameSelect.value.trim();
            if (businessName === '' && businessNameSelect.options.length > 1) {
                businessName = businessNameSelect.options[1].value;
                businessNameSelect.value = businessName;
            }
            let numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
            let businessIndex = null;
            for (let i = 1; i <= numBusinesses; i++) {
                let currentBizName = document.getElementById(`businessName_${i}`)?.value.trim() || `Business ${i}`;
                if (currentBizName === businessName) {
                    businessIndex = i;
                    break;
                }
            }
            mapping.businessIndex = businessIndex;
        } else {
            mapping.businessIndex = null;
        }

        w2WageMap[w2Block.id] = mapping;
        recalculateTotals();
    }

    window.updateW2Mapping = updateW2Mapping;

    // --- Federal Income Tax Withheld ---
    const federalTaxGroup = document.createElement('div');
    federalTaxGroup.classList.add('form-group');
    const federalTaxLabel = document.createElement('label');
    federalTaxLabel.setAttribute('for', 'w2FederalTaxWithheld_' + w2Counter);
    federalTaxLabel.textContent = 'Federal Income Tax Withheld:';
    federalTaxGroup.appendChild(federalTaxLabel);
    const federalTaxInput = document.createElement('input');
    federalTaxInput.type = 'text';
    federalTaxInput.id = 'w2FederalTaxWithheld_' + w2Counter;
    federalTaxInput.name = 'w2FederalTaxWithheld_' + w2Counter;
    federalTaxInput.classList.add('currency-field');
    federalTaxGroup.appendChild(federalTaxInput);
    collapsibleContent.appendChild(federalTaxGroup);   

    // --- Social Security Wages --- 
    const ssWagesGroup = document.createElement('div');
    ssWagesGroup.classList.add('form-group');
    const ssWagesLabel = document.createElement('label');
    ssWagesLabel.setAttribute('for', 'w2SSWages_' + w2Counter);
    ssWagesLabel.textContent = 'Social Security Wages:';
    ssWagesGroup.appendChild(ssWagesLabel);

    const ssWagesInput = document.createElement('input');
    ssWagesInput.type = 'text';
    ssWagesInput.id = 'w2SSWages_' + w2Counter;
    ssWagesInput.name = 'w2SSWages_' + w2Counter;
    ssWagesInput.classList.add('currency-field');
    ssWagesGroup.appendChild(ssWagesInput);

    collapsibleContent.appendChild(ssWagesGroup);

    ssWagesInput.addEventListener('blur', function () {
    let ssVal = unformatCurrency(ssWagesInput.value || '0');
    ssWagesInput.value = (ssVal > 0) ? formatCurrency(String(ssVal)) : '';
    updateW2Mapping();
    recalculateTotals();
    });

    // --- Social Security Tax Withheld ---
    const SSTaxGroup = document.createElement('div');
    SSTaxGroup.classList.add('form-group');
    const SSTaxLabel = document.createElement('label');
    SSTaxLabel.setAttribute('for', 'w2SocialSecurityTaxWithheld_' + w2Counter);
    SSTaxLabel.textContent = 'Social Security Tax Withheld:';
    SSTaxGroup.appendChild(SSTaxLabel);
    const SSTaxInput = document.createElement('input');
    SSTaxInput.type = 'text';
    SSTaxInput.id = 'w2SocialSecurityTaxWithheld_' + w2Counter;
    SSTaxInput.name = 'w2SocialSecurityTaxWithheld_' + w2Counter;
    SSTaxInput.classList.add('currency-field');
    SSTaxGroup.appendChild(SSTaxInput);
    collapsibleContent.appendChild(SSTaxGroup);

    // --- Medicare Wages and Tips ---
    const medicareWagesGroup = document.createElement('div');
    medicareWagesGroup.classList.add('form-group');
    const medicareWagesLabel = document.createElement('label');
    medicareWagesLabel.setAttribute('for', 'w2MedicareWages_' + w2Counter);
    medicareWagesLabel.textContent = 'Medicare Wages and Tips:';
    medicareWagesGroup.appendChild(medicareWagesLabel);
    const medicareWagesInput = document.createElement('input');
    medicareWagesInput.type = 'text';
    medicareWagesInput.id = 'w2MedicareWages_' + w2Counter;
    medicareWagesInput.name = 'w2MedicareWages_' + w2Counter;
    medicareWagesInput.classList.add('currency-field');
    medicareWagesGroup.appendChild(medicareWagesInput);
    collapsibleContent.appendChild(medicareWagesGroup);

    // Handle "Medicare Wages and Tips" Override
    medicareWagesInput.addEventListener('blur', function () {
        let medicareVal = unformatCurrency(medicareWagesInput.value || '0');
        medicareWagesInput.value = (medicareVal > 0) ? formatCurrency(String(medicareVal)) : ''; 
        updateW2Mapping();
        recalculateTotals();
    });

    // Handle "Wages, Salaries, Tips" Restore Logic
    wagesInput.addEventListener('blur', function () {
        let wageVal = unformatCurrency(wagesInput.value || '0');
        wagesInput.value = (wageVal > 0) ? formatCurrency(String(wageVal)) : ''; 
        updateW2Mapping();
    });

    // --- Medicare Tax Withheld ---
    const medicareTaxGroup = document.createElement('div');
    medicareTaxGroup.classList.add('form-group');
    const medicareTaxLabel = document.createElement('label');
    medicareTaxLabel.setAttribute('for', 'w2MedicareTaxWithheld_' + w2Counter);
    medicareTaxLabel.textContent = 'Medicare Tax Withheld:';
    medicareTaxGroup.appendChild(medicareTaxLabel);
    const medicareTaxInput = document.createElement('input');
    medicareTaxInput.type = 'text';
    medicareTaxInput.id = 'w2MedicareTaxWithheld_' + w2Counter;
    medicareTaxInput.name = 'w2MedicareTaxWithheld_' + w2Counter;
    medicareTaxInput.classList.add('currency-field');
    medicareTaxGroup.appendChild(medicareTaxInput);
    collapsibleContent.appendChild(medicareTaxGroup);  

    // --- Employer State Unemployment Tax Question ---
    const stateTaxGroup = document.createElement('div');
    stateTaxGroup.classList.add('form-group');
    const stateTaxLabel = document.createElement('label');
    stateTaxLabel.setAttribute('for', 'w2StateUnemploymentTax_' + w2Counter);
    stateTaxLabel.textContent = 'Has the Employer paid State Unemployment Tax?';
    stateTaxGroup.appendChild(stateTaxLabel);

    const stateTaxSelect = document.createElement('select');
    stateTaxSelect.id = 'w2StateUnemploymentTax_' + w2Counter;
    stateTaxSelect.name = 'w2StateUnemploymentTax_' + w2Counter;
    stateTaxSelect.required = true;

    const yesOption = document.createElement('option');
    yesOption.value = 'Yes';
    yesOption.textContent = 'Yes';
    yesOption.selected = true;

    const noOption = document.createElement('option');
    noOption.value = 'No';
    noOption.textContent = 'No';

    stateTaxSelect.appendChild(yesOption);
    stateTaxSelect.appendChild(noOption);

    stateTaxGroup.appendChild(stateTaxSelect);
    collapsibleContent.appendChild(stateTaxGroup);

       // Add an event listener for the dropdown to change the FUTA rate
       stateTaxSelect.addEventListener('change', function() {
        updateW2Mapping();  // Recalculate W-2 mapping, including unemployment tax
        recalculateTotals(); // Update totals after recalculation
    });

    // --- New: State Breakdown Section ---
    const stateBreakdownContainer = document.createElement('div');
    stateBreakdownContainer.classList.add('form-group');
    
    const stateBreakdownLabel = document.createElement('label');
    stateBreakdownLabel.textContent = "State Breakdown of Wages (if different from primary state):";
    stateBreakdownContainer.appendChild(stateBreakdownLabel);
    
    const stateBreakdownRowsContainer = document.createElement('div');
    stateBreakdownRowsContainer.classList.add('state-breakdown-rows-container');

    // Error message container for the state breakdown validation
    const stateBreakdownError = document.createElement('div');
    stateBreakdownError.id = `w2StateBreakdownError_${w2Counter}`;
    stateBreakdownError.classList.add('red-disclaimer');
    stateBreakdownError.style.marginTop = '12px';

    // Create four rows
    for (let i = 1; i <= 4; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('state-breakdown-row');

        // Left column: state dropdown
        const leftCol = document.createElement('div');
        leftCol.classList.add('state-breakdown-left');
        const dropdown = document.createElement('select');
        dropdown.id = `w2StateBreakdownDropdown_${w2Counter}_${i}`;
        dropdown.name = `w2StateBreakdownDropdown_${w2Counter}_${i}`;

        // Initially populate dropdown from STATES_ARRAY
        STATES_ARRAY.forEach(function(optData) {
            const opt = document.createElement('option');
            opt.value = optData.value;
            opt.textContent = optData.text;
            dropdown.appendChild(opt);
        });

        // Store the initial value (empty) for later comparison
        dropdown.dataset.prevValue = dropdown.value;

        leftCol.appendChild(dropdown);

        // Right column: currency input
        const rightCol = document.createElement('div');
        rightCol.classList.add('state-breakdown-right');
        const currencyInput = document.createElement('input');
        currencyInput.type = 'text';
        currencyInput.id = `w2StateBreakdownAmount_${w2Counter}_${i}`;
        currencyInput.name = `w2StateBreakdownAmount_${w2Counter}_${i}`;
        currencyInput.placeholder = '$0';
        currencyInput.classList.add('currency-field');
        currencyInput.addEventListener('blur', function() {
            currencyInput.value = formatCurrency(String(unformatCurrency(currencyInput.value)));
            validateW2StateBreakdownSum(w2Counter);
        });
        currencyInput.addEventListener('input', function() {
            validateW2StateBreakdownSum(w2Counter);
        });
        rightCol.appendChild(currencyInput);

        rowDiv.appendChild(leftCol);
        rowDiv.appendChild(rightCol);
        stateBreakdownRowsContainer.appendChild(rowDiv);

        // Attach a change event listener to each dropdown:
        dropdown.addEventListener('change', function() {
            // If the state has changed, clear the corresponding currency input.
            if (dropdown.dataset.prevValue !== dropdown.value) {
                const amtInput = document.getElementById(`w2StateBreakdownAmount_${w2Counter}_${i}`);
                if (amtInput) {
                    amtInput.value = "";
                }
            }
            // Update stored value
            dropdown.dataset.prevValue = dropdown.value;
            // Refresh available options in all dropdowns for this W-2 block.
            updateStateBreakdownDropdowns(w2Counter);
            validateW2StateBreakdownSum(w2Counter);
        });
    
    stateBreakdownContainer.appendChild(stateBreakdownRowsContainer);
    stateBreakdownContainer.appendChild(stateBreakdownError);

    // Append the new section before the State Wages group
    collapsibleContent.appendChild(stateBreakdownContainer);
    }

    // --- State Wages, Tips, etc. ---
    const stateWagesGroup = document.createElement('div');
    stateWagesGroup.classList.add('form-group');
    const stateWagesLabel = document.createElement('label');
    stateWagesLabel.setAttribute('for', 'w2StateWages_' + w2Counter);
    stateWagesLabel.textContent = 'State Wages, Tips, etc:';
    stateWagesGroup.appendChild(stateWagesLabel);
    const stateWagesInput = document.createElement('input');
    stateWagesInput.type = 'text';
    stateWagesInput.id = 'w2StateWages_' + w2Counter;
    stateWagesInput.name = 'w2StateWages_' + w2Counter;
    stateWagesInput.classList.add('currency-field');
    stateWagesGroup.appendChild(stateWagesInput);
    collapsibleContent.appendChild(stateWagesGroup);   

    // --- State Income Tax ---
    const stateIncomeTaxGroup = document.createElement('div');
    stateIncomeTaxGroup.classList.add('form-group');

    const stateIncomeTaxLabel = document.createElement('label');
    stateIncomeTaxLabel.setAttribute('for', 'w2StateTaxWithheld_' + w2Counter);
    stateIncomeTaxLabel.textContent = 'State Income Tax Withheld:';
    // Append the label to the group (not the other way around)
    stateIncomeTaxGroup.appendChild(stateIncomeTaxLabel);

    const stateIncomeTaxInput = document.createElement('input');
    stateIncomeTaxInput.type = 'text';
    stateIncomeTaxInput.id = 'w2StateTaxWithheld_' + w2Counter;
    stateIncomeTaxInput.name = 'w2StateTaxWithheld_' + w2Counter;
    stateIncomeTaxInput.classList.add('currency-field');
    stateIncomeTaxGroup.appendChild(stateIncomeTaxInput);

    collapsibleContent.appendChild(stateIncomeTaxGroup);

    // --- How many Codes are there in Box 12 of W-2? ---
    const codeNumGroup = document.createElement('div');
    codeNumGroup.classList.add('form-group');
    const codeNumLabel = document.createElement('label');
    codeNumLabel.setAttribute('for', 'W2CodeNum_' + w2Counter);
    codeNumLabel.textContent = 'How many Codes are there in Box 12 of W-2?:';
    codeNumGroup.appendChild(codeNumLabel);
    const codeNumInput = document.createElement('input');
    codeNumInput.type = 'number';
    codeNumInput.id = 'W2CodeNum_' + w2Counter;
    codeNumInput.name = 'W2CodeNum_' + w2Counter;
    codeNumInput.min = '0';
    codeNumInput.max = '30';
    codeNumGroup.appendChild(codeNumInput);
    collapsibleContent.appendChild(codeNumGroup);  

    // --- Container for W-2 Code Boxes for this block ---
    const codeBoxesContainer = document.createElement('div');
    codeBoxesContainer.id = 'W2CodeBoxesContainer_' + w2Counter;
    collapsibleContent.appendChild(codeBoxesContainer);  

    // When the code number input changes, generate the code boxes for this block.
    codeNumInput.addEventListener('input', function() {
      const num = parseInt(this.value, 10) || 0;
      createW2CodeBoxes(num, codeBoxesContainer);
    }); 

    // --- Remove this W-2? Button ---
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove this W-2?';
    removeBtn.classList.add('remove-w2-btn');

    // Updated event listener: when the W-2 block is removed, also remove its wage mapping.
    removeBtn.addEventListener('click', function() {
        // If a mapping exists for this W-2 block in w2WageMap, delete it to reset its value
        if (w2WageMap.hasOwnProperty(w2Block.id)) {
            delete w2WageMap[w2Block.id];
        }
        // Remove the W-2 block from the DOM
        w2Block.remove();
        // Recalculate totals so that the removal is reflected (including Reasonable Compensation)
        recalculateTotals();
    });

    collapsibleContent.appendChild(removeBtn);

    document.getElementById('w2sContainer').appendChild(w2Block);
    const bigSection = document.getElementById('w2sContainer');
    if (bigSection) bigSection.style.display = 'block';
    collapsibleContent.style.display = 'block';

    w2Block.querySelectorAll('.currency-field').forEach((field) => {
          field.addEventListener('blur', function() {
              this.value = formatCurrency(this.value);
              recalculateTotals();
          });
      });

    // Add an event listener to toggle the collapsible content
    header.addEventListener('click', () => {
        collapsibleContent.classList.toggle('active');
    });
}

document.addEventListener('DOMContentLoaded', function () {
  const toggleHead = document.querySelector('#specialGains h2');
  const content = document.getElementById('specialGainsContainer');

  if (toggleHead && content) {
    toggleHead.addEventListener('click', () => {
      content.classList.toggle('active');
    });
  }
});

// re-calculate deductions whenever age-65 or blind counts change
document.getElementById('olderthan65').addEventListener('change', recalculateDeductions);
document.getElementById('blind').addEventListener('change', recalculateDeductions);

//-------------------------------------//
// 25. SELF-EMPLOYMENT TAX CALCULATION //
//-------------------------------------//

// This function calculates self-employment tax using only the income from
// Schedule-C and Partnership businesses. The Social Security wage base is dynamic,
// depending on the year selected in the "Enter Year of Most Recent Tax Return Filied:" field.
function calculateDetailedSelfEmploymentTax() {
    // 1. Determine tax year and set the Social Security wage base.
    const taxYear = document.getElementById('year').value;
    const wageBaseMap = {
      "2020": 137700,
      "2021": 142800,
      "2022": 147000,
      "2023": 160200,
      "2024": 168600,
      "2025": 176100
    };
    const SOCIAL_SECURITY_WAGE_BASE = wageBaseMap[taxYear];
  
    // 2. Set Additional Medicare threshold based on filing status.
    const filingStatus = document.getElementById('filingStatus').value;
    let additionalMedicareThreshold;
    if (filingStatus === 'Married Filing Jointly') {
      additionalMedicareThreshold = 250000;
    } else if (filingStatus === 'Married Filing Separately') {
      additionalMedicareThreshold = 125000;
    } else {
      additionalMedicareThreshold = 200000;
    }
  
    // 3. Calculate Self‑Employment Tax Separately
    if (filingStatus === 'Married Filing Jointly') {
        const clientFirst = document.getElementById('firstName').value.trim() || 'Client 1';
        const spouseFirst = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
      
        // 3a. Sum W-2 wages for each spouse.
        let clientW2 = 0, spouseW2 = 0;
        let clientW2ForMedicare = 0, spouseW2ForMedicare = 0;
        for (let key in w2WageMap) {
          if (w2WageMap.hasOwnProperty(key)) {
            const mapping = w2WageMap[key];
            const ssW = mapping.socialSecurityWages > 0 ? mapping.socialSecurityWages : mapping.wage;

            if (mapping.client === clientFirst) {
              clientW2 += ssW;
              // For Additional Medicare Tax, use Medicare wages if provided; else use wage.
              clientW2ForMedicare += (mapping.medicareWages > 0 ? mapping.medicareWages : mapping.wage);
            } else if (mapping.client === spouseFirst) {
              spouseW2 += ssW;
              spouseW2ForMedicare += (mapping.medicareWages > 0 ? mapping.medicareWages : mapping.wage);
            }
          }
        }
  
      // 3b. Sum SE income from businesses for each spouse.
      let clientSEIncome = 0, spouseSEIncome = 0;
      const numBusinessesVal = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
      for (let i = 1; i <= numBusinessesVal; i++) {
        const businessTypeEl = document.getElementById(`business${i}Type`);
        if (!businessTypeEl) continue;
        const typeVal = businessTypeEl.value.trim();
        if (typeVal === 'Schedule-C') {
          // Retrieve net income without forcing negatives to zero.
          let netVal = unformatCurrency(document.getElementById(`business${i}Net`).value || '0');
          // Use dropdown to assign owner if available.
          const scheduleCOwnerEl = document.getElementById(`scheduleCOwner${i}`);
          if (scheduleCOwnerEl) {
            const owner = scheduleCOwnerEl.value;
            if (owner === clientFirst) {
              clientSEIncome += netVal;
            } else if (owner === spouseFirst) {
              spouseSEIncome += netVal;
            }
          } else {
            clientSEIncome += netVal;
          }
        } else if (typeVal === 'Partnership') {
          const numOwnersEl = document.getElementById(`numOwnersSelect${i}`);
          const numOwners = numOwnersEl ? parseInt(numOwnersEl.value, 10) || 0 : 0;
          for (let j = 1; j <= numOwners; j++) {
            const ownerNameEl = document.getElementById(`business${i}OwnerName${j}`);
            const pctEl = document.getElementById(`business${i}OwnerPercent${j}`);
            if (ownerNameEl && pctEl) {
              const ownerName = ownerNameEl.value.trim();
              const pct = parseFloat(pctEl.value.trim() || "0");
              // Remove Math.max so negative portions are included.
              let portion = unformatCurrency(document.getElementById(`business${i}Net`).value || '0') * (pct / 100);
              if (ownerName === clientFirst) {
                clientSEIncome += portion;
              } else if (ownerName === spouseFirst) {
                spouseSEIncome += portion;
              }
            }
          }
        }
        // Other business types are not included in SE tax.
      }
  
      // 3c. Apply the 92.35% adjustment and ensure non-negative net earnings.
      const clientNetEarningsSE = Math.max(0, clientSEIncome * 0.9235);
      const spouseNetEarningsSE = Math.max(0, spouseSEIncome * 0.9235);
  
      // 3d. Compute available Social Security bases.
      const clientAvailableSS = Math.max(0, SOCIAL_SECURITY_WAGE_BASE - clientW2);
      const spouseAvailableSS = Math.max(0, SOCIAL_SECURITY_WAGE_BASE - spouseW2);
  
      // 3e. Compute Social Security and Medicare taxes for each spouse.
      const clientSSTax = Math.min(clientNetEarningsSE, clientAvailableSS) * 0.124;
      const spouseSSTax = Math.min(spouseNetEarningsSE, spouseAvailableSS) * 0.124;
      const clientMedicareTax = clientNetEarningsSE * 0.029;
      const spouseMedicareTax = spouseNetEarningsSE * 0.029;

      // Total SE-tax = Social Security + Medicare
      const socialSecurityTax = clientSSTax + spouseSSTax;
      const medicareTax       = clientMedicareTax + spouseMedicareTax;
      const seTax             = socialSecurityTax + medicareTax;
  
      // 3f. Compute Additional Medicare Tax using Medicare wages if provided.
        const additionalMedicareTax = calculateAdditionalMedicareTax(
            clientW2ForMedicare, spouseW2ForMedicare, clientNetEarningsSE, spouseNetEarningsSE, additionalMedicareThreshold
        );
  
      // 3g. Compute half SE tax deduction.
      // Half of that is the deductible piece:
      const halfSelfEmploymentTaxDeduction = seTax / 2;
  
      // Debug logs (optional)
      console.log("---------------------------------------------------------------------");
      console.log("MFJ Branch:");
      console.log("Client W-2:", clientW2, "Spouse W-2:", spouseW2);
      console.log("Client SE Income:", clientSEIncome, "Spouse SE Income:", spouseSEIncome);
      console.log("Client Net Earnings SE:", clientNetEarningsSE, "Spouse Net Earnings SE:", spouseNetEarningsSE);
      console.log("Client Available SS:", clientAvailableSS, "Spouse Available SS:", spouseAvailableSS);
      console.log("Client SS Tax:", clientSSTax, "Spouse SS Tax:", spouseSSTax);
      console.log("Client Medicare Tax:", clientMedicareTax, "Spouse Medicare Tax:", spouseMedicareTax);
      console.log("Additional Medicare Tax:", additionalMedicareTax);
      console.log("Half SE Tax Deduction:", halfSelfEmploymentTaxDeduction);
      console.log("---------------------------------------------------------------------");
  
      return {
        seTax,
        additionalMedicareTax,
        halfSelfEmploymentTaxDeduction,
        client: {
          w2: clientW2,
          seIncome: clientSEIncome,
          netEarningsSE: clientNetEarningsSE,
          ssTax: clientSSTax,
          medicareTax: clientMedicareTax
        },
        spouse: {
          w2: spouseW2,
          seIncome: spouseSEIncome,
          netEarningsSE: spouseNetEarningsSE,
          ssTax: spouseSSTax,
          medicareTax: spouseMedicareTax
        }
      };
    }
    // 4. Non‑Married Filing Jointly branch.
    else {

    // Destructure the returned object from sumW2Wages() and determine effective wages.
      const { totalW2Wages, totalSSWages } = sumW2Wages();
      const effectiveW2 = totalSSWages > 0
                        ? totalSSWages
                        : totalW2Wages;
      const effectiveW2ForMedicare = sumEffectiveW2ForMedicare();
    
      let seIncome = 0;
      const numBusinessesVal = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
      for (let i = 1; i <= numBusinessesVal; i++) {
        const businessTypeEl = document.getElementById(`business${i}Type`);
        if (!businessTypeEl) continue;
        const typeVal = businessTypeEl.value.trim();
        if (typeVal === 'Schedule-C') {
          const incomeVal = unformatCurrency(document.getElementById(`business${i}Income`).value || "0");
          const expensesVal = unformatCurrency(document.getElementById(`business${i}Expenses`).value || "0");
          let net = incomeVal - expensesVal;
          seIncome += net;
        } else if (typeVal === 'Partnership') {
          const ownerPctEl = document.getElementById(`business${i}OwnerPercent1`);
          const pctVal = ownerPctEl ? parseFloat(ownerPctEl.value.trim() || "0") : 100;
          const netVal = unformatCurrency(document.getElementById(`business${i}Net`).value || '0');
          seIncome += netVal * (pctVal / 100);
        }
      }
      const netEarningsSE = Math.max(0, seIncome * 0.9235);
      const availableSSBase = Math.max(0, SOCIAL_SECURITY_WAGE_BASE - effectiveW2);
      const ssTaxable = Math.min(netEarningsSE, availableSSBase);
      const socialSecurityTax = ssTaxable * 0.124;
      const medicareTax = netEarningsSE * 0.029;
      // Additional Medicare Tax on (wages + SE earnings)
      const additionalMedicareTax = calculateAdditionalMedicareTax(
        effectiveW2ForMedicare,  // client W‑2 wages
        0,                       // spouse W‑2 wages (none for single/MFS/HOH/QW)
        netEarningsSE,           // client net SE earnings
        0,                       // spouse net SE earnings
        additionalMedicareThreshold
      );
      const seTax = socialSecurityTax + medicareTax;
      const halfSelfEmploymentTaxDeduction = seTax / 2;
  
      return {
        seTax,
        additionalMedicareTax,
        halfSelfEmploymentTaxDeduction,
        totalW2ForClient: effectiveW2,
        seIncome,
        netEarningsSE
      };
    }
}
    
function updateSelfEmploymentTax() {
    const taxResults = calculateDetailedSelfEmploymentTax();
    document.getElementById('selfEmploymentTax').value =
      formatCurrency(String(Math.round(taxResults.seTax)));
    document.getElementById('additionalMedicareTax').value =
      formatCurrency(String(Math.round(taxResults.additionalMedicareTax)));
    document.getElementById('halfSETax').value =
      formatCurrency(String(Math.round(taxResults.halfSelfEmploymentTaxDeduction)));
}

//-----------------------------------------//
// 26. ADDITIONAL MEDICARE TAX CALCULATION //
//-----------------------------------------//
function calculateAdditionalMedicareTax(
  clientW2,
  spouseW2,
  clientNetEarningsSE,
  spouseNetEarningsSE,
  additionalMedicareThreshold
) {
  // Full IRS base: wages (Box 5) + net SE earnings
  const totalIncome = clientW2 + spouseW2 + clientNetEarningsSE + spouseNetEarningsSE;
  const excess      = Math.max(0, totalIncome - additionalMedicareThreshold);
  return excess * 0.009;
}

function sumEffectiveW2ForMedicare() {
    const w2Container = document.getElementById('w2sContainer');
    let totalEffectiveW2 = 0;
    if (w2Container) {
      const w2Blocks = w2Container.querySelectorAll(".w2-block");
      w2Blocks.forEach(block => {
        const wageInput = block.querySelector("input[id^='w2Wages_']");
        const medicareInput = block.querySelector("input[id^='w2MedicareWages_']");
        let wageVal = unformatCurrency(wageInput ? wageInput.value : '0');
        let medicareVal = unformatCurrency(medicareInput ? medicareInput.value : '0');
        // For this block, if Medicare wages are provided (> 0), use them; otherwise, use wageVal.
        const effectiveW2 = (medicareVal > 0 ? medicareVal : wageVal);
        totalEffectiveW2 += effectiveW2;
      });
    }
    return totalEffectiveW2;
}  

//---------------------------------//
// 27. EMPLOYER AND EMPLOYEE TAXES //
//---------------------------------//

function calculateEmployerEmployeeTaxes() {
    // 1. Determine the tax year and set the Social Security wage base.
    const taxYear = document.getElementById('year').value;
    const wageBaseMap = {
        "2020": 137700,
        "2021": 142800,
        "2022": 147000,
        "2023": 160200,
        "2024": 168600,
        "2025": 176100
    };
    const SOCIAL_SECURITY_WAGE_BASE = wageBaseMap[taxYear] || 0;

    // 2. Calculate Employee Payroll Taxes
    const filingStatus = document.getElementById('filingStatus').value;
    let employeeSocialSecurityTax = 0;
    let employeeMedicareTax = 0;
    if (filingStatus === 'Married Filing Jointly') {
        const clientName = document.getElementById('firstName').value.trim() || 'Client 1';
        const spouseName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
        let clientW2Total = 0;
        let spouseW2Total = 0;
        for (let key in w2WageMap) {
            if (!w2WageMap.hasOwnProperty(key)) continue;
            const mapping = w2WageMap[key];
            const ssW = (mapping.socialSecurityWages > 0 ? mapping.socialSecurityWages : mapping.wage);
            if (mapping.client === clientName) {
                clientW2Total += ssW;
            } else if (mapping.client === spouseName) {
                spouseW2Total += ssW;
            }
        }
        const clientSSTax = Math.min(clientW2Total, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
        const spouseSSTax = Math.min(spouseW2Total, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
        const clientMedTax = clientW2Total * 0.0145;
        const spouseMedTax = spouseW2Total * 0.0145;
        employeeSocialSecurityTax = clientSSTax + spouseSSTax;
        employeeMedicareTax = clientMedTax + spouseMedTax;
    } else {
        // ── CHANGE START ──
        // pull overrides for Box 5 (Medicare) and Box 3 (SS) as well as total wages
        const {
          totalW2Wages,
          totalMedicareWages,
          totalSSWages
        } = sumW2Wages();

        // Medicare base: use Box 5 override if present, otherwise Box 1
        const medBase = totalMedicareWages > 0
          ? totalMedicareWages
          : totalW2Wages;

        // Social‐Security base: use Box 3 override if present, otherwise Box 1
        const ssBase  = totalSSWages > 0
          ? totalSSWages
          : totalW2Wages;

        // now compute FICA
        employeeSocialSecurityTax = Math.min(ssBase, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
        employeeMedicareTax       = medBase                                  * 0.0145;
        // ── CHANGE END ──
    }
    const totalEmployeeTax = employeeSocialSecurityTax + employeeMedicareTax;

    // 3. Calculate Employer Payroll Taxes (based on Reasonable Compensation)
    let employerTotalTax = 0;
    // Declare clientRC and spouseRC in the outer scope so they are available later.
    let clientRC = 0, spouseRC = 0;
    if (filingStatus === 'Married Filing Jointly') {
        const clientName = document.getElementById('firstName').value.trim() || 'Client 1';
        const spouseName = document.getElementById('spouseFirstName').value.trim() || 'Client 2';
        const rcInputs = document.querySelectorAll("input[id^='business'][id*='OwnerComp']");
        rcInputs.forEach(input => {
            const compValue = unformatCurrency(input.value);
            const match = input.id.match(/business(\d+)OwnerComp(\d+)/);
            if (match) {
                const bizIndex = match[1];
                const ownerIndex = match[2];
                const ownerNameField = document.getElementById(`business${bizIndex}OwnerName${ownerIndex}`);
                if (ownerNameField) {
                    const ownerName = ownerNameField.value.trim();
                    if (ownerName === clientName) {
                        clientRC += compValue;
                    } else if (ownerName === spouseName) {
                        spouseRC += compValue;
                    }
                }
            }
        });
        const clientSSTax_RC = Math.min(clientRC, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
        const spouseSSTax_RC = Math.min(spouseRC, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
        const clientMedTax_RC = clientRC * 0.0145;
        const spouseMedTax_RC = spouseRC * 0.0145;
        employerTotalTax = clientSSTax_RC + clientMedTax_RC + spouseSSTax_RC + spouseMedTax_RC;
    } else {
        const rcValue = getFieldValue('reasonableCompensation');
        if (rcValue > 0) {
            const employerSS = Math.min(rcValue, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
            const employerMed = rcValue * 0.0145;
            employerTotalTax = employerSS + employerMed;
        }
    }

    // 4. Add FUTA and Unemployment Taxes
    // FUTA is normally computed on aggregated wages, but here,
    // it iterate over each RC wage input and calculate FUTA for each separately.
    const stateTaxElement = document.getElementById('w2StateUnemploymentTax_' + w2Counter);
    const unemploymentTotal = unformatCurrency(
        document.getElementById('staticUnemployment2022_2025').value || '0'
    );
    if (stateTaxElement) {
        let totalFUTA = 0;
        // Select all RC wage fields; adjust the selector as needed to only target the relevant fields.
        const rcInputs = document.querySelectorAll("input[id*='OwnerComp']");
        rcInputs.forEach(function(input) {
            let compValue = unformatCurrency(input.value);
            // Compute FUTA for each RC wage independently (each gets its own $7,000 base)
            totalFUTA += calculateFUTA(compValue, stateTaxElement.value);
        });
        employerTotalTax += totalFUTA;
        employerTotalTax += unemploymentTotal;
    }

    // 5. Update UI fields.
    const employeeTaxField = document.getElementById('employeeTaxes');
    if (employeeTaxField) {
        employeeTaxField.value = formatCurrency(String(Math.round(totalEmployeeTax)));
    }
    const employerTaxField = document.getElementById('employerTaxes');
    if (employerTaxField) {
        employerTaxField.value = formatCurrency(String(Math.round(employerTotalTax)));
    }

    console.log("---------------------------------------------------------------------");
    console.log("Employee Payroll Taxes:");
    console.log("  Social Security Tax =", employeeSocialSecurityTax);
    console.log("  Medicare Tax =", employeeMedicareTax);
    console.log("  Total =", totalEmployeeTax);
    console.log("Employer Payroll Taxes:", employerTotalTax);
    console.log("---------------------------------------------------------------------");

    return {
        employee: {
            socialSecurity: employeeSocialSecurityTax,
            medicare: employeeMedicareTax,
            total: totalEmployeeTax
        },
        employer: {
            total: employerTotalTax
        }
    };
}

// Helper function to calculate FUTA (Federal Unemployment Tax Act)
function calculateFUTA(wageAmount, stateUnemploymentPaid) {
    const WAGE_LIMIT = 7000; // FUTA applies only to the first $7,000 of wages
    const FUTA_TAX_RATE = stateUnemploymentPaid === 'No' ? 0.06 : 0.006; // 6% if "No", 0.6% if "Yes"
    console.log("Wage Amount:", wageAmount);
    console.log("State Unemployment Paid:", stateUnemploymentPaid);
    console.log("FUTA Tax Rate:", FUTA_TAX_RATE);
    return Math.min(wageAmount, WAGE_LIMIT) * FUTA_TAX_RATE;
}

function calculateUnemploymentTax(year, stateTax, wageAmount, isClientBusiness) {
    // Only perform the calculation if the compensation is from the client's business.
    if (isClientBusiness !== "Yes") {
      return "";
    }
  
    let mapping;
    switch (parseInt(year, 10)) {
      case 2022:
        mapping = {
          "Alabama Taxes": { limit: 8000, rate: 0.027 },
          "Alaska Taxes": { limit: 45200, rate: 0.0237 },
          "Arizona Taxes": { limit: 7000, rate: 0.02 },
          "Arkansas Taxes": { limit: 10000, rate: 0.031 },
          "California Taxes": { limit: 7000, rate: 0.034 },
          "Colorado Taxes": { limit: 17000, rate: 0.017 },
          "Connecticut Taxes": { limit: 15000, rate: 0.03 },
          "Delaware Taxes": { limit: 16500, rate: 0.018 },
          "District of Columbia Taxes": { limit: 9000, rate: 0.027 },
          "Florida Taxes": { limit: 7000, rate: 0.027 },
          "Georgia Taxes": { limit: 9500, rate: 0.0264 },
          "Hawaii Taxes": { limit: 51600, rate: 0.03 },
          "Idaho Taxes": { limit: 46500, rate: 0.0097 },
          "Illinois Taxes": { limit: 12960, rate: 0.03525 },
          "Indiana Taxes": { limit: 9500, rate: 0.025 },
          "Iowa Taxes": { limit: 34800, rate: 0.01 },
          "Kansas Taxes": { limit: 14000, rate: 0.027 },
          "Kentucky Taxes": { limit: 11100, rate: 0.027 },
          "Louisiana Taxes": { limit: 7700, rate: 0.027 },
          "Maine Taxes": { limit: 12000, rate: 0.0224 },
          "Maryland Taxes": { limit: 8500, rate: 0.026 },
          "Massachusetts Taxes": { limit: 15000, rate: 0.0242 },
          "Michigan Taxes": { limit: 9500, rate: 0.027 },
          "Minnesota Taxes": { limit: 38000, rate: 0.027 },
          "Mississippi Taxes": { limit: 14000, rate: 0.01 },
          "Missouri Taxes": { limit: 11000, rate: 0.02376 },
          "Montana Taxes": { limit: 38100, rate: 0.027 },
          "Nebraska Taxes": { limit: 24000, rate: 0.0125 },
          "Nevada Taxes": { limit: 36600, rate: 0.0295 },
          "New Hampshire Taxes": { limit: 14000, rate: 0.027 },
          "New Jersey Taxes": { limit: 39800, rate: 0.028 },
          "New Mexico Taxes": { limit: 28700, rate: 0.01 },
          "New York Taxes": { limit: 12000, rate: 0.03125 },
          "North Carolina Taxes": { limit: 28000, rate: 0.01 },
          "North Dakota Taxes": { limit: 38400, rate: 0.0102 },
          "Ohio Taxes": { limit: 9000, rate: 0.027 },
          "Oklahoma Taxes": { limit: 24800, rate: 0.015 },
          "Oregon Taxes": { limit: 47700, rate: 0.024 },
          "Pennsylvania Taxes": { limit: 10000, rate: 0.03689 },
          "Rhode Island Taxes": { limit: 24600, rate: 0.0098 },
          "South Carolina Taxes": { limit: 14000, rate: 0.0049 },
          "South Dakota Taxes": { limit: 15000, rate: 0.012 },
          "Tennessee Taxes": { limit: 7000, rate: 0.027 },
          "Texas Taxes": { limit: 9000, rate: 0.027 },
          "Utah Taxes": { limit: 41600, rate: 0.027 },
          "Vermont Taxes": { limit: 15500, rate: 0.01 },
          "Virginia Taxes": { limit: 8000, rate: 0.0273 },
          "Washington Taxes": { limit: 62500, rate: 0.027 },
          "West Virginia Taxes": { limit: 12000, rate: 0.027 },
          "Wisconsin Taxes": { limit: 14000, rate: 0.0305 },
          "Wyoming Taxes": { limit: 27700, rate: 0.027 }
        };
        break;
      case 2023:
        mapping = {
          "Alabama Taxes": { limit: 8000, rate: 0.027 },
          "Alaska Taxes": { limit: 41500, rate: 0.0237 },
          "Arizona Taxes": { limit: 7000, rate: 0.02 },
          "Arkansas Taxes": { limit: 12000, rate: 0.031 },
          "California Taxes": { limit: 7000, rate: 0.034 },
          "Colorado Taxes": { limit: 13800, rate: 0.017 },
          "Connecticut Taxes": { limit: 15000, rate: 0.028 },
          "Delaware Taxes": { limit: 8500, rate: 0.001 },
          "District of Columbia Taxes": { limit: 9000, rate: 0.027 },
          "Florida Taxes": { limit: 7000, rate: 0.027 },
          "Georgia Taxes": { limit: 9500, rate: 0.027 },
          "Hawaii Taxes": { limit: 46800, rate: 0.04 },
          "Idaho Taxes": { limit: 41500, rate: 0.01071 },
          "Illinois Taxes": { limit: 12900, rate: 0.0395 },
          "Indiana Taxes": { limit: 9500, rate: 0.025 },
          "Iowa Taxes": { limit: 29500, rate: 0.01 },
          "Kansas Taxes": { limit: 14000, rate: 0.027 },
          "Kentucky Taxes": { limit: 11000, rate: 0.027 },
          "Louisiana Taxes": { limit: 7500, rate: 0.0009 },
          "Maine Taxes": { limit: 12000, rate: 0.0219 },
          "Maryland Taxes": { limit: 8500, rate: 0.023 },
          "Massachusetts Taxes": { limit: 15000, rate: 0.0143 },
          "Michigan Taxes": { limit: 9500, rate: 0.027 },
          "Minnesota Taxes": { limit: 35000, rate: 0.001 },
          "Mississippi Taxes": { limit: 14000, rate: 0.01 },
          "Missouri Taxes": { limit: 13500, rate: 0.027 },
          "Montana Taxes": { limit: 34500, rate: 0.0013 },
          "Nebraska Taxes": { limit: 9000, rate: 0.0125 },
          "Nevada Taxes": { limit: 33100, rate: 0.0295 },
          "New Hampshire Taxes": { limit: 14000, rate: 0.027 },
          "New Jersey Taxes": { limit: 35700, rate: 0.031 },
          "New Mexico Taxes": { limit: 25400, rate: 0.01 },
          "New York Taxes": { limit: 11500, rate: 0.026 },
          "North Carolina Taxes": { limit: 25400, rate: 0.01 },
          "North Dakota Taxes": { limit: 39200, rate: 0.0113 },
          "Ohio Taxes": { limit: 9000, rate: 0.027 },
          "Oklahoma Taxes": { limit: 17500, rate: 0.015 },
          "Oregon Taxes": { limit: 43000, rate: 0.021 },
          "Pennsylvania Taxes": { limit: 10000, rate: 0.03822 },
          "Rhode Island Taxes": { limit: 24000, rate: 0.0109 },
          "South Carolina Taxes": { limit: 14000, rate: 0.0045 },
          "South Dakota Taxes": { limit: 15000, rate: 0.012 },
          "Tennessee Taxes": { limit: 7000, rate: 0.027 },
          "Texas Taxes": { limit: 9000, rate: 0.027 },
          "Utah Taxes": { limit: 35700, rate: 0.003 },
          "Vermont Taxes": { limit: 16000, rate: 0.01 },
          "Virginia Taxes": { limit: 8000, rate: 0.025 },
          "Washington Taxes": { limit: 56200, rate: 0.0125 },
          "West Virginia Taxes": { limit: 12000, rate: 0.027 },
          "Wisconsin Taxes": { limit: 14000, rate: 0.0305 },
          "Wyoming Taxes": { limit: 25800, rate: 0.018 }
        };
        break;
      case 2024:
        // For 2024, we assume the mapping is the same as for 2023.
        mapping = {
          "Alabama Taxes": { limit: 8000, rate: 0.027 },
          "Alaska Taxes": { limit: 41500, rate: 0.0237 },
          "Arizona Taxes": { limit: 7000, rate: 0.02 },
          "Arkansas Taxes": { limit: 12000, rate: 0.031 },
          "California Taxes": { limit: 7000, rate: 0.034 },
          "Colorado Taxes": { limit: 13800, rate: 0.017 },
          "Connecticut Taxes": { limit: 15000, rate: 0.028 },
          "Delaware Taxes": { limit: 8500, rate: 0.001 },
          "District of Columbia Taxes": { limit: 9000, rate: 0.027 },
          "Florida Taxes": { limit: 7000, rate: 0.027 },
          "Georgia Taxes": { limit: 9500, rate: 0.027 },
          "Hawaii Taxes": { limit: 46800, rate: 0.04 },
          "Idaho Taxes": { limit: 41500, rate: 0.01071 },
          "Illinois Taxes": { limit: 12900, rate: 0.0395 },
          "Indiana Taxes": { limit: 9500, rate: 0.025 },
          "Iowa Taxes": { limit: 29500, rate: 0.01 },
          "Kansas Taxes": { limit: 14000, rate: 0.027 },
          "Kentucky Taxes": { limit: 11000, rate: 0.027 },
          "Louisiana Taxes": { limit: 7500, rate: 0.0009 },
          "Maine Taxes": { limit: 12000, rate: 0.0219 },
          "Maryland Taxes": { limit: 8500, rate: 0.023 },
          "Massachusetts Taxes": { limit: 15000, rate: 0.0143 },
          "Michigan Taxes": { limit: 9500, rate: 0.027 },
          "Minnesota Taxes": { limit: 35000, rate: 0.001 },
          "Mississippi Taxes": { limit: 14000, rate: 0.01 },
          "Missouri Taxes": { limit: 13500, rate: 0.027 },
          "Montana Taxes": { limit: 34500, rate: 0.0013 },
          "Nebraska Taxes": { limit: 9000, rate: 0.0125 },
          "Nevada Taxes": { limit: 33100, rate: 0.0295 },
          "New Hampshire Taxes": { limit: 14000, rate: 0.027 },
          "New Jersey Taxes": { limit: 35700, rate: 0.031 },
          "New Mexico Taxes": { limit: 25400, rate: 0.01 },
          "New York Taxes": { limit: 11500, rate: 0.026 },
          "North Carolina Taxes": { limit: 25400, rate: 0.01 },
          "North Dakota Taxes": { limit: 39200, rate: 0.0113 },
          "Ohio Taxes": { limit: 9000, rate: 0.027 },
          "Oklahoma Taxes": { limit: 17500, rate: 0.015 },
          "Oregon Taxes": { limit: 43000, rate: 0.021 },
          "Pennsylvania Taxes": { limit: 10000, rate: 0.03822 },
          "Rhode Island Taxes": { limit: 24000, rate: 0.0109 },
          "South Carolina Taxes": { limit: 14000, rate: 0.0045 },
          "South Dakota Taxes": { limit: 15000, rate: 0.012 },
          "Tennessee Taxes": { limit: 7000, rate: 0.027 },
          "Texas Taxes": { limit: 9000, rate: 0.027 },
          "Utah Taxes": { limit: 35700, rate: 0.003 },
          "Vermont Taxes": { limit: 16000, rate: 0.01 },
          "Virginia Taxes": { limit: 8000, rate: 0.025 },
          "Washington Taxes": { limit: 56200, rate: 0.0125 },
          "West Virginia Taxes": { limit: 12000, rate: 0.027 },
          "Wisconsin Taxes": { limit: 14000, rate: 0.0305 },
          "Wyoming Taxes": { limit: 25800, rate: 0.018 }
        };
        break;
      case 2025:
        mapping = {
          "Alabama Taxes": { limit: 8000, rate: 0.027 },
          "Alaska Taxes": { limit: 41500, rate: 0.0237 },
          "Arizona Taxes": { limit: 7000, rate: 0.02 },
          "Arkansas Taxes": { limit: 12000, rate: 0.031 },
          "California Taxes": { limit: 7000, rate: 0.034 },
          "Colorado Taxes": { limit: 13800, rate: 0.017 },
          "Connecticut Taxes": { limit: 15000, rate: 0.028 },
          "Delaware Taxes": { limit: 8500, rate: 0.001 },
          "District of Columbia Taxes": { limit: 9000, rate: 0.027 },
          "Florida Taxes": { limit: 7000, rate: 0.027 },
          "Georgia Taxes": { limit: 9500, rate: 0.027 },
          "Hawaii Taxes": { limit: 46800, rate: 0.04 },
          "Idaho Taxes": { limit: 41500, rate: 0.01071 },
          "Illinois Taxes": { limit: 12900, rate: 0.0395 },
          "Indiana Taxes": { limit: 9500, rate: 0.025 },
          "Iowa Taxes": { limit: 29500, rate: 0.01 },
          "Kansas Taxes": { limit: 14000, rate: 0.027 },
          "Kentucky Taxes": { limit: 11000, rate: 0.027 },
          "Louisiana Taxes": { limit: 7500, rate: 0.0009 },
          "Maine Taxes": { limit: 12000, rate: 0.0219 },
          "Maryland Taxes": { limit: 8500, rate: 0.023 },
          "Massachusetts Taxes": { limit: 15000, rate: 0.0143 },
          "Michigan Taxes": { limit: 9500, rate: 0.027 },
          "Minnesota Taxes": { limit: 35000, rate: 0.001 },
          "Mississippi Taxes": { limit: 14000, rate: 0.01 },
          "Missouri Taxes": { limit: 13500, rate: 0.027 },
          "Montana Taxes": { limit: 34500, rate: 0.0013 },
          "Nebraska Taxes": { limit: 9000, rate: 0.0125 },
          "Nevada Taxes": { limit: 33100, rate: 0.0295 },
          "New Hampshire Taxes": { limit: 14000, rate: 0.027 },
          "New Jersey Taxes": { limit: 35700, rate: 0.031 },
          "New Mexico Taxes": { limit: 25400, rate: 0.01 },
          "New York Taxes": { limit: 11500, rate: 0.026 },
          "North Carolina Taxes": { limit: 25400, rate: 0.01 },
          "North Dakota Taxes": { limit: 39200, rate: 0.0113 },
          "Ohio Taxes": { limit: 9000, rate: 0.027 },
          "Oklahoma Taxes": { limit: 17500, rate: 0.015 },
          "Oregon Taxes": { limit: 43000, rate: 0.021 },
          "Pennsylvania Taxes": { limit: 10000, rate: 0.03822 },
          "Rhode Island Taxes": { limit: 24000, rate: 0.0109 },
          "South Carolina Taxes": { limit: 14000, rate: 0.0045 },
          "South Dakota Taxes": { limit: 15000, rate: 0.012 },
          "Tennessee Taxes": { limit: 7000, rate: 0.027 },
          "Texas Taxes": { limit: 9000, rate: 0.027 },
          "Utah Taxes": { limit: 35700, rate: 0.003 },
          "Vermont Taxes": { limit: 16000, rate: 0.01 },
          "Virginia Taxes": { limit: 8000, rate: 0.025 },
          "Washington Taxes": { limit: 56200, rate: 0.0125 },
          "West Virginia Taxes": { limit: 12000, rate: 0.027 },
          "Wisconsin Taxes": { limit: 14000, rate: 0.0305 },
          "Wyoming Taxes": { limit: 25800, rate: 0.018 }
        };
        break;
      default:
        return "0";
    }
  
    if (!mapping.hasOwnProperty(stateTax)) {
      return 0;
    }
  
    const { limit, rate } = mapping[stateTax];
    return Math.min(wageAmount, limit) * rate;
}  

function updateStaticUnemploymentFields() {
    let totalFUTA = 0;
    let totalUnemployment = 0;
    for (let key in w2WageMap) {
      if (w2WageMap.hasOwnProperty(key)) {
        let mapping = w2WageMap[key];
        if (mapping.isBusinessRelated) {
          totalFUTA += mapping.futaValue || 0;
          totalUnemployment += mapping.unemploymentTax ?? 0;
        }
      }
    }
    const futaField = document.getElementById('staticFUTA');
    if (futaField) {
      futaField.value = formatCurrency(totalFUTA.toFixed(2));
    }
    const unemploymentField = document.getElementById('staticUnemployment2022_2025');
    if (unemploymentField) {
      unemploymentField.value = formatCurrency(totalUnemployment.toFixed(2));
    }
}

//---------------------------------------------//
// 28. TOTAL FEDERAL AND STATE TAX CALCULATION //
//---------------------------------------------//

/**
 * Compute ordinary-income tax on `income` for given filing status & year.
 */
function computeOrdinaryTax(income, filingStatus, year) {
    // --- bracket tables keyed by year → status → [ { threshold, rate }, ... ] ---

    const statusBrackets =
      (ORDINARY_TAX_BRACKETS[year] || ORDINARY_TAX_BRACKETS[2024])[filingStatus];
    if (!statusBrackets) return 0;

    console.log(`computeOrdinaryTax: taxing ${income} at ${filingStatus}/${year} brackets:`, statusBrackets);
  
    let remaining = income, lastThreshold = 0, tax = 0;
    for (let { threshold, rate } of statusBrackets) {
      const slice = Math.max(0, Math.min(remaining, threshold - lastThreshold));
      console.log(`  ▷ $${lastThreshold}–$${threshold} (@${rate*100}%): slice $${slice}`);
      tax  += slice * rate;
      remaining -= slice;
      lastThreshold = threshold;
      if (remaining <= 0) break;
    }
    console.log(`  → ordinary tax total = $${tax}`);
    return tax;
}

// IRS Tax Table emulation for taxable income under $100,000
function computeOrdinaryTaxUsingTable(amount, filingStatus, year) {
  if (amount <= 0) return 0;
  const bandMidpoint = Math.floor(amount / 50) * 50 + 25;
  return Math.round(computeOrdinaryTax(bandMidpoint, filingStatus, year));
}

// Optional: expose for console testing
window.computeOrdinaryTaxUsingTable = computeOrdinaryTaxUsingTable;

// expose for console testing
window.computeOrdinaryTax = computeOrdinaryTax;

  const CG_THRESHOLDS = {
    2022: {
      Single:                      { zero: 41675, fifteen: 459750 },
      'Married Filing Jointly':    { zero: 83350, fifteen: 517200 },
      'Married Filing Separately': { zero: 41675, fifteen: 258600 },
      'Head of Household':         { zero: 55800, fifteen: 488500 }
    },
    2023: {
      Single:                      { zero: 44625, fifteen: 492300 },
      'Married Filing Jointly':    { zero: 89250, fifteen: 553850 },
      'Married Filing Separately': { zero: 44625, fifteen: 276900 },
      'Head of Household':         { zero: 59750, fifteen: 523050 }
    },
    2024: {
      Single:                      { zero: 47025, fifteen: 518900 },
      'Married Filing Jointly':    { zero: 94050, fifteen: 583750 },
      'Married Filing Separately': { zero: 47025, fifteen: 291850 },
      'Head of Household':         { zero: 63000, fifteen: 551350 }
    },
    2025: {
      Single:                      { zero: 48350, fifteen: 533400 },
      'Married Filing Jointly':    { zero: 96700, fifteen: 600050 },
      'Married Filing Separately': { zero: 48350, fifteen: 300000 },
      'Head of Household':         { zero: 64750, fifteen: 566700 }
    }
  };

function computeCapitalGainTax(
  taxableIncome,
  qualifiedDividends,
  longTermGains,
  shortTermGains,
  filingStatus,
  year,
  netInvInterest = 0,
  sec1250Gain    = 0,
  collectibles   = 0
) {
  /* ────────────────────────────────────────────────────────────────
     STEP 0 –  **MANDATORY NETTING (Sched D Part III)**
               •  First offset ST‑losses against LT‑gains *or*
                  LT‑losses against ST‑gains, per §1222.
               •  Only the residual LT‑gain (if positive) is eligible
                  for preferential rates.
  ──────────────────────────────────────────────────────────────── */

  let netST  = shortTermGains;          // can be ±
  let netLT  = longTermGains;           // can be ±

  if (netST * netLT < 0) {              // opposite signs → they offset
      const offset = Math.min(Math.abs(netST), Math.abs(netLT));
      if (netLT > 0) {                  // ST loss vs LT gain
          netLT += netST;               // reduce LT gain
          netST  = 0;
      } else {                          // LT loss vs ST gain
          netST += netLT;               // reduce ST gain
          netLT  = 0;
      }
  }

  /* ---------------------------------------------------------------
     STEP 1 – Separate the special‑rate pieces *after* netting
  --------------------------------------------------------------- */
  const cg25 = Math.max(0, sec1250Gain);           // always 25 %
  const cg28 = Math.max(0, collectibles);          // always 28 %

  // only the *net* LT gain is eligible for 0/15/20 % treatment
  const prefGain = Math.max(
      0,
      qualifiedDividends + netLT - cg25 - cg28
  );

  // Ordinary slice = taxable income that is *not* in any preferential bucket
  const ordinarySlice = Math.max(
      0,
      taxableIncome - (prefGain + cg25 + cg28)
  );

  // 2) Compute ordinary-rate tax on the ordinary slice:
  const useTaxTable = taxableIncome < 100000;
  const ordinaryTax = useTaxTable
    ? computeOrdinaryTaxUsingTable(ordinarySlice, filingStatus, year)
    : computeOrdinaryTax(ordinarySlice, filingStatus, year);

  // 3) Map your 2-letter codes back to the full labels in CG_THRESHOLDS:
  const STATUS_MAP = {
    Single: "Single",
    MFJ:    "Married Filing Jointly",
    MFS:    "Married Filing Separately",
    HOH:    "Head of Household",
    QW:     "Qualifying Widow(er)"
  };
  const statusKey = STATUS_MAP[filingStatus] || filingStatus;

  // 4) Pick the correct year-block (default 2023) and then the status block (default MFJ)
  const yearBlock = CG_THRESHOLDS[year] || CG_THRESHOLDS[2023];
  const { zero: Z0, fifteen: F15 } =
        yearBlock[statusKey] || yearBlock["Married Filing Jointly"];

  // 5) Allocate the pref-gain into 0% / 15% / 20% buckets:

  /* --------------------------------------------------------------------
     STEP A – figure out how much 0 % room is left *after* ordinary income
  -------------------------------------------------------------------- */
  const zeroRoom = Math.max(0, Z0 - ordinarySlice);
  const zeroRatePortion = Math.min(prefGain, zeroRoom);

  /* --------------------------------------------------------------------
     STEP B – how much 15 % room is left after ordinary income
              (and after any 0 % portion we just used)?
  -------------------------------------------------------------------- */
  const ordinaryUsed15 = Math.max(0, ordinarySlice - Z0);          // part of the 15 % bracket
  const avail15        = Math.max(0, F15 - Z0 - ordinaryUsed15);   // left‑over 15 % room
  const remAfterZero   = prefGain - zeroRatePortion;
  const fifteenRatePortion = Math.min(remAfterZero, avail15);

  /* --------------------------------------------------------------------
     STEP C – whatever is still left is taxed at 20 %
  -------------------------------------------------------------------- */
  const twentyRatePortion = Math.max(0, remAfterZero - fifteenRatePortion);

  /* ---------------------------------------------------------------
     STEP 6 – Apply the statutory rates
  --------------------------------------------------------------- */
  const tax15   = fifteenRatePortion * 0.15;
  const tax20   = twentyRatePortion  * 0.20;
  const tax1250 = cg25              * 0.25;
  const tax28   = cg28              * 0.28;

  const prefTax = tax15 + tax20 + tax1250 + tax28;

  return { ordinaryTax, prefTax };
}

/**
 * Recalculates and writes:
 *   • tax (ordinary + cap-gain, Schedule D)
 *   • totalFederalTax
 *   • totalTax = totalFederalTax + stateTotalTax + employeeTaxes
 */
function updateTotalTax() {
  // 1) Gather the inputs you already have
  const taxableIncome      = getFieldValue('taxableIncome');
  // taxableIncome already has either the standard or the itemized
  // deduction baked in, so send it straight to Schedule D:
  const taxableForCalculation = taxableIncome;
  const qualifiedDividends = getFieldValue('qualifiedDividends');
  const longTermGains      = getFieldValue('longTermCapitalGains');
  const shortTermGains     = getFieldValue('shortTermCapitalGains');
  const filingStatus       = document.getElementById('filingStatus').value;
  const year               = parseInt(document.getElementById('year').value, 10);

  // 2) Worksheet D–specific fields
  //    net investment interest expense = Form 4952 line 4g minus line 4e (but not below 0)
  const netInvestmentInterestExpense = Math.max(
    0,
    getFieldValue('form4952Line4g') - getFieldValue('form4952Line4e')
  );

  //    § 1250 unrecaptured gain
  let unrecapturedSection1250Gain = getFieldValue('unrecapturedSection1250Gain'); 
  unrecapturedSection1250Gain = Math.max(0, unrecapturedSection1250Gain); 
  
  //    Collectibles (§ 1202) gain
  const collectiblesGain = getFieldValue('collectiblesGain');

  // 3) Compute Schedule D + ordinary tax
  const { ordinaryTax, prefTax } = computeCapitalGainTax(
    taxableForCalculation,
    qualifiedDividends,
    longTermGains,
    shortTermGains,
    filingStatus,
    year,
    netInvestmentInterestExpense,
    unrecapturedSection1250Gain,
    collectiblesGain
  );
  // IRS wants the combined tax rounded to the nearest dollar
  const computedTax = Math.round(ordinaryTax + prefTax);

  // 4) Other income‐tax pieces
  const additionalMedicare = getFieldValue('additionalMedicareTax');
  const netInvestment      = getFieldValue('netInvestmentTax');
  const selfEmployment     = getFieldValue('selfEmploymentTax');
  const otherTaxes         = getFieldValue('otherTaxes');
  const amt                = getFieldValue('AMT');

  // 5) Credits
  const foreignCredit   = getFieldValue('foreignTaxCredit');
  const businessCredit  = getFieldValue('generalBusinessCredit');
  const childCredit     = getFieldValue('childTaxCredit');
  const otherCredits    = getFieldValue('otherCredits');
  const childAndDependentCareCredit   = getFieldValue('creditForChildAndDependentCareExpenses');
  const educationCredits = getFieldValue('educationCredits');

  // 6) State & payroll taxes
  const employeeFICA  = getFieldValue('employeeTaxes');
  const employerFICA  = getFieldValue('employerTaxes');


  // 7) Build your Total Federal Tax (income‐tax only)
  let totalFed =
      computedTax
    + amt
    + additionalMedicare
    + netInvestment
    + selfEmployment
    + otherTaxes
    + foreignCredit
    + childAndDependentCareCredit
    + businessCredit
    + childCredit
    + otherCredits
    + educationCredits;

  // 8) Formatting helper
  function fmt(amount) {
    const rounded = Math.round(amount);
    const str     = formatCurrency(String(Math.abs(rounded)));
    return rounded < 0 ? `(${str})` : str;
  }

  // 9) Write everything back to the form
  const taxField   = document.getElementById('tax');
  const fedField   = document.getElementById('totalFederalTax');

  const totalField = document.getElementById('totalTax');
  const stateTax = getFieldValue('totalStateTax');
  
  if (taxField)   taxField.value   = fmt(computedTax);
  if (fedField)   fedField.value   = fmt(totalFed);

  if (totalField) {
    const grandTotal = totalFed + stateTax + employeeFICA + employerFICA;
    totalField.value = fmt(grandTotal);
  }
  
  // Keep Payments section in sync with latest federal tax
  updateFederalPayments();
}

function updateFederalPayments() {
  const fedTax          = getFieldValue('totalFederalTax');
  const penalty         = getFieldValue('penalty');
  const manualWH        = getFieldValue('withholdings');
  const addlMedWH       = getFieldValue('withholdingsOnAdditionalMedicareWages');
  const estPays         = getFieldValue('estimatedTaxPayments');
  const otherPays       = getFieldValue('otherPaymentsAndCredits');

  const totalPayments   = manualWH + addlMedWH + estPays + otherPays;
  const liability       = fedTax + penalty;

  const balanceDue      = Math.max(0, liability - totalPayments);
  const overpayment     = Math.max(0, totalPayments - liability);

  const refundEl  = document.getElementById('estimatedRefundOverpayment');
  const dueEl     = document.getElementById('estimatedBalanceDue');

  if (refundEl) refundEl.value = formatCurrency(String(overpayment));
  if (dueEl)    dueEl.value    = formatCurrency(String(balanceDue));
}

const pet = document.getElementById('petSprite');
let petVisible = false;

document.getElementById('doNotTouchBtn').addEventListener('click', function () {
  if (!petVisible) {
    // Show pet and start following the cursor
    pet.style.display = 'block';
    petVisible = true;

    document.addEventListener('mousemove', followCursor);
  } else {
    // Stop following and hide pet
    document.removeEventListener('mousemove', followCursor);
    pet.style.display = 'none';
    petVisible = false;
  }
});

document.getElementById('localTaxAfterCredits')
  .addEventListener('input', () => {
    updateTotalStateTax();

  });

document.getElementById('stateTaxesDue')
  .addEventListener('input', () => {
    updateTotalStateTax();

  });


function followCursor(event) {
  const offsetX = 20; // Adjust if you want pet slightly offset from cursor
  const offsetY = 20;

  pet.style.left = `${event.clientX + offsetX}px`;
  pet.style.top = `${event.clientY + offsetY}px`;
}

//-----------------------//
// 29. State Adjustments //
//-----------------------//

const mappings = [
    // Personal Information
    { id: 'year',                                   type: 'write', cell: 'B1' },
    { id: 'filingStatus',                           type: 'write', cell: 'B2' },
    { id: 'state',                                  type: 'write', cell: 'B3' },

    // Payments
    { id: 'estimatedRefundOverpayment',             type: 'write', cell: 'B101' },
    { id: 'estimatedBalanceDue',                    type: 'write', cell: 'B102' },

    // State Taxable Income
    { id: 'localTaxAfterCredits',                   type: 'write', cell: 'B109' },
    { id: 'totalStateTax',                          type: 'read', cell: 'B110' },
    { id: 'stateWithholdings',                      type: 'write', cell: 'B111' },
    { id: 'statePaymentsAndCredits',                type: 'write', cell: 'B112' },
    { id: 'stateInterest',                          type: 'write', cell: 'B113' },
    { id: 'statePenalty',                           type: 'write', cell: 'B114' },
    { id: 'stateEstimatedRefundOverpayment',        type: 'read', cell: 'B115' },
    { id: 'stateEstimatedBalanceDue',               type: 'read', cell: 'B116' },
    { id: 'totalTax',                               type: 'read', cell: 'B117' },
];

const mappingsTotal = [
  // ------- TOP META -------
  { id: 'year',                 type: 'write', cell: 'B1'  },
  { id: 'filingStatus',         type: 'write', cell: 'B2'  },
  { id: 'state',                type: 'write', cell: 'B3'  }, // normalized to "<State> Taxes"
  { id: 'residentInState',      type: 'write', cell: 'B4'  },
  { id: 'olderthan65',          type: 'write', cell: 'B11' },
  { id: 'blind',                type: 'write', cell: 'B12' },

  // ------- INCOME (partial demo – expand as desired) -------
  { id: 'wages',                        type: 'write', cell: 'B26' },
  { id: 'taxExemptInterest',            type: 'write', cell: 'B30' },
  { id: 'taxableInterest',              type: 'write', cell: 'B31' },
  { id: 'taxableIRA',                   type: 'write', cell: 'B32' },
  { id: 'taxableDividends',             type: 'write', cell: 'B33' },
  { id: 'qualifiedDividends',           type: 'write', cell: 'B34' },
  { id: 'iraDistributions',             type: 'write', cell: 'B35' },
  { id: 'pensions',                     type: 'write', cell: 'B36' },
  { id: 'longTermCapitalGains',         type: 'write', cell: 'B37' },
  { id: 'shortTermCapitalGains',        type: 'write', cell: 'B38' },
  { id: 'otherIncome',                  type: 'write', cell: 'B52' },
  { id: 'interestPrivateBonds',         type: 'write', cell: 'B53' },
  { id: 'passiveActivityLossAdjustments', type: 'write', cell: 'B55' },
  { id: 'qualifiedBusinessDeduction',   type: 'write', cell: 'B56' },
  { id: 'totalIncome',                  type: 'write', cell: 'B57' },

  // ------- ADJUSTED GROSS INCOME -------
  { id: 'halfSETax',                    type: 'write', cell: 'B59' },
  { id: 'retirementDeduction',          type: 'write', cell: 'B60' },
  { id: 'medicalReimbursementPlan',     type: 'write', cell: 'B61' },
  { id: 'SEHealthInsurance',            type: 'write', cell: 'B62' },
  { id: 'alimonyPaid',                  type: 'write', cell: 'B63' },
  { id: 'otherAdjustments',             type: 'write', cell: 'B64' },
  { id: 'totalAdjustedGrossIncome',     type: 'write', cell: 'B66' },

  // ------- DEDUCTIONS (partial) -------
  { id: 'medical',                      type: 'write', cell: 'B68' },
  { id: 'stateAndLocalTaxes',           type: 'write', cell: 'B69' },
  { id: 'otherTaxesFromSchK-1',         type: 'write', cell: 'B70' },
  { id: 'interest',                     type: 'write', cell: 'B71' },
  { id: 'contributions',                type: 'write', cell: 'B72' },
  { id: 'otherDeductions',              type: 'write', cell: 'B73' },
  { id: 'carryoverLoss',                type: 'write', cell: 'B74' },
  { id: 'casualtyAndTheftLosses',       type: 'write', cell: 'B75' },
  { id: 'miscellaneousDeductions',      type: 'write', cell: 'B76' },
  { id: 'totalDeductions',              type: 'write', cell: 'B78' },

  // ------- TAX & CREDITS (partial) -------
  { id: 'taxableIncome',                type: 'write', cell: 'B80' },
  { id: 'tax',                          type: 'write', cell: 'B81' },
  { id: 'additionalMedicareTax',        type: 'write', cell: 'B82' },
  { id: 'netInvestmentTax',             type: 'write', cell: 'B83' },
  { id: 'selfEmploymentTax',            type: 'write', cell: 'B84' },
  { id: 'otherTaxes',                   type: 'write', cell: 'B85' },
  { id: 'foreignTaxCredit',             type: 'write', cell: 'B86' },
  { id: 'AMT',                          type: 'write', cell: 'B87' },
  { id: 'creditForChildAndDependentCareExpenses', type: 'write', cell: 'B88' },
  { id: 'generalBusinessCredit',        type: 'write', cell: 'B89' },
  // B90 (Child Tax Credit) is injected in the submit handler if present
  { id: 'otherCredits',                 type: 'write', cell: 'B91' },
  { id: 'educationCredits',             type: 'write', cell: 'B92' },
  // B93 (Total Federal tax) can be injected from UI if you capture it

  // ------- PAYMENTS -------
  { id: 'withholdings',                 type: 'write', cell: 'B96' },
  { id: 'withholdingsOnAdditionalMedicareWages', type: 'write', cell: 'B97' },
  { id: 'estimatedTaxPayments',         type: 'write', cell: 'B98' },
  { id: 'otherPaymentsAndCredits',      type: 'write', cell: 'B99' },
  { id: 'penalty',                      type: 'write', cell: 'B100' },
  { id: 'estimatedRefundOverpayment',   type: 'write', cell: 'B101' },
  { id: 'estimatedBalanceDue',          type: 'write', cell: 'B102' },

  // ------- EMPLOYEE/EMPLOYER TAXES -------
  { id: 'employeeTaxes',                type: 'write', cell: 'B104' },
  { id: 'employerTaxes',                type: 'write', cell: 'B105' },

  // ------- STATE TAX BLOCK (front-end inputs only) -------
  { id: 'localTaxAfterCredits',         type: 'write', cell: 'B109' },
  { id: 'stateWithholdings',            type: 'write', cell: 'B111' },
  { id: 'statePaymentsAndCredits',      type: 'write', cell: 'B112' },
  { id: 'stateInterest',                type: 'write', cell: 'B113' },
  { id: 'statePenalty',                 type: 'write', cell: 'B114' },
  { id: 'stateEstimatedRefundOverpayment', type: 'write', cell: 'B115' },
  { id: 'stateEstimatedBalanceDue',     type: 'write', cell: 'B116' },

  // ------- GRAND TOTAL -------
  { id: 'totalTax',                     type: 'write', cell: 'B147' },
];


// ─── State-Tax “Calculate” Button Flow ─────────────────────────────────
let _stateSectionInitialized = false;

// --- Dynamic State Taxes button + loader helpers ---
const STATE_EDITABLE_IDS = [
  'stateAdditionsToIncome',
  'stateDeductions',
  'stateCredits',
  'stateAfterTaxDeductions'
];
let _stateDirty = false;

function setStateButtonDirty(dirty) {
  const btn = document.getElementById('calculateStateTaxesBTN');
  _stateDirty = !!dirty;
  if (dirty) {
    btn.textContent = 'Update State Taxes';
    btn.classList.add('state-update');
  } else {
    btn.textContent = 'Calculate State Taxes';
    btn.classList.remove('state-update');
  }
}

function attachStateDirtyListeners() {
  STATE_EDITABLE_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => setStateButtonDirty(true));
  });
}

function toggleStateLoader(on) {
  // Drive the in-button animation
  showStateLoader(on);

  // Keep the existing per-field spinner behavior
  const container = document.getElementById('stateTaxableIncomeContent');
  if (container) {
    container.querySelectorAll('input').forEach(inp => {
      inp.classList.toggle('state-field-loading', !!on);
      inp.readOnly = on ? true : inp.hasAttribute('readonly');
    });
  }
}

function renderStateSection(data) {
  const mapping = {
    agi:                    'stateAdjustedGrossIncome',
    additions:              'stateAdditionsToIncome',
    deductions:             'stateDeductions',
    credits:                'stateCredits',
    afterTaxDeductions:     'stateAfterTaxDeductions',
    stateTaxableIncomeInput:'stateTaxableIncomeInput',
    stateTaxesDue:          'stateTaxesDue',
    totalStateTax:          'totalStateTax'
  };

  Object.entries(mapping).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Missing input #${id} for state section.`);
      return;
    }
    const raw = data[key];
    el.value = (raw != null) ? formatCurrency(String(raw)) : '';
    // Allow manual edits for four inputs; everything else is read-only
    const editableIds = new Set([
      'stateDeductions',
      'stateAdditionsToIncome',
      'stateCredits',
      'stateAfterTaxDeductions'
    ]);
    if (!editableIds.has(id)) {
      el.readOnly = true;
      el.classList.add('readonly');
    } else {
      el.readOnly = false;
      el.classList.remove('readonly');
    }
  });
  updateTotalStateTax();

}
    
// Wire up the “Calculate State Taxes” button
//document.getElementById('calculateStateTaxesBTN').addEventListener('click', handleCalculateStateTaxes);

async function readStateData() {
  const agi = parseFloat(document.getElementById('totalAdjustedGrossIncome').value.replace(/[\$,]/g, '')) || 0;
  const w2Income = parseFloat(document.getElementById('wages').value.replace(/[\$,]/g, '')) || 0;
  const taxableIncome = parseFloat(document.getElementById('taxableIncome').value.replace(/[\$,]/g, '')) || 0;

  const writes = mappings
    .filter(m => m.type === 'write')
    .map(m => {
      const el  = document.getElementById(m.id);
      const raw = el.value.trim();
      let value;

      if (m.id === 'state') {
        value = `${raw} Taxes`;
      } else if (m.id === 'blind') {
        const code = raw.toLowerCase();
        if (code === 'zero') value = 0;
        else if (code === 'one' || code === '1') value = 1;
        else if (code === 'two' || code === '2') value = 2;
        else value = parseInt(raw, 10) || 0;
      } else {
        value = (raw === '') ? 0 : (isNaN(+raw.replace(/[\$,]/g,'')) ? raw : parseFloat(raw.replace(/[\$,]/g,'')));
      }
      return { cell: m.cell, value };
    });

  const payload = {
    writes,
    state: document.getElementById('state').value.trim(),
    w2Income,
    agi,
    taxableIncome
  };

  const resp = await fetch('/api/calculateStateTaxes2', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

async function handleCalculateStateTaxes() {
  const btn = document.getElementById('calculateStateTaxesBTN');
  btn.disabled = true;
  toggleStateLoader(true);

  try {
    if (!_stateSectionInitialized) {
      // FIRST RUN
      const data = await readStateData();
      renderStateSection(data);
      _stateSectionInitialized = true;

      // Start watching for edits after first paint
      attachStateDirtyListeners();
    } else {
        const parseMoney = (id) =>
          Number((document.getElementById(id).value || "0").replace(/[^0-9.-]/g, "")) || 0;
        
        const payload = {
          state: document.getElementById('state').value.trim(),
          year: Number(document.getElementById('year').value) || undefined,
          filingStatus: document.getElementById('filingStatus').value || undefined,
        
          // Both AGI and Taxable Income available — backend will choose based on label
          agi: Number((document.getElementById('totalAdjustedGrossIncome').value || "0").replace(/[^0-9.-]/g, "")) || undefined,
          taxableIncome: Number((document.getElementById('taxableIncome').value || "0").replace(/[^0-9.-]/g, "")) || undefined,
        
          // Editable state fields
          additions: parseMoney('stateAdditionsToIncome'),
          deductions: parseMoney('stateDeductions'),
          credits: parseMoney('stateCredits'),
          afterTaxDeductions: parseMoney('stateAfterTaxDeductions'),
        };
        
        const resp = await fetch('/api/stateInputs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`State tax update failed (${resp.status}): ${txt}`);
        }
        const data = await resp.json();
        renderStateSection(data);
        
        // Reset button back to "Calculate State Taxes"
        setStateButtonDirty(false);
    }
  } catch (err) {
    console.error(err);
    alert(err.message || 'State tax calculation failed.');
  } finally {
    toggleStateLoader(false);
    btn.disabled = false;
  }
  updateTotalTax();

}
 
/* ----- OUTLIER STATE TEMPLATES (UI + API) -----*/

// No-tax jurisdictions (can short-circuit to zero)
const NO_TAX_STATES = new Set([
  'Alaska','Florida','Nevada','South Dakota','Tennessee','Texas','Washington','Wyoming','New Hampshire'
]);

// Use a slugged id for every dynamic state field so keys like "standardDeduction/Itemized"
// don't create invalid/fragile element ids. The *label* stays verbatim for Graph lookups.
function stateFieldId(key) {
  return `state_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

// Some "output" fields should still be editable in the UI.
// state => set of keys that are editable despite io:'output'
const EDITABLE_OUTPUT_OVERRIDES = {
  'New York': new Set(['standardDeductionOrItemized'])
};

function isEditableOutput(stateName, key) {
  return !!(EDITABLE_OUTPUT_OVERRIDES[stateName] && EDITABLE_OUTPUT_OVERRIDES[stateName].has(key));
}

// helper: read only if the user entered something
function readMoneyIfPresent(id) {
  const el = document.getElementById(id);
  if (!el) return undefined;
  const raw = (el.value ?? '').trim();
  if (raw === '') return undefined;     // <- key change: don't force 0
  return unformatCurrency(raw);
}

// Template schema notes:
// - key:    stable field id for UI & API
// - label:  exact text from Column A in Excel for that state (server uses it to find the row)
// - io:     'input' (editable) or 'output' (read-only)
// - leadKey:'agi' or 'taxableIncome' (what the sheet expects as the key “driver” value)
const OUTLIER_TEMPLATES = {

  'Connecticut': {
    leadKey: 'agi',  // CT block starts with AGI according to your sheet
    fields: [
      { key: 'ctTaxableIncomeTop',          label: 'Connecticut Taxable Income',               io: 'output' },
      { key: 'ctTaxDueTop',                 label: 'Connecticut Tax Due',                      io: 'output' },
      { key: 'agi',                         label: 'AGI',                                      io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                      io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                               io: 'input'  },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                     io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                          io: 'output' },
      { key: 'taxRatePhaseOut',             label: 'Tax Rate Phase Out (Additional Tax)',      io: 'output' },
      { key: 'benefitRecapturePhaseIn',     label: 'Benefit Recapture Phase In',               io: 'output' },
      { key: 'totalStateTaxesDue',          label: 'Total State Taxes Due',                    io: 'output' },
      { key: 'credits',                     label: 'Credits',                                  io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After Tax Deductions',                     io: 'output' },
      { key: 'total',                       label: 'Total',                                    io: 'output' }
    ]   
  },    

  'Maryland': {   
    leadKey: 'agi',   
    fields: [   
      { key: 'mdTaxableIncomeTop',          label: 'Maryland Taxable Income',                  io: 'output' },
      { key: 'mdTaxDueTop',                 label: 'Maryland Tax Due',                         io: 'output' },
      { key: 'agi',                         label: 'AGI',                                      io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                      io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                               io: 'input'  },
      { key: 'standardDeductionOrItemized', label: 'Standard Deduction or Itemized',           io: 'input'  },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                     io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                          io: 'output' },
      { key: 'localTax',                    label: 'Local Tax',                                io: 'output' },
      { key: 'total',                       label: 'Total',                                    io: 'output' }
    ]
  },

  'Massachusetts': { 
    leadKey:'agi', 
    fields:[
      { key: 'maTaxableIncomeTop',          label: 'Massachusetts Taxable Income',              io: 'output' },
      { key: 'maTaxDueTop',                 label: 'Massachusetts Tax Due',                     io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'personalExemption',           label: 'Personal Exemption',                        io: 'output' },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ]  
  }, 
 
  'Michigan': {  
    leadKey:'agi',  
    fields:[ 
      { key: 'miTaxableIncomeTop',          label: 'Michigan Taxable Income',                   io: 'output' },
      { key: 'miTaxDueTop',                 label: 'Michigan Tax Due',                          io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'exemption',                   label: 'Exemption',                                 io: 'input'  },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ]  
  }, 
 
  'Nebraska': {  
    leadKey:'agi',  
    fields:[ 
      { key: 'neTaxableIncomeTop',          label: 'Nebraska Taxable Income',                   io: 'output' },
      { key: 'neTaxDueTop',                 label: 'Nebraska Tax Due',                          io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'standardDeduction',           label: 'Standard Deduction',                        io: 'output' },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ]   
  },  
  
  'Oregon': {   
    leadKey:'agi',   
    fields:[  
      { key: 'orTaxableIncomeTop',          label: 'Oregon Taxable Income',                     io: 'output' },
      { key: 'orTaxDueTop',                 label: 'Oregon Tax Due',                            io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'exemption',                   label: 'Exemption',                                 io: 'output' },
      { key: 'standardDeduction',           label: 'Standard Deduction',                        io: 'output' },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ]   
  },  
  
  'Wisconsin': {   
    leadKey:'agi',   
    fields:[  
      { key: 'wiTaxableIncomeTop',          label: 'Wisconsin Taxable Income',                  io: 'output' },
      { key: 'wiTaxDueTop',                 label: 'Wisconsin Tax Due',                         io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'totalIncome',                 label: 'Total Income',                              io: 'output' },
      { key: 'standardDeduction',           label: 'Standard Deduction',                        io: 'output' },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ]   
  },  
    
  'Washington D.C.': {   
    leadKey:'agi',   
    fields:[  
      { key: 'dcTaxableIncomeTop',          label: 'Washington D.C. Taxable Income',            io: 'output' },
      { key: 'dcTaxDueTop',                 label: 'Washington D.C. Tax Due',                   io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'spouse1',                     label: 'Spouse 1 Portion of Income',                io: 'output' },
      { key: 'spouse2',                     label: 'Spouse 2 Portion of Income',                io: 'input'  },
      { key: 'stateTaxesDue',               label: 'State Taxes Due',                           io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ] 
  },

  'New York': {   
    leadKey:'agi',   
    fields:[  
      { key: 'nyTaxableIncomeTop',          label: 'New York Taxable Income',                   io: 'output' },
      { key: 'nyTaxDueTop',                 label: 'New York Tax Due',                          io: 'output' },
      { key: 'agi',                         label: 'AGI',                                       io: 'output' },
      { key: 'additions',                   label: 'Additions to Income',                       io: 'input'  },
      { key: 'deductions',                  label: 'Deductions',                                io: 'input'  },
      { key: 'nyagi',                       label: 'New York AGI',                              io: 'output' },
      { key: 'standardDeductionOrItemized', label: 'Standard or Itemized Deduction',            io: 'output' },
      { key: 'otherDeductions',             label: 'Other Deductions',                          io: 'input'  },
      { key: 'stateTaxableIncome',          label: 'State Taxable Income',                      io: 'output' },
      { key: 'newYorkTaxDue',               label: 'New York Tax Due',                          io: 'output' },
      { key: 'credits',                     label: 'Credits',                                   io: 'input'  },
      { key: 'afterTaxDeductions',          label: 'After Tax Deductions',                      io: 'input'  },
      { key: 'total',                       label: 'Total',                                     io: 'output' },
    ] 
  },

  // TODO:
  'Missouri':       { leadKey:'taxableIncome', fields:[/*...*/] },
};

// helper: returns template object or null
function getOutlierTemplate(stateName) {
  return OUTLIER_TEMPLATES[stateName] || null;
}

function showStateLoader(show) {
  const btn = document.getElementById('calculateStateTaxesBTN');
  if (!btn) return;
  btn.classList.toggle('is-loading', !!show);
  btn.disabled = !!show;
  btn.setAttribute('aria-busy', show ? 'true' : 'false');
}

// Build one UI field
function renderField(container, tplField, stateName) {
  const wrap = document.createElement('div');
  wrap.className = 'form-group';

  const label = document.createElement('label');
  label.htmlFor = stateFieldId(tplField.key);
  label.textContent = tplField.label + ':';
  wrap.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = stateFieldId(tplField.key);
  input.name = stateFieldId(tplField.key);
  input.classList.add('currency-field');
  // Keep outputs read-only *unless* explicitly overridden
  if (tplField.io === 'output' && !isEditableOutput(stateName, tplField.key)) {
    input.readOnly = true;
  } else {
    input.readOnly = false;
    input.classList.remove('readonly');
  }
  wrap.appendChild(input);

  container.appendChild(wrap);
}

// Renders the common state adjustments for BOTH normal and outlier flows
// Uses the SAME IDs as the static block so existing logic keeps working.
function renderCommonStateAdjustments(container) {
  const block = document.createElement('div');
  block.className = 'form-group';
  block.id = 'stateCommonAdjustments';

  block.innerHTML = `
    <div class="form-group">
      <label for="localTaxAfterCredits">Local Tax after Credits:</label>
      <input type="text" id="localTaxAfterCredits" name="localTaxAfterCredits" class="currency-field">
    </div>

    <div class="form-group">
      <label for="stateWithholdings">Withholdings:</label>
      <input type="text" id="stateWithholdings" name="stateWithholdings" class="currency-field">
    </div>

    <div class="form-group">
      <label for="statePaymentsAndCredits">Payments and Credits:</label>
      <input type="text" id="statePaymentsAndCredits" name="statePaymentsAndCredits" class="currency-field">
    </div>

    <div class="form-group">
      <label for="stateInterest">Interest:</label>
      <input type="text" id="stateInterest" name="stateInterest" class="currency-field">
    </div>

    <div class="form-group">
      <label for="statePenalty">Penalty:</label>
      <input type="text" id="statePenalty" name="statePenalty" class="currency-field">
    </div>

    <div class="form-group">
      <label for="stateEstimatedRefundOverpayment">Estimated Refund (Overpayment):</label>
      <input type="text" id="stateEstimatedRefundOverpayment" name="stateEstimatedRefundOverpayment" class="currency-field" readonly required>
    </div>

    <div class="form-group">
      <label for="stateEstimatedBalanceDue">Estimated Balance Due:</label>
      <input type="text" id="stateEstimatedBalanceDue" name="stateEstimatedBalanceDue" class="currency-field" readonly required>
    </div>
  `;

  container.appendChild(block);

  // Currency formatting on blur (reuse your global helper)
  block.querySelectorAll('.currency-field').forEach((el) => {
    el.addEventListener('blur', () => {
      el.value = formatCurrency(el.value);
    });
  });

  // Live recompute when users type
  ['localTaxAfterCredits','stateWithholdings','statePaymentsAndCredits','stateInterest','statePenalty']
    .forEach(id => {
      const el = block.querySelector('#' + id);
      if (el) {
        el.addEventListener('input', () => {
          updateTotalStateTax();
          updateTotalTax(); // keep grand totals synced
        });
      }
    });
}

// Render a full template (outlier state)
function renderOutlierUI(stateName) {
  const staticBlock = document.getElementById('stateStaticBlock');
  const dyn = document.getElementById('stateDynamicContainer');
  const tpl = getOutlierTemplate(stateName);
  if (!dyn || !tpl) return;

  // hide static block, show dynamic
  if (staticBlock) staticBlock.style.display = 'none';
  dyn.style.display = 'block';
  dyn.innerHTML = ''; // clear

  D(`Render outlier UI for ${stateName}`, getOutlierTemplate(stateName));

  // header readout for selected state (to mirror your static "[ State ]" field)
  const header = document.createElement('div');
  header.className = 'form-group';
  header.innerHTML = `
    <label>[ State ]</label>
    <input type="text" id="selectStateDyn" readonly value="${stateName}">
  `;
  dyn.appendChild(header);

  // add all configured fields
  tpl.fields.forEach(f => renderField(dyn, f, stateName));

  // Mark button dirty on any edit in the dynamic state block
  dyn.addEventListener('input', (e) => {
    if (e.target && e.target.matches('input')) {
      setStateButtonDirty(true);
    }
  }, { once: false });

  // At the end of renderOutlierUI(stateName)
  const outlierTotalEl = document.getElementById('state_total'); // the dynamic "Total:" for outliers
  if (outlierTotalEl) {
    const syncTotal = () => {
      const n = unformatCurrency(outlierTotalEl.value || '0');
      const totalStateTaxEl = document.getElementById('totalStateTax');
      if (totalStateTaxEl) {
        totalStateTaxEl.value = formatCurrency(String(n));
      }
      updateTotalStateTax(); // keep balance/refund in sync
    };
    outlierTotalEl.addEventListener('input', syncTotal);
    syncTotal(); // run once immediately
  }

  updateTotalStateTax();
}

function moveFormGroupByFieldId(fieldId, targetContainer) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  const group = field.closest('.form-group') || field;
  targetContainer.appendChild(group);
}

// Move the common state adjustment groups between static and dynamic containers.
function relocateCommonStateAdjustments(fromContainer, toContainer) {
  // Order matters so the UI looks sane
  const idsInOrder = [
    'localTaxAfterCredits',
    'totalStateTax',
    'stateWithholdings',
    'statePaymentsAndCredits',
    'stateInterest',
    'statePenalty',
    'stateEstimatedRefundOverpayment',
    'stateEstimatedBalanceDue'
  ];
  idsInOrder.forEach(id => moveFormGroupByFieldId(id, toContainer));
}

// Switch UI for a selected state
function switchStateLayout(stateName) {
  const staticBlock = document.getElementById('stateStaticBlock');
  const dyn         = document.getElementById('stateDynamicContainer');

  if (NO_TAX_STATES.has(stateName)) {
    if (dyn) dyn.style.display = 'none';
    if (staticBlock) staticBlock.style.display = 'block';
    const zero = v => (document.getElementById(v) && (document.getElementById(v).value = formatCurrency('0')));
    ['stateAdjustedGrossIncome','stateTaxableIncomeInput','stateTaxesDue','totalStateTax'].forEach(zero);
    const btn = document.getElementById('calculateStateTaxesBTN');
    if (btn) { btn.disabled = true; btn.title = 'No state income tax'; }
    return;
  }

  const tpl = getOutlierTemplate(stateName);
  const btn = document.getElementById('calculateStateTaxesBTN');
  if (btn) { btn.disabled = false; btn.title = ''; }

  if (tpl) {
    // Show dynamic block, hide static, paint outlier fields
    if (staticBlock) staticBlock.style.display = 'none';
    if (dyn) {
      dyn.style.display = 'block';
      dyn.innerHTML = '';                  // clear dyn
      renderOutlierUI(stateName);          // render outlier-specific fields

      // ⬇️ Move the existing common groups from static → dynamic to avoid duplicate IDs
      relocateCommonStateAdjustments(staticBlock, dyn);

      // Recompute totals once everything is in place
      updateTotalStateTax();
      updateTotalTax();
    }
  } else {
    // Normal state → show static block again and move groups back
    if (dyn) dyn.style.display = 'none';
    if (staticBlock) {
      staticBlock.style.display = 'block';
      // ⬇️ Move the common groups back into static block
      relocateCommonStateAdjustments(dyn, staticBlock);
      updateTotalStateTax();
      updateTotalTax();
    }
  }
}

// Pull number safely from either static or dynamic field ids
function readMoney(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return unformatCurrency(el.value || '0');
}

// Read AGI/Taxable Income from your existing totals
function readLeadNumbers() {
  return {
    agi:           readMoney('totalAdjustedGrossIncome'),
    taxableIncome: readMoney('taxableIncome')
  };
}

// Attach or replace the calculate handler exactly once
(function wireStateCalcButton() {
  const btn = document.getElementById('calculateStateTaxesBTN');
  if (!btn || btn.dataset.bound === 'true') return;

  btn.addEventListener('click', async () => {
    const state = document.getElementById('state')?.value;
    if (!state) return;

    const { agi, taxableIncome } = readLeadNumbers();
    const year = parseInt(document.getElementById('year')?.value, 10) || undefined;
    const filingStatus = document.getElementById('filingStatus')?.value || undefined;

    D('Click Update State Taxes', { state, year, filingStatus, agi, taxableIncome });

    // Nice UX
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = (btn.textContent.includes('Calculate')) ? 'Update State Taxes' : 'Update State Taxes';
    showStateLoader(true);

    try {
      const tpl = getOutlierTemplate(state);

      if (tpl) {
        // Build schema & inputs for flex endpoint
         const schema = {
           leadKey: tpl.leadKey,
           labels:  Object.fromEntries(tpl.fields.map(f => [f.key, f.label])),
           readKeys: tpl.fields.map(f => f.key),
           ioByKey: Object.fromEntries(tpl.fields.map(f => [f.key, f.io]))
         };
         const inputs = {};
         tpl.fields.forEach(f => {
           // Normal editable inputs...
           if (f.io === 'input') {
             inputs[f.key] = readMoney(stateFieldId(f.key));
             return;
           }
          // Editable "outputs" (only include if user typed something)
          if (isEditableOutput(state, f.key)) {
            const maybe = readMoneyIfPresent(stateFieldId(f.key));
            if (maybe !== undefined) inputs[f.key] = maybe;
          }
        });

       // Maryland requires the chosen "Standard Deduction or Itemized".
       // Use your already-computed Total Deductions as the source of truth.
       if (state === 'Maryland') {
         const chosenDeduction = getFieldValue('totalDeductions'); // pulls & unformats "#totalDeductions"
         if (!inputs.standardDeductionOrItemized || inputs.standardDeductionOrItemized <= 0) {
           inputs.standardDeductionOrItemized = chosenDeduction;
         }
       }

        // Clamp some obviously non-negative concepts
        if (inputs.credits != null && inputs.credits < 0) inputs.credits = 0;
        if (inputs.deductions != null && inputs.deductions < 0) inputs.deductions = 0;

        // Call flexible endpoint
        const payload = {
          state, year, filingStatus, agi, taxableIncome,
          inputs, schema
        };
        const res = await fetch('/api/stateInputsFlex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // Paint outputs back into dynamic UI
        tpl.fields.forEach(f => {
          const id = stateFieldId(f.key);
          const el = document.getElementById(id);
          if (el && data[f.key] !== undefined) {
            el.value = formatCurrency(String(data[f.key]));
          }
          setStateButtonDirty(false);

          D('Outlier request payload', { state, year, filingStatus, agi, taxableIncome, schema, inputs });

        });

      // 🔁 Copy the outlier "Total:" value into "Total State Tax:"
      const dynTotalEl = document.getElementById('state_total'); // outlier “Total:”
      const totalStateTaxEl = document.getElementById('totalStateTax');
      if (dynTotalEl && totalStateTaxEl) {
        const n = unformatCurrency(dynTotalEl.value || '0');
        totalStateTaxEl.value = formatCurrency(String(n));
      }


      } else {
        // Normal 32-state flow:
        // • First click uses /api/calculateStateTaxes2 (readStateData)
        // • Subsequent updates use /api/stateInputs
        if (!_stateSectionInitialized) {
          const data = await readStateData(); // calls /api/calculateStateTaxes2
          renderStateSection(data);
          _stateSectionInitialized = true;
          attachStateDirtyListeners();
          setStateButtonDirty(false);
        } else {
          const body = {
            state,
            year,
            filingStatus,
            agi,
            taxableIncome,
            additions:          readMoney('stateAdditionsToIncome'),
            deductions:         readMoney('stateDeductions'),
            credits:            readMoney('stateCredits'),
            afterTaxDeductions: readMoney('stateAfterTaxDeductions')
          };
          const res = await fetch('/api/stateInputs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          const set = (id, key) => {
            const el = document.getElementById(id);
            if (el && data[key] !== undefined) el.value = formatCurrency(String(data[key]));
          };
          set('stateAdjustedGrossIncome', 'agi');
          set('stateAdditionsToIncome',   'additions');
          set('stateDeductions',          'deductions');
          set('stateTaxableIncomeInput',  'stateTaxableIncomeInput');
          set('stateTaxesDue',            'stateTaxesDue');
          set('stateCredits',             'credits');
          set('stateAfterTaxDeductions',  'afterTaxDeductions');
          set('totalStateTax',            'totalStateTax');
          setStateButtonDirty(false);
        }
      }
    } catch (err) {
      console.error(err);
      alert('State tax calculation failed: ' + (err.message || err));
  } finally {
    showStateLoader(false);
    // Ensure totals refresh for both normal and outlier paths
    updateTotalTax();
  }
  });

  btn.dataset.bound = 'true';
})();

// When the user changes the state, flip between static/dynamic layouts
(function wireStateChangeLayout() {
  const stateSel = document.getElementById('state');
  if (!stateSel || stateSel.dataset.layoutBound === 'true') return;

  stateSel.addEventListener('change', function() {
    const stateName = this.value;
    // keep your existing mirror to [ State ] field
    const selectStateEl = document.getElementById('selectState');
    if (selectStateEl) {
      selectStateEl.value = stateName;
      selectStateEl.classList.add('auto-copied');
    }
    switchStateLayout(stateName);
    // If we're on a normal state, the next click should use /api/calculateStateTaxes2
    if (!getOutlierTemplate(stateName)) {
      _stateSectionInitialized = false;
      setStateButtonDirty(false);
    }
  });

  stateSel.dataset.layoutBound = 'true';
})();
