//-------------------------------//
// 1. SUBMIT HANDLER AND RESULTS //
//-------------------------------//

document.getElementById('taxForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    // Gather form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields to numbers (strip currency formatting if present)
    for (let key in data) {
        if (!isNaN(data[key]) && data[key].trim() !== '') {
            data[key] = parseFloat(data[key].replace(/[^0-9.-]/g, ''));
        }
    }

    // Display loading message
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Processing your data...</p>';
    resultsDiv.classList.remove('hidden');

    try {
        // Example: POST to local Flask server. Adjust if needed:
        const response = await fetch('http://127.0.0.1:5000/process-tax-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to process the data.');
        const resultData = await response.json();
        displayResults(resultData);

    } catch (error) {
        resultsDiv.innerHTML = '<p>Error processing your data. Try again later.</p>';
    }
});

// Display results from server
function displayResults(resultData) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Your Tax Results</h2>
        <p><strong>Taxable Income:</strong> $${resultData.taxableIncome.toFixed(2)}</p>
        <p><strong>Total Tax Owed:</strong> $${resultData.totalTax.toFixed(2)}</p>
        <p><strong>Refund or Amount Due:</strong> $${resultData.refundOrDue.toFixed(2)}</p>
    `;
}

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
        element.style.backgroundColor = ''; // Reset styling
    }, 500);
}

//--------------------------------//
// 4. DYNAMIC DEPENDENTS CREATION //
//--------------------------------//

document.getElementById('numberOfDependents').addEventListener('input', function() {
    const numDependents = parseInt(this.value, 10);
    const dependentsContainer = document.getElementById('dependentsSection');
    dependentsContainer.innerHTML = ''; // Clear old fields

    if (!isNaN(numDependents) && numDependents > 0) {
        const heading = document.createElement('h1');
        heading.textContent = 'Children / Dependents Details';
        dependentsContainer.appendChild(heading);

        // Create input fields for each dependent
        for (let i = 1; i <= numDependents; i++) {
            createDependentFields(dependentsContainer, i);
        }
    }
});

function createDependentFields(container, index) {
    const dependentGroup = document.createElement('div');
    dependentGroup.classList.add('dependent-entry');

    // 1. Dependent Name
    createLabelAndInput(dependentGroup, `dependent${index}Name`, `Dependent ${index} Name:`, 'text');

    // 2. Dropdown for DOB or Age
    createLabelAndDropdown(dependentGroup, `dependent${index}DOBOrAge`, `Do You Know the Dependent's DOB or Current Age?`, ['Please Select', 'Yes', 'No']);

    // Container for conditional fields
    const conditionalContainer = document.createElement('div');
    conditionalContainer.id = `conditionalContainer${index}`;
    dependentGroup.appendChild(conditionalContainer);

    // Add "Qualifies for Child/Dependent Credit?" field
    createLabelAndDropdown(dependentGroup, `dependent${index}Credit`, 'Qualifies for Child/Dependent Credit?', ['Please Select', 'Yes', 'No']);
    
    container.appendChild(dependentGroup);

    // Event listener for DOB or Age dropdown
    document.getElementById(`dependent${index}DOBOrAge`).addEventListener('change', function() {
        handleDOBOrAgeChange(index, this.value);
    });
}

function handleDOBOrAgeChange(index, value) {
    const container = document.getElementById(`conditionalContainer${index}`);
    container.innerHTML = ''; // Clear existing fields

    if (value === 'Yes') {
        // 1. Dependent Birthdate
        createLabelAndInput(container, `dependent${index}Birthdate`, `Dependent ${index} Birthdate:`, 'date');

        // 2. Dependent Current Age
        createLabelAndInput(container, `dependent${index}Age`, `Dependent ${index} Current Age:`, 'number');

        // Age from birthdate
        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
        });
    } else if (value === 'No') {
        // Dropdown for age range
        createLabelAndDropdown(container, `dependent${index}AgeRange`, `What is the Age Category of Child/Dependent ${index}?`, ['Please Select','17 or younger', '18 or older']);
    }

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
}

//----------------------//
// 5. AGE CALCULATIONS  //
//----------------------//

function calculateAge(birthdateValue, ageInputId) {
    const birthdate = new Date(birthdateValue);
    if (isNaN(birthdate.getTime())) {
        // If invalid date, just return
        return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    document.getElementById(ageInputId).value = age;
}

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    validateAgeInput(this, 'current', false);
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    validateAgeInput(this, 'spouse', false);
});

function validateAgeInput(input, index) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);

    if (!isNaN(age) && age >= 0) {
        // Clear any error messages
        if (errorMessage) errorMessage.textContent = '';
    } else {
        if (!errorMessage) {
            errorMessage = document.createElement('p');
            errorMessage.id = errorMessageId;
            errorMessage.style.color = 'red';
            errorMessage.textContent = 'Please enter a valid age';
            input.parentNode.appendChild(errorMessage);
        } else {
            errorMessage.textContent = 'Please enter a valid age';
        }
    }
}

//-----------------------------------------------------//
// 6. AUTO-COPY LAST NAME TO SPOUSE'S LAST NAME        //
//-----------------------------------------------------//

document.getElementById('lastName').addEventListener('input', function() {
    document.getElementById('spouseLastName').value = this.value;
});

//-----------------------------------------------------//
// 7. HELPER FUNCTIONS FOR NUMBER FIELDS AND CURRENCY  //
//-----------------------------------------------------//

function getFieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    // strip currency formatting:
    let val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
    return isNaN(val) ? 0 : val;
}

function formatCurrency(value) {
    // remove any existing commas or dollar signs
    let numericValue = value.replace(/[^0-9.-]/g, '');
    if (numericValue === '') return '';
    let floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return '';

    // Format the value with parentheses for negative numbers
    let formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
        .format(Math.abs(floatValue));
    return floatValue < 0 ? `(${formattedValue})` : formattedValue;
}

function unformatCurrency(value) {
    // Remove parentheses and any other non-numeric characters
    let numericValue = value.replace(/[^\d.-]/g, '');
    return parseFloat(numericValue) || 0;
}

// Automatically format any .currency-field on blur
document.querySelectorAll('.currency-field').forEach((elem) => {
    elem.addEventListener('blur', function() {
        this.value = formatCurrency(this.value);
    });
});

//-----------------------------------------------------------//
// 8. DYNAMIC GENERATION OF BUSINESS FIELDS + NET CALC       //
//-----------------------------------------------------------//

document.getElementById('numBusinesses').addEventListener('input', function() {
    const businessCount = parseInt(this.value, 10);
    const container = document.getElementById('businessContainer');
    container.innerHTML = ''; // Clear existing fields

    if (!isNaN(businessCount) && businessCount > 0) {
        for (let i = 1; i <= businessCount; i++) {
            createBusinessFields(container, i);
        }
    }
});

function createBusinessFields(container, index) {
    const businessDiv = document.createElement('div');
    businessDiv.classList.add('business-entry');

    const heading = document.createElement('h3');
    heading.textContent = `Business ${index}`;
    businessDiv.appendChild(heading);

    // Business Type
    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
    businessDiv.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.name = `business${index}Type`;
    typeSelect.id = `business${index}Type`;

    const types = ["Please Select", "S-Corp", "Partnership", "C-Corp", "Schedule-C"];
    types.forEach(t => {
        let opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });
    businessDiv.appendChild(typeSelect);

    // Business Name
    createLabelAndTextField(businessDiv, `business${index}Name`, `Business ${index} Name:`);

    // Ownership %
    createLabelAndNumberField(businessDiv, `business${index}Ownership`, `Ownership %:`, 0);

    // Income
    createLabelAndCurrencyField(businessDiv, `business${index}Income`, `Income:`);

    // Expenses
    createLabelAndCurrencyField(businessDiv, `business${index}Expenses`, `Expenses:`);

    // Net (Income - Expenses)
    createLabelAndTextField(businessDiv, `business${index}Net`, `Net (Income - Expenses):`);
    container.appendChild(businessDiv);

    // The newly created 'Net' field
    const netField = document.getElementById(`business${index}Net`);
    netField.readOnly = true;

    // Income + Expenses listeners
    const incomeField = document.getElementById(`business${index}Income`);
    const expensesField = document.getElementById(`business${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
    });
    expensesField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
    });

    // If Ownership < 100, show spouse/other
    const ownershipField = document.getElementById(`business${index}Ownership`);
    ownershipField.addEventListener('change', function() {
        checkOwnership(index, this.value);
    });
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

function createLabelAndNumberField(parent, id, labelText, minValue) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.name = id;
    input.min = minValue;
    parent.appendChild(input);

    // Adds event listener to round to two decimal places on blur
    input.addEventListener('blur', function() {
        let value = parseFloat(input.value);
        if (!isNaN(value)) {
            input.value = value.toFixed(4);
        }
    });
}

function createLabelAndCurrencyField(parent, id, labelText) {
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

    // On blur, format as currency
    input.addEventListener('blur', function() {
        input.value = formatCurrency(input.value);
    });
}

function updateBusinessNet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;
    document.getElementById(`business${index}Net`).value = formatCurrency(netVal.toString());
}

function checkOwnership(index, ownershipValue) {
    const ownership = parseFloat(ownershipValue) || 0;
    const existingAdditionalOwnerDiv = document.getElementById(`additionalOwner${index}`);
    if (existingAdditionalOwnerDiv) {
        existingAdditionalOwnerDiv.remove();
    }
    if (ownership < 100) {
        const additionalOwnerDiv = document.createElement('div');
        additionalOwnerDiv.classList.add('form-group');
        additionalOwnerDiv.id = `additionalOwner${index}`;
        additionalOwnerDiv.style.marginTop = '12px';

        const remainingOwnership = (100 - ownership).toFixed(4);

        const additionalOwnerLabel = document.createElement('label');
        additionalOwnerLabel.textContent = `Who owns the remaining ${remainingOwnership}% of this business?`;
        additionalOwnerDiv.appendChild(additionalOwnerLabel);

        const additionalOwnerSelect = document.createElement('select');
        additionalOwnerSelect.name = `additionalOwner${index}`;
        additionalOwnerSelect.id = `additionalOwner${index}`;

        const optionPleaseSelect = document.createElement('option');
        optionPleaseSelect.value = '';
        optionPleaseSelect.textContent = 'Please Select';
        additionalOwnerSelect.appendChild(optionPleaseSelect);

        const optionSpouse = document.createElement('option');
        optionSpouse.value = 'Spouse';
        optionSpouse.textContent = 'Spouse';
        additionalOwnerSelect.appendChild(optionSpouse);

        const optionOther = document.createElement('option');
        optionOther.value = 'Other';
        optionOther.textContent = 'Other';
        additionalOwnerSelect.appendChild(optionOther);

        additionalOwnerDiv.appendChild(additionalOwnerSelect);

        // Insert under the same business block
        document.getElementById(`business${index}Type`).parentNode.appendChild(additionalOwnerDiv);
    }
}

//--------------------------------------------------//
// 9. DYNAMIC GENERATION OF SCHEDULE E FIELDS + NET //
//--------------------------------------------------//

document.getElementById('numScheduleEs').addEventListener('input', function() {
    const eCount = parseInt(this.value, 10);
    const container = document.getElementById('scheduleEsContainer');
    container.innerHTML = ''; // Clear existing fields

    if (!isNaN(eCount) && eCount > 0) {
        for (let i = 1; i <= eCount; i++) {
            createScheduleEFields(container, i);
        }
    }
});

function createScheduleEFields(container, index) {
    const scheduleEDiv = document.createElement('div');
    scheduleEDiv.classList.add('schedule-e-entry');

    // Add a heading for visual clarity
    const heading = document.createElement('h3');
    heading.textContent = `Schedule-E ${index}`;
    scheduleEDiv.appendChild(heading);

    // Schedule E Income
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Income`, `Schedule E-${index} Income:`);

    // Schedule E Expenses
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Expenses`, `Schedule E-${index} Expenses:`);

    // Net (Income - Expenses)
    createLabelAndTextField(scheduleEDiv, `scheduleE${index}Net`, `Schedule E-${index} Net (Income - Expenses):`);
    container.appendChild(scheduleEDiv);

    // The newly created Net field should be read-only:
    const netField = document.getElementById(`scheduleE${index}Net`);
    netField.readOnly = true;

    // Income + Expenses listeners
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

// Calculate net for each Schedule E
function updateScheduleENet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`scheduleE${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`scheduleE${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;
    document.getElementById(`scheduleE${index}Net`).value = formatCurrency(netVal.toString());
}

//-------------------------------------------------------//
// 10. REAL-TIME CALCULATIONS FOR INCOME/ADJUSTMENTS     //
//-------------------------------------------------------//

function recalculateTotals() {
    // Income fields
    const wages = getFieldValue('wages');
    const reasonableCompensation = getFieldValue('reasonableCompensation');
    const taxExemptInterest = getFieldValue('taxExemptInterest');
    const taxableInterest = getFieldValue('taxableInterest');
    const taxableIRA = getFieldValue('taxableIRA');
    const taxableDividends = getFieldValue('taxableDividends');
    const qualifiedDividends = getFieldValue('qualifiedDividends');
    const iraDistributions = getFieldValue('iraDistributions');
    const pensions = getFieldValue('pensions');
    const longTermCapitalGains = getFieldValue('longTermCapitalGains');
    const shortTermCapitalGains = getFieldValue('shortTermCapitalGains');
    const otherIncome = getFieldValue('otherIncome');
    const interestPrivateBonds = getFieldValue('interestPrivateBonds');
    const passiveActivityLossAdjustments = getFieldValue('passiveActivityLossAdjustments');
    const qualifiedBusinessDeduction = getFieldValue('qualifiedBusinessDeduction');

    // Combines net from dynamic businesses
    let businessesNetTotal = 0;
    const numBusinessesVal = parseInt(document.getElementById('numBusinesses').value || '0', 10);
    for (let i = 1; i <= numBusinessesVal; i++) {
        const netValStr = document.getElementById(`business${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        businessesNetTotal += netVal;
    }

    // Combines net from dynamic Schedule E
    let scheduleEsNetTotal = 0;
    const numScheduleEsVal = parseInt(document.getElementById('numScheduleEs')?.value || '0', 10);
    for (let i = 1; i <= numScheduleEsVal; i++) {
        const netValStr = document.getElementById(`scheduleE${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        scheduleEsNetTotal += netVal;
    }

    // Sum everything
    const totalIncomeVal =
        wages +
        reasonableCompensation +
        taxExemptInterest +
        taxableInterest +
        taxableIRA +
        taxableDividends +
        qualifiedDividends +
        iraDistributions +
        pensions +
        longTermCapitalGains +
        shortTermCapitalGains +
        businessesNetTotal +
        scheduleEsNetTotal +
        otherIncome +
        interestPrivateBonds +
        passiveActivityLossAdjustments +
        qualifiedBusinessDeduction;

    // Adjustments
    const halfSETax = getFieldValue('halfSETax');
    const retirementDeduction = getFieldValue('retirementDeduction');
    const medicalReimbursementPlan = getFieldValue('medicalReimbursementPlan');
    const SEHealthInsurance = getFieldValue('SEHealthInsurance');
    const alimonyPaid = getFieldValue('alimonyPaid');
    const otherAdjustments = getFieldValue('otherAdjustments');

    // Adjusted Gross Income
    const totalAdjustedGrossIncomeVal =
        totalIncomeVal -
        halfSETax -
        retirementDeduction -
        medicalReimbursementPlan -
        SEHealthInsurance -
        alimonyPaid -
        otherAdjustments;

    // Update read-only fields
    document.getElementById('totalIncome').value = totalIncomeVal.toFixed(2);
    document.getElementById('totalAdjustedGrossIncome').value = totalAdjustedGrossIncomeVal.toFixed(2);

    // Also recalc taxable income
    updateTaxableIncome();
}

//--------------------------------------------------------//
// 11. REAL-TIME CALCULATIONS FOR DEDUCTIONS + TAXABLE    //
//--------------------------------------------------------//

function recalculateDeductions() {
    const medical = getFieldValue('medical');
    const stateAndLocalTaxes = getFieldValue('stateAndLocalTaxes');
    const otherTaxesFromSchK1 = getFieldValue('otherTaxesFromSchK-1');
    const interest = getFieldValue('interest');
    const contributions = getFieldValue('contributions');
    const otherDeductions = getFieldValue('otherDeductions');
    const carryoverLoss = getFieldValue('carryoverLoss');
    const casualtyAndTheftLosses = getFieldValue('casualtyAndTheftLosses');
    const miscellaneousDeductions = getFieldValue('miscellaneousDeductions');
    const standardOrItemizedDeduction = getFieldValue('standardOrItemizedDeduction');

    const totalDeductionsVal =
        medical +
        stateAndLocalTaxes +
        otherTaxesFromSchK1 +
        interest +
        contributions +
        otherDeductions +
        carryoverLoss +
        casualtyAndTheftLosses +
        miscellaneousDeductions +
        standardOrItemizedDeduction;

    document.getElementById('totalDeductions').value = totalDeductionsVal.toFixed(2);

    // Then update Taxable Income
    updateTaxableIncome();
}

function updateTaxableIncome() {
    const totalAdjustedGrossIncome = getFieldValue('totalAdjustedGrossIncome');
    const totalDeductions = getFieldValue('totalDeductions');
    const taxableIncome = totalAdjustedGrossIncome - totalDeductions;
    document.getElementById('taxableIncome').value = taxableIncome.toFixed(2);
}

//-----------------------------------------------------------//
// 12. ATTACHING EVENT LISTENERS FOR REAL-TIME CALCULATIONS  //
//-----------------------------------------------------------//

// Fields that affect totalIncome and AGI:
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

// Fields that affect totalDeductions:
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

//-----------------------------------------------------------//
// 13. TURNS INPUT FIELD BORDER COLOR GREEN TO CONFIRM INPUT //
//-----------------------------------------------------------//

document.addEventListener('blur', function(event) {
    if (event.target.matches('input, select')) {
        // Check if the input or select has a value
        if (event.target.value.trim() !== '') {
            event.target.classList.add('input-completed');
        } else {
            event.target.classList.remove('input-completed'); // Remove if no value
        }
    }
}, true);
  
//------------------------------------------//
// 14. INITIALIZE CALCULATIONS ON PAGE LOAD //
//------------------------------------------//

document.addEventListener('DOMContentLoaded', function() {
    // Trigger initial calculations if default values exist:
    recalculateTotals();
    recalculateDeductions();
});

//--------------------------------------//
// 15. AUTO-COPY STATE TO "SELECTSTATE" //
//--------------------------------------//

document.getElementById('state').addEventListener('input', function() {
    document.getElementById('selectState').value = this.value;
});

//-----------------------------//
// 16. HANDLE "ENTER" AS "TAB" //
//-----------------------------//

document.getElementById('taxForm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission on Enter key

        // Collect all focusable elements (inputs and selects)
        const focusable = Array.from(this.elements).filter(
            el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        );

        // Find the index of the currently focused element
        const index = focusable.indexOf(document.activeElement);

        if (index > -1 && index < focusable.length - 1) {
            // Move to the next element
            focusable[index + 1].focus();
        } else if (index === focusable.length - 1) {
            // Loop back to the first element if on the last input
            focusable[0].focus();
        }
    }
});

//--------------------------------//
// 17. COLLAPSIBLE SECTIONS        //
//--------------------------------//

function toggleCollapsible(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('active');
}